import { mastra } from './mastra/index.js';
import { pdfParserTool } from './mastra/tools/pdf-parser-tool.js';
import * as path from 'path';


async function main() {
  const pdfArg = process.argv[2] || './sample.pdf';
  const pdfPath = path.resolve(pdfArg);
  
  console.log(`\n[Test Runner] Resolving PDF path: ${pdfPath}`);
  
  const googleKey = process.env.GOOGLE_API_KEY;
  const hasRealKey = googleKey && googleKey !== 'your_google_api_key_here';
  
  if (!hasRealKey) {
    console.log('\n[Warning] GOOGLE_API_KEY is not set in .env. Running local PDF parser tool directly...');
    try {
      if (pdfParserTool.execute) {
        const result = await pdfParserTool.execute({ pdfPath }, {} as any) as { text: string; numPages: number };
        console.log('\n================ TOOL EXTRACTION RESULT ================');
        console.log(`Parsed Pages: ${result.numPages}`);
        console.log(`Extracted Text:\n${result.text.trim()}`);
        console.log('========================================================\n');
        console.log('[Success] Local PDF parsing is working perfectly offline!');
      } else {
        console.error('[Error] Local PDF tool execute function is not defined.');
      }
    } catch (error) {
      console.error('[Error] Local PDF tool execution failed:', error);
    }
  } else {
    console.log('[Test Runner] GOOGLE_API_KEY is configured. Running Orchestrator Agent...');
    try {
      const orchestrator = mastra.getAgent('orchestratorAgent');
      const response = await orchestrator.generate(
        `Please parse the PDF at path: ${pdfPath} and output the raw text.`
      );
      console.log('\n================ AGENT EXTRACTION RESULT ================');
      console.log(response.text);
      console.log('=========================================================\n');
      console.log('[Success] Agent + PDF parser integration is working perfectly!');
    } catch (error) {
      console.error('[Error] Orchestrator Agent execution failed:', error);
    }
  }
}

main();
