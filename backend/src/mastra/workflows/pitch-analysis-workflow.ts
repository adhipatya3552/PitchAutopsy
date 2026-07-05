import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { pdfParserTool } from '../tools/pdf-parser-tool';
import { checkSafetyWithEnkrypt } from '../public/enkrypt';

// Helper function to run agent generation through the Enkrypt AI Safety Gate with retry logic
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
  const maxAttempts = 3; // 1 initial + 2 retries
  let currentPrompt = basePrompt;
  let responseText = '';

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`[Safety Gate] Attempt ${attempt} for ${agentName}...`);
    const response = await agent.generate(currentPrompt);
    responseText = response.text;

    // Evaluate response text using the Enkrypt AI Safety Gate
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
      // Regrow prompt with safety failure feedback for the retry
      currentPrompt = `
Here is your previous generation output:
---
${responseText}
---
The safety checker flagged this output for the following reasons:
${safetyResult.reasons.map((r) => `- ${r}`).join('\n')}

Please regenerate, fully correcting all of these issues while maintaining the original requirements:
${basePrompt}
      `.trim();
    }
  }

  console.error(`[Safety Gate] All ${maxAttempts} attempts failed safety check for ${agentName}. Returning latest output.`);
  return responseText;
}

// Step 1: Parse PDF
const parsePdfStep = createStep({
  id: 'parse-pdf-step',
  description: 'Extracts raw text from the pitch deck PDF file',
  inputSchema: z.object({
    pdfPath: z.string(),
  }),
  outputSchema: z.object({
    extractedText: z.string(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData?.pdfPath) {
      throw new Error('PDF path not provided');
    }
    console.log(`[Workflow Step] Parsing PDF at: ${inputData.pdfPath}`);
    if (!pdfParserTool.execute) {
      throw new Error('pdfParserTool.execute is undefined');
    }
    const result = await pdfParserTool.execute({ pdfPath: inputData.pdfPath }, {} as any) as { text: string };
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

    const basePrompt = `Generate 10-15 brutal investor questions for the following startup pitch:\n\n${inputData.extractedText}`;
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

    const basePrompt = `Review the following startup claims, extract core claims, query the vector database, and output the validation report enforcing the >= 0.78 similarity threshold:\n\n${inputData.extractedText}`;
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

    const basePrompt = `
      Below is the complete analysis data for the startup pitch deck:

      --- ORIGINAL PITCH DECK TEXT ---
      ${inputData.extractedText}

      --- BRUTAL INVESTOR QUESTIONS (DEVIL'S ADVOCATE) ---
      ${inputData.investorQuestions}

      --- HISTORICAL FAILURE REPORT (MARKET VALIDATOR) ---
      ${inputData.validationReport}

      Please query the pitch benchmarks database for successful pitch structure formats. 
      Then, synthesize all of the above and generate a detailed Action Plan containing:
      1. Narrative Reframe (how to address the brutal questions proactively).
      2. Risk Mitigation (how to address the flagged market risks and failures).
      3. Slide-by-Slide Restructuring (specific slide improvements based on successful benchmarks).
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
    pdfPath: z.string(),
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
