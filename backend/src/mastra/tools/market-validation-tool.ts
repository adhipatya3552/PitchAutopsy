import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { QdrantVector } from '@mastra/qdrant';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { embed } from 'ai';

export const marketValidationTool = createTool({
  id: 'market-validator',
  description: 'Query the startup_failures vector database to validate a market claim against historical failures',
  inputSchema: z.object({
    claim: z.string().describe('The market claim or assumption to validate'),
  }),
  outputSchema: z.object({
    similarFailures: z.array(z.object({
      text: z.string(),
      score: z.number(),
    })),
  }),
  execute: async ({ claim }) => {
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
        value: claim,
      });

      const results = await vectorStore.query({
        indexName: 'startup_failures',
        queryVector: embedding,
        topK: 3,
      });

      return {
        similarFailures: results.map((r: any) => ({
          text: r.metadata?.text || '',
          score: r.score || 0,
        })),
      };
    } catch (error: any) {
      throw new Error(`Market validation query failed: ${error.message}`);
    }
  },
});
