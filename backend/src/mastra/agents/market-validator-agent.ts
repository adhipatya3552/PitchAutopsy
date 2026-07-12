import { Agent } from '@mastra/core/agent';
import { getModel } from '../model';
import { marketValidationTool } from '../tools/market-validation-tool';

export const marketValidatorAgent = new Agent({
  id: 'market-validator-agent',
  name: 'Market Validator Agent',
  instructions: `You are the Market Validator Agent for PitchAutopsy.
Validate market and growth claims against historical startup failure post-mortems in Qdrant.

When presented with pitch text:
1. Extract exactly 3 core claims/assumptions (market, GTM, unit economics, or tech).
2. For each claim, call the market-validator tool sequentially (one at a time — never parallel).
3. If similarity >= 0.78, flag HIGH_RISK with the failure match and lesson.
4. If similarity < 0.78, mark Safe.

Output format (plain text only — no Markdown, no ** or __):
For each claim:
Claim: <text>
Validation Status: Safe | HIGH_RISK
Similarity Score: <number>
Lesson: <brief summary>
Match: <failure name if any>`,
  model: getModel() as any,
  tools: { marketValidationTool },
});
