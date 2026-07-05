import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { QdrantVector } from '@mastra/qdrant';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { embed } from 'ai';

export const pitchBenchmarkTool = createTool({
  id: 'pitch-benchmarker',
  description: 'Query the pitch_benchmarks vector database to fetch successful pitch structures/benchmarks',
  inputSchema: z.object({
    pitchArea: z.string().describe('The area of the pitch to benchmark (e.g. problem, solution, business model, market size)'),
  }),
  outputSchema: z.object({
    benchmarks: z.array(z.object({
      text: z.string(),
      score: z.number(),
    })),
  }),
  execute: async ({ pitchArea }) => {
    try {
      // Small delay to prevent rate limit issues on Google AI Studio Free Tier
      await new Promise(resolve => setTimeout(resolve, 2000));

      const vectorStore = new QdrantVector({
        id: 'qdrant-store',
        url: process.env.QDRANT_URL!,
        apiKey: process.env.QDRANT_API_KEY!,
      });

      const embedder = new ModelRouterEmbeddingModel("google/gemini-embedding-001");
      const { embedding } = await embed({
        model: embedder,
        value: pitchArea,
      });

      const results = await vectorStore.query({
        indexName: 'pitch_benchmarks',
        queryVector: embedding,
        topK: 2,
      });

      return {
        benchmarks: results.map((r: any) => ({
          text: r.metadata?.text || '',
          score: r.score || 0,
        })),
      };
    } catch (error: any) {
      throw new Error(`Pitch benchmark query failed: ${error.message}`);
    }
  },
});
