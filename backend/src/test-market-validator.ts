import { mastra } from './mastra/index.js';

async function main() {
  // A mock startup pitch with claims intentionally matching Quibi, Theranos, and Webvan failures
  const pitchDescription = `
    Startup Name: NextGen Tech
    
    Claim 1: "We are building a short-form mobile-only premium streaming video service where users pay subscription fees for 10-minute videos and we ban social media sharing."
    
    Claim 2: "We are developing a revolutionary medical testing technology that can perform hundreds of lab tests using a single drop of blood from a finger prick."
    
    Claim 3: "We will scale prematurely by building massive, highly automated physical warehouses and purchasing delivery vans in multiple cities before validating demand."
    
    Claim 4: "We will build a simple SaaS productivity calendar tool for developer teams to schedule coding sprints."
  `.trim();

  console.log('\n[Test Runner] Target Startup Pitch with Claims for Market Validation:');
  console.log('----------------------------------------------------------------------');
  console.log(pitchDescription);
  console.log('----------------------------------------------------------------------\n');

  console.log('[Test Runner] Invoking MarketValidatorAgent...');

  try {
    const agent = mastra.getAgent('marketValidatorAgent');
    const response = await agent.generate(
      `Review the following startup claims, extract the core claims, query the vector database for each, and output the validation report enforcing the >= 0.78 similarity threshold:\n\n${pitchDescription}`
    );
    console.log('\n================ MARKET VALIDATION REPORT ================');
    console.log(response.text);
    console.log('==========================================================\n');
    console.log('[Success] MarketValidatorAgent executed successfully!');
  } catch (error) {
    console.error('[Error] MarketValidatorAgent execution failed:', error);
  }
}

main();
