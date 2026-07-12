import { QdrantVector } from '@mastra/qdrant';
import { getEmbeddingModel } from './mastra/model';
import { embedMany } from 'ai';

// Clean up text for easier reading
function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

async function populate() {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.error('[Error] QDRANT_URL or QDRANT_API_KEY is not defined.');
    process.exit(1);
  }

  console.log('Connecting to Qdrant Cloud...');
  const vectorStore = new QdrantVector({
    id: 'qdrant-store',
    url,
    apiKey,
  });

  const embedder = getEmbeddingModel();

  // 1. Startup Failures Dataset
  const startupFailures = [
    {
      concept: 'Blood Testing Finger Prick technology',
      text: cleanText(`
        Theranos (HealthTech): Claimed revolutionary medical testing technology that could perform hundreds of lab tests 
        using a single drop of blood from a finger prick. The failure was caused by premature scaling, active deception, 
        and the fact that the underlying physical microfluidics technology was scientifically impossible. They ended up 
        faking results and running tests on commercial lab equipment behind the scenes.
      `),
    },
    {
      concept: 'Short-form premium mobile video Quibi',
      text: cleanText(`
        Quibi (Media/Entertainment): A short-form mobile-only premium streaming video service. They raised $1.7B and failed 
        within 6 months. Main failure points: they banned social media sharing (screenshots/clips), forced a strict mobile-only 
        format (users couldn't cast to TVs initially), and heavily miscalculated consumer behavior by assuming people would 
        pay premium subscription fees for 10-minute videos.
      `),
    },
    {
      concept: 'One-click checkout and ecommerce Fast checkout',
      text: cleanText(`
        Fast (FinTech): Offered a fast, one-click checkout system for e-commerce stores. Failed due to massive capital burn rate, 
        low actual merchant adoption, and a major discrepancy between public sales growth claims and negligible repeat transaction 
        volume. They spent wildly on celebrity sponsorships before establishing true product-market fit.
      `),
    },
    {
      concept: 'Premature physical fleet scaling Webvan grocery',
      text: cleanText(`
        Webvan (E-commerce/Logistics): An early dot-com grocery delivery service. They raised hundreds of millions and scaled 
        prematurely by building massive, highly automated physical warehouses and purchasing delivery vans in multiple cities 
        before validating if consumers actually wanted online groceries. This extreme CapEx burned their runway before the market matured.
      `),
    },
    {
      concept: 'Sidewalk personal transportation Segway',
      text: cleanText(`
        Segway (Hardware/Urban Mobility): A self-balancing two-wheeled personal transport device. Failed because of a very 
        high price tag ($5,000 at launch), lack of urban sidewalk infrastructure, and subsequent regulatory bans on sidewalks 
        due to pedestrian safety concerns. The product lacked a clear consumer demand or use-case outside niche security/tourist fleets.
      `),
    },
    {
      concept: 'Juicero expensive home smart juicer machine',
      text: cleanText(`
        Juicero (Hardware/Consumer Goods): A high-tech, connected $400 home juicing machine that squeezed proprietary juice packs. 
        It failed when journalists discovered that the juice packs could be squeezed just as quickly and effectively by hand 
        without using the expensive machine at all. This made the physical hardware obsolete and turned the brand into a laughingstock.
      `)
    }
  ];

  // 2. Common Investor Questions Dataset
  const investorQuestions = [
    {
      category: 'Unit Economics',
      text: cleanText(`
        What are your customer acquisition costs (CAC) compared to your customer lifetime value (LTV)? If your sales model 
        requires paid marketing, show us the unit economic payback period and retention curve.
      `),
    },
    {
      category: 'Defensibility',
      text: cleanText(`
        What is your competitive moat? If a giant like Microsoft, Google, or Amazon copies this feature next week and offers 
        it for free, what keeps your customers from switching immediately?
      `),
    },
    {
      category: 'Operational Complexity',
      text: cleanText(`
        Your model relies heavily on physical logistics or fleet management. How do you scale operations, manage depreciation, 
        and handle liability without burning through your capital?
      `),
    },
    {
      category: 'Market Validation',
      text: cleanText(`
        How have you validated that this problem is a top-3 priority for your target buyers? Show us evidence of organic 
        demand (e.g., active pilots, letters of intent, waitlists) rather than just survey data.
      `),
    }
  ];

  // 3. Pitch Benchmarks Dataset
  const pitchBenchmarks = [
    {
      structure: 'Problem and Solution slides',
      text: cleanText(`
        Airbnb Pitch Structure: Focuses immediately on the problem (high hotel prices, lack of local connection) followed by 
        a simple, clear solution (a platform to book rooms from locals). Keep descriptions down to one sentence.
      `),
    },
    {
      structure: 'Business Model and Market Size slides',
      text: cleanText(`
        Uber Pitch Structure: Clearly outlines the target addressable market (TAM) using taxi market revenue metrics, followed 
        by a clear transactional business model (taking a fixed percentage cut from every ride).
      `),
    }
  ];

  // Populate startup_failures
  console.log('\nEmbedding and populating "startup_failures"...');
  const failureValues = startupFailures.map(f => f.text);
  const failureEmbeds = await embedMany({
    model: embedder,
    values: failureValues,
  });
  await vectorStore.upsert({
    indexName: 'startup_failures',
    vectors: failureEmbeds.embeddings,
    metadata: startupFailures.map(f => ({ text: f.text, concept: f.concept })),
  });
  console.log(`Upserted ${startupFailures.length} records into "startup_failures".`);

  // Populate investor_questions
  console.log('\nEmbedding and populating "investor_questions"...');
  const questionValues = investorQuestions.map(q => q.text);
  const questionEmbeds = await embedMany({
    model: embedder,
    values: questionValues,
  });
  await vectorStore.upsert({
    indexName: 'investor_questions',
    vectors: questionEmbeds.embeddings,
    metadata: investorQuestions.map(q => ({ text: q.text, category: q.category })),
  });
  console.log(`Upserted ${investorQuestions.length} records into "investor_questions".`);

  // Populate pitch_benchmarks
  console.log('\nEmbedding and populating "pitch_benchmarks"...');
  const benchmarkValues = pitchBenchmarks.map(b => b.text);
  const benchmarkEmbeds = await embedMany({
    model: embedder,
    values: benchmarkValues,
  });
  await vectorStore.upsert({
    indexName: 'pitch_benchmarks',
    vectors: benchmarkEmbeds.embeddings,
    metadata: pitchBenchmarks.map(b => ({ text: b.text, structure: b.structure })),
  });
  console.log(`Upserted ${pitchBenchmarks.length} records into "pitch_benchmarks".`);

  console.log('\n[Qdrant Population] Seeding completed successfully!');
}

populate().catch(err => {
  console.error('[Error] Population failed:', err);
  process.exit(1);
});
