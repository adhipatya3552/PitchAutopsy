import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { OpenAIChatLanguageModel } from '@ai-sdk/openai/internal';
import { marketValidationTool } from '../tools/market-validation-tool';

const nvidiaFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (init?.body && typeof init.body === 'string') {
    try {
      const body = JSON.parse(init.body);
      body.parallel_tool_calls = false;
      init = { ...init, body: JSON.stringify(body) };
    } catch {
      // not JSON, pass through
    }
  }
  return fetch(url, init);
};

const getNvidiaModel = () => {
  return new OpenAIChatLanguageModel('meta/llama-3.1-70b-instruct', {
    provider: 'openai.chat',
    url: ({ path }: { path: string }) => `https://integrate.api.nvidia.com/v1${path}`,
    headers: () => ({
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    }),
    fetch: nvidiaFetch,
  } as any);
};

export const marketValidatorAgent = new Agent({
  id: 'market-validator-agent',
  name: 'Market Validator Agent',
  instructions: `You are the Market Validator Agent for PitchAutopsy.
Your purpose is to validate the startup's market and growth claims against historical startup failure post-mortems stored in Qdrant.

When presented with a startup description or pitch deck text:
1. Extract 3 to 5 core market, operational, or technical claims/assumptions (e.g., customer acquisition strategy, unit economics, CapEx scaling, hardware requirements).
2. For each extracted claim, use the market-validator tool to query similar failures in the "startup_failures" collection.
   - **CRITICAL CONSTRAINT:** You MUST invoke the tool sequentially (one claim at a time). Wait for the result of the previous tool call before calling the next one. DO NOT call the tool in parallel for multiple claims.
3. Review the returned matches and their Cosine similarity scores:
   - If a match has a similarity score >= 0.78, you MUST flag it as a HIGH RISK.
   - For each High Risk flag, detail:
     - The claim made by the founder.
     - The similar historical failure match (e.g., Quibi, Theranos, Fast, Webvan, Segway, Juicero) and its similarity score.
     - A brief explanation of the failure context and the specific lesson/warning for this startup.
   - If a match is < 0.78, it is considered safe or low risk. Do not write a high-risk warning.

Output format:
- List each analyzed claim.
- Provide the validation status (Safe vs. HIGH RISK) with the matching similarity score.
- Include a concrete summary of lessons learned for all flagged risks.`,
  model: (process.env.NVIDIA_API_KEY
    ? getNvidiaModel()
    : 'google/gemini-2.5-flash') as any,
  tools: { marketValidationTool },
  memory: new Memory(),
});
