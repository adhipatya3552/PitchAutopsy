import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { pdfParserTool } from '../tools/pdf-parser-tool';
import { checkSafetyWithEnkrypt } from '../public/enkrypt';

/** Cap huge decks so agent latency stays bounded (head + tail keeps both ends of pitch). */
function clipForAgent(text: string, maxChars = 14000): string {
  if (!text || text.length <= maxChars) return text;
  const half = Math.floor(maxChars / 2) - 40;
  console.log(
    `[Workflow] Clipping pitch text from ${text.length} to ~${maxChars} chars for agent prompts`
  );
  return `${text.slice(0, half)}\n\n[... middle of deck omitted for length ...]\n\n${text.slice(-half)}`;
}

// Enkrypt safety gate: 1 generate + optional 1 retry (faster; still gated)
async function generateWithSafetyGate({
  agent,
  basePrompt,
  agentName,
}: {
  agent: any;
  basePrompt: string;
  agentName: string;
}): Promise<string> {
  let attempt = 0;
  const maxAttempts = 2; // 1 initial + 1 retry
  let currentPrompt = basePrompt;
  let responseText = '';

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`[Safety Gate] Attempt ${attempt} for ${agentName}...`);
    const response = await agent.generate(currentPrompt);
    responseText = response.text;

    const safetyResult = await checkSafetyWithEnkrypt({
      text: responseText,
      agentName,
      model: agent.model,
    });

    if (safetyResult.passed) {
      console.log(`[Safety Gate] ${agentName} passed safety check on attempt ${attempt}`);
      return responseText;
    }

    console.warn(
      `[Safety Gate] ${agentName} failed safety check on attempt ${attempt}. Reasons:\n`,
      safetyResult.reasons.join('\n')
    );

    if (attempt < maxAttempts) {
      currentPrompt = `
Here is your previous generation output:
---
${responseText}
---
The safety checker flagged this output for the following reasons:
${safetyResult.reasons.map((r: string) => `- ${r}`).join('\n')}

Please regenerate, fully correcting all of these issues while maintaining the original requirements:
${basePrompt}
      `.trim();
    }
  }

  console.error(`[Safety Gate] All ${maxAttempts} attempts failed for ${agentName}. Returning latest output.`);
  return responseText;
}

// Step 1: Parse PDF
// Accepts either a local path (same-machine dev) or base64 bytes (Vercel → Render).
const parsePdfStep = createStep({
  id: 'parse-pdf-step',
  description: 'Extracts raw text from the pitch deck PDF file',
  inputSchema: z.object({
    pdfPath: z.string().optional(),
    pdfBase64: z.string().optional(),
    fileName: z.string().optional(),
  }),
  outputSchema: z.object({
    extractedText: z.string(),
  }),
  execute: async ({ inputData }) => {
    let pdfPath = inputData?.pdfPath;

    // Remote deploy: frontend sends base64; write onto THIS server's disk
    if (inputData?.pdfBase64) {
      const uploadDir = join(tmpdir(), 'pitchautopsy');
      await mkdir(uploadDir, { recursive: true });
      const safeName = (inputData.fileName || 'deck.pdf').replace(/[^\w.\-]+/g, '_');
      pdfPath = join(uploadDir, `${randomUUID()}-${safeName}`);
      await writeFile(pdfPath, Buffer.from(inputData.pdfBase64, 'base64'));
      console.log(`[Workflow Step] Wrote uploaded PDF to ${pdfPath}`);
    }

    if (!pdfPath) {
      throw new Error('PDF not provided (need pdfBase64 or pdfPath)');
    }

    console.log(`[Workflow Step] Parsing PDF at: ${pdfPath}`);
    if (!pdfParserTool.execute) {
      throw new Error('pdfParserTool.execute is undefined');
    }
    const result = await pdfParserTool.execute({ pdfPath }, {} as any) as { text: string };
    console.log(`[Workflow Step] Extracted ${result.text.length} characters.`);
    return {
      extractedText: result.text,
    };
  },
});

