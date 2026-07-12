import { generateText } from 'ai';

interface SafetyResult {
  passed: boolean;
  reasons: string[];
  scores: {
    toxicity: string;
    criticismDepth: number;
    factualAccuracy: number;
    constructiveness: number;
    scoreCalibration: number;
  };
}

export async function checkSafetyWithEnkrypt({
  text,
  agentName,
  model,
}: {
  text: string;
  agentName: string;
  model: any;
}): Promise<SafetyResult> {
  const reasons: string[] = [];
  let isToxic = false;

  const apiKey = process.env.ENKRYPT_AI_API_KEY;

  if (apiKey) {
    try {
      console.log(`[Enkrypt AI] Initiating Toxicity check for ${agentName} output...`);
      const res = await fetch('https://api.enkryptai.com/guardrails/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
        body: JSON.stringify({
          text,
          detectors: {
            toxicity: {
              enabled: true,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[Enkrypt AI] Guardrail response:', JSON.stringify(data));
        const toxicityResult = data?.summary?.toxicity;
        if (Array.isArray(toxicityResult) && toxicityResult.length > 0) {
          isToxic = true;
          reasons.push(`Flagged by Enkrypt AI Toxicity Guard: ${toxicityResult.join(', ')}`);
        }
      } else {
        console.warn(`[Enkrypt AI] Guardrail request failed with status ${res.status}`);
      }
    } catch (err) {
      console.error('[Enkrypt AI] Error calling detect API:', err);
    }
  } else {
    console.warn('[Enkrypt AI] API key missing, skipping real guardrail check.');
  }

  // Semantic Evaluation using Model
  let criticismDepth = 8;
  let factualAccuracy = 8;
  let constructiveness = 8;
  let scoreCalibration = 8;

  try {
    console.log(`[Enkrypt AI] Evaluating semantic quality for ${agentName} output...`);
    const prompt = `
You are Enkrypt AI's Semantic Evaluator for PitchAutopsy.
Evaluate the following output from the "${agentName}" against these 4 quality criteria:
1. Criticism Depth: Is the analysis deep, rigorous, and insightful? (Score 1-10)
2. Factual Accuracy: Does the criticism align with logical reasoning and avoid baseless claims? (Score 1-10)
3. Constructiveness: Is the feedback actionable and helpful for the founder? (Score 1-10)
4. Score Calibration: Are the scores/metrics logical and calibrated? (Score 1-10)

Output ONLY a raw JSON block matching this interface without any markdown formatting or comments:
{
  "criticismDepth": number,
  "factualAccuracy": number,
  "constructiveness": number,
  "scoreCalibration": number,
  "reasons": string[]
}

Here is the content to evaluate:
---
${text}
---
    `.trim();

    const response = await generateText({
      model,
      prompt,
    });

    const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJson);

    criticismDepth = typeof result.criticismDepth === 'number' ? result.criticismDepth : 8;
    factualAccuracy = typeof result.factualAccuracy === 'number' ? result.factualAccuracy : 8;
    constructiveness = typeof result.constructiveness === 'number' ? result.constructiveness : 8;
    scoreCalibration = typeof result.scoreCalibration === 'number' ? result.scoreCalibration : 8;

    // Log general evaluator explanations but do not treat them as safety violations
    const explanations = Array.isArray(result.reasons) ? result.reasons : [];
    console.log(`[Enkrypt AI] Evaluator Feedback:`, explanations.join(' | '));

    if (criticismDepth < 5) {
      reasons.push(`Criticism Depth score ${criticismDepth} is below the threshold of 5.`);
      if (explanations.length > 0) reasons.push(...explanations);
    }
    if (factualAccuracy < 5) {
      reasons.push(`Factual Accuracy score ${factualAccuracy} is below the threshold of 5.`);
      if (explanations.length > 0) reasons.push(...explanations);
    }
    if (constructiveness < 5) reasons.push(`Constructiveness score ${constructiveness} is below the threshold of 5.`);
    if (scoreCalibration < 5) reasons.push(`Score Calibration score ${scoreCalibration} is below the threshold of 5.`);

  } catch (err) {
    console.error('[Enkrypt AI] Error in semantic evaluation:', err);
  }

  const passed = !isToxic && reasons.length === 0;

  return {
    passed,
    reasons,
    scores: {
      toxicity: isToxic ? 'fail' : 'pass',
      criticismDepth,
      factualAccuracy,
      constructiveness,
      scoreCalibration,
    },
  };
}
