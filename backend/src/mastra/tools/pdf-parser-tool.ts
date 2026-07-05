import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';


export const pdfParserTool = createTool({
  id: 'pdf-parser',
  description: 'Parse a PDF file from a local path and extract its raw text content',
  inputSchema: z.object({
    pdfPath: z.string().describe('The local absolute or relative path to the PDF file'),
  }),
  outputSchema: z.object({
    text: z.string().describe('The raw text content extracted from the PDF'),
    numPages: z.number().describe('Number of pages in the PDF'),
  }),
  execute: async ({ pdfPath }) => {
    try {
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`File not found at path: ${pdfPath}`);
      }
      const dataBuffer = fs.readFileSync(pdfPath);
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      const info = await parser.getInfo();
      await parser.destroy();
      return {
        text: result.text,
        numPages: info.total,
      };
    } catch (error: any) {
      throw new Error(`Failed to parse PDF file at ${pdfPath}: ${error.message}`);
    }
  },
});