// Step 2: Devil's Advocate analysis
const devilsAdvocateStep = createStep({
  id: 'devils-advocate-step',
  description: 'Generates brutal investor questions from the extracted pitch text',
  inputSchema: z.object({
    extractedText: z.string(),
  }),
  outputSchema: z.object({
    investorQuestions: z.string(),
    extractedText: z.string(), // pass-through for downstream steps
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData?.extractedText) {
      throw new Error('Extracted text not found');
    }
    console.log('[Workflow Step] Running DevilsAdvocateAgent...');
    const agent = mastra?.getAgent('devilsAdvocateAgent');
    if (!agent) {
      throw new Error('DevilsAdvocateAgent not registered');
    }

    const pitch = clipForAgent(inputData.extractedText);
    const basePrompt = `Generate exactly 10 brutal investor questions for the following startup pitch.

STRICT OUTPUT RULES:
- Plain text only. Do NOT use Markdown (no **, __, #, or backticks).
- Format each item exactly as:
1. Question: <question ending with ?>
   Why: <1-2 sentences>

2. Question: ...
   Why: ...

Pitch text:
${pitch}`;
    const resultText = await generateWithSafetyGate({
      agent,
      basePrompt,
      agentName: "Devil's Advocate",
    });

    console.log('[Workflow Step] DevilsAdvocateAgent finished.');
    return {
      investorQuestions: resultText,
      extractedText: inputData.extractedText,
    };
  },
});

// Step 3: Market Validator analysis
const marketValidatorStep = createStep({
  id: 'market-validator-step',
  description: 'Cross-references pitch claims against historical failure post-mortems',
  inputSchema: z.object({
    extractedText: z.string(),
    investorQuestions: z.string(),
  }),
  outputSchema: z.object({
    validationReport: z.string(),
    investorQuestions: z.string(),
    extractedText: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData?.extractedText) {
      throw new Error('Extracted text not found');
    }
    console.log('[Workflow Step] Running MarketValidatorAgent...');
    const agent = mastra?.getAgent('marketValidatorAgent');
    if (!agent) {
      throw new Error('MarketValidatorAgent not registered');
    }

    const pitch = clipForAgent(inputData.extractedText);
    const basePrompt = `Extract exactly 3 core claims from this pitch, query the vector database for each claim sequentially, and output the validation report (threshold similarity >= 0.78). Plain text only.

Use this format per claim:
Claim: ...
Validation Status: Safe | HIGH_RISK
Similarity Score: ...
Lesson: ...
Match: ...

Pitch text:
${pitch}`;
    const resultText = await generateWithSafetyGate({
      agent,
      basePrompt,
      agentName: "Market Validator",
    });

    console.log('[Workflow Step] MarketValidatorAgent finished.');
    return {
      validationReport: resultText,
      investorQuestions: inputData.investorQuestions,
      extractedText: inputData.extractedText,
    };
  },
});

// Step 4: Synthesis & Action Plan
const improvementStep = createStep({
  id: 'improvement-step',
  description: 'Synthesizes questions and market risks to output an actionable slide redesign report',
  inputSchema: z.object({
    extractedText: z.string(),
    investorQuestions: z.string(),
    validationReport: z.string(),
  }),
  outputSchema: z.object({
    extractedText: z.string(),
    investorQuestions: z.string(),
    validationReport: z.string(),
    finalReport: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    console.log('[Workflow Step] Running ImprovementAgent...');
    const agent = mastra?.getAgent('improvementAgent');
    if (!agent) {
      throw new Error('ImprovementAgent not registered');
    }

    const pitch = clipForAgent(inputData.extractedText, 10000);
    const questions = clipForAgent(inputData.investorQuestions, 6000);
    const validation = clipForAgent(inputData.validationReport, 6000);

    const basePrompt = `
Below is analysis data for the startup pitch deck.

--- PITCH TEXT ---
${pitch}

--- DEVIL'S ADVOCATE QUESTIONS ---
${questions}

--- MARKET VALIDATION ---
${validation}

Call pitch-benchmarker at most twice (sequentially). Then output ONLY slide-by-slide rewrites in plain text:

Slide 1: <title>
Action: <2-4 sentences>

Slide 2: <title>
Action: <...>

Cover the main slides of the deck (up to 10). No markdown. No separate Narrative/Risk mega-sections after the slides.
    `.trim();

    const resultText = await generateWithSafetyGate({
      agent,
      basePrompt,
      agentName: "Improvement Agent",
    });

    console.log('[Workflow Step] ImprovementAgent finished.');

    return {
      extractedText: inputData.extractedText,
      investorQuestions: inputData.investorQuestions,
      validationReport: inputData.validationReport,
      finalReport: resultText,
    };
  },
});

export const pitchAnalysisWorkflow = createWorkflow({
  id: 'pitch-analysis-workflow',
  inputSchema: z.object({
    // Local path (same-machine) OR base64 for split deploy (Vercel + Render)
    pdfPath: z.string().optional(),
    pdfBase64: z.string().optional(),
    fileName: z.string().optional(),
  }),
  outputSchema: z.object({
    extractedText: z.string(),
    investorQuestions: z.string(),
    validationReport: z.string(),
    finalReport: z.string(),
  }),
})
  .then(parsePdfStep)
  .then(devilsAdvocateStep)
  .then(marketValidatorStep)
  .then(improvementStep);

pitchAnalysisWorkflow.commit();
