import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { getModel } from '../model';
import { pdfParserTool } from '../tools/pdf-parser-tool';

export const orchestratorAgent = new Agent({
  id: 'orchestrator-agent',
  name: 'Orchestrator Agent',
  instructions: `You are the primary coordinator and Orchestrator Agent for PitchAutopsy.
Your role today is to receive a PDF file path of a startup pitch deck, use the pdf-parser tool to extract its raw text content, and return that raw text.

In your final response:
- Output the raw text of the PDF exactly as extracted.
- Do not add conversational fluff or formatting unless specifically requested.`,
  model: getModel() as any,
  tools: { pdfParserTool },
  memory: new Memory(),
});
