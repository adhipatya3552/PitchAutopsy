import { mastra } from './mastra/index.js';

async function main() {
  console.log('\n==========================================================');
  console.log('[Test Runner] Starting Pitch Analysis Workflow Execution');
  console.log('==========================================================\n');

  try {
    const workflow = mastra.getWorkflow('pitchAnalysisWorkflow');
    if (!workflow) {
      throw new Error('Workflow not found in Mastra registry');
    }

    console.log('[Test Runner] Creating run for pitchAnalysisWorkflow...');
    const run = await workflow.createRun();

    console.log('[Test Runner] Starting workflow execution with inputData...');
    const runResult = await run.start({
      inputData: {
        pdfPath: './sample.pdf', // Path to sample.pdf in the PitchAutopsy directory
      },
    });

    console.log('\n==========================================================');
    console.log(`[Test Runner] Execution Completed. Status: ${runResult.status}`);
    console.log('==========================================================\n');

    if (runResult.status === 'success') {
      const output = runResult.result;
      console.log('--- WORKFLOW OUTPUTS ---');
      console.log(`\n[PDF Parser] Extracted Text Length: ${output.extractedText?.length || 0} chars.`);
      
      console.log('\n[Devil\'s Advocate] Investor Questions:');
      console.log(output.investorQuestions);

      console.log('\n[Market Validator] Market Validation Report:');
      console.log(output.validationReport);

      console.log('\n================= FINAL SYNTHESIZED ACTION PLAN =================');
      console.log(output.finalReport);
      console.log('=================================================================\n');
    } else {
      console.log('Workflow execution failed or suspended:', runResult);
    }

  } catch (error) {
    console.error('[Error] Pitch Analysis Workflow execution failed:', error);
  }
}

main();
