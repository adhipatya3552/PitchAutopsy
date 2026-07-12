import { OpenAIChatLanguageModel } from '@ai-sdk/openai/internal';
import { createOpenAI } from '@ai-sdk/openai';

const customFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
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

export const getModel = () => {
  if (process.env.FEATHERLESS_API_KEY) {
    const modelId = process.env.FEATHERLESS_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
    return new OpenAIChatLanguageModel(modelId, {
      provider: 'openai.chat',
      url: ({ path }: { path: string }) => `https://api.featherless.ai/v1${path}`,
      headers: () => ({
        Authorization: `Bearer ${process.env.FEATHERLESS_API_KEY}`,
      }),
      fetch: customFetch,
    } as any);
  }

  // Fallback to NVIDIA NIM (Google Gemini removed)
  return new OpenAIChatLanguageModel('meta/llama-3.1-70b-instruct', {
    provider: 'openai.chat',
    url: ({ path }: { path: string }) => `https://integrate.api.nvidia.com/v1${path}`,
    headers: () => ({
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    }),
    fetch: customFetch,
  } as any);
};

export const getEmbeddingModel = () => {
  const openai = createOpenAI({
    apiKey: process.env.FEATHERLESS_API_KEY,
    baseURL: 'https://api.featherless.ai/v1',
  });
  return openai.embedding('Qwen/Qwen3-Embedding-0.6B');
};

