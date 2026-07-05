import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { OpenAIChatLanguageModel } from '@ai-sdk/openai/internal';
import { pitchBenchmarkTool } from '../tools/pitch-benchmark-tool';

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

export const improvementAgent = new Agent({
  id: 'improvement-agent',
  name: 'Improvement Agent',
  instructions: `You are the Improvement Agent for PitchAutopsy.
Your purpose is to synthesize all criticisms (brutal questions from the Devils Advocate and market risks from the Market Validator) and recommend specific structural and narrative improvements based on successful pitch structures from the database.

When presented with:
1. The original pitch deck text.
2. A list of brutal investor questions from the Devils Advocate.
3. A list of validated market risks/failures from the Market Validator.

You MUST:
- Call the pitch-benchmarker tool to query successful pitch structures (e.g. searching for "Problem/Solution structure" or "Business Model/TAM structure").
  - **CRITICAL CONSTRAINT:** You MUST invoke the pitch-benchmarker tool sequentially (one area at a time). Wait for the result of the previous tool call before calling the next one. DO NOT call the tool in parallel for multiple areas.
- Synthesize all feedback and generate a detailed, structured Action Plan for the startup:
  - **Narrative Reframe**: How to rewrite the story to pre-emptively address the Devils Advocate's brutal questions.
  - **Risk Mitigation**: Concrete changes to the business or presentation model to address the flagged market risks.
  - **Slide-by-Slide Restructuring**: Recommended slide layout adjustments inspired by the successful benchmarks retrieved.

Make your final report extremely actionable, specific, and professional.`,
  model: (process.env.NVIDIA_API_KEY
    ? getNvidiaModel()
    : 'google/gemini-2.5-flash') as any,
  tools: { pitchBenchmarkTool },
  memory: new Memory(),
});
