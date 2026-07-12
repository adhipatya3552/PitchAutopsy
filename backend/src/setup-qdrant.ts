import { QdrantClient } from '@qdrant/js-client-rest';

async function setupQdrant() {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.error('[Error] QDRANT_URL or QDRANT_API_KEY is not defined in the environment.');
    process.exit(1);
  }

  console.log(`Connecting to Qdrant Cloud cluster at: ${url}`);
  const client = new QdrantClient({ url, apiKey });

  const collections = [
    'startup_failures',
    'investor_questions',
    'pitch_benchmarks',
    'user_history'
  ];

  for (const name of collections) {
    try {
      console.log(`Checking collection: "${name}"...`);
      const info = await client.getCollection(name);
      const existingSize = (info.config as any)?.params?.vectors?.size;
      if (existingSize !== 1024) {
        console.log(`-> Collection "${name}" exists but has mismatched dimensions (${existingSize}). Deleting and recreating...`);
        await client.deleteCollection(name);
        await client.createCollection(name, {
          vectors: {
            size: 1024, // 1024 dimensions for Qwen/Qwen3-Embedding-0.6B model
            distance: 'Cosine',
          },
        });
        console.log(`-> Collection "${name}" recreated with 1024 dimensions!`);
      } else {
        console.log(`-> Collection "${name}" already exists with correct dimensions (1024).`);
      }
    } catch (error: any) {
      // Typically throws a 404 error if it does not exist
      console.log(`-> Collection "${name}" not found. Creating...`);
      try {
        await client.createCollection(name, {
          vectors: {
            size: 1024, // 1024 dimensions for Qwen/Qwen3-Embedding-0.6B model
            distance: 'Cosine',
          },
        });
        console.log(`-> Collection "${name}" created successfully with 3072 dimensions!`);
      } catch (createErr: any) {
        console.error(`[Error] Failed to create collection "${name}":`, createErr.message || createErr);
      }
    }
  }
  console.log('\n[Qdrant Setup] Completed checking and creating all 4 collections.');
}

setupQdrant().catch(err => {
  console.error('[Error] Fatal error during setup:', err);
  process.exit(1);
});
