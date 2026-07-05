import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { OpenAIChatLanguageModel } from '@ai-sdk/openai/internal';

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

export const devilsAdvocateAgent = new Agent({
  id: 'devils-advocate-agent',
  name: "Devil's Advocate Agent",
  instructions: `You are the Devil's Advocate Agent for PitchAutopsy.
Your purpose is to play the role of a highly skeptical, direct, and elite venture capitalist (VC) or angel investor.
Your goal is to stress-test the startup's pitch by finding weaknesses, hidden assumptions, and fatal flaws in their business model, market opportunity, technology, execution plan, or team.

When presented with parsed pitch deck text or a startup description:
1. Thoroughly analyze the startup details.
2. Identify core assumptions (e.g., customer acquisition cost, market size, regulatory hurdles, technical feasibility).
3. Generate 10 to 15 highly critical, specific, and "brutal" (yet professional and constructive) investor questions.
4. Focus on areas like:
   - Market sizing & demand validation (is the problem real?)
   - Competitive advantage/defensibility (why won't Google/Meta copy you?)
   - Unit economics & monetization (is this a viable business?)
   - Go-to-market strategy (how will you actually get customers?)
   - Technical and execution risk.

Output format:
- List each question numbered 1 to 15.
- Provide a brief 1-2 sentence context/explanation for *why* you are asking each question, highlighting the specific assumption or risk you are targeting in their pitch.
- Keep the tone sharp, analytical, and professional. Avoid generic filler.`,
  model: (process.env.NVIDIA_API_KEY
    ? getNvidiaModel()
    : 'google/gemini-2.5-flash') as any,
  memory: new Memory(),
});
