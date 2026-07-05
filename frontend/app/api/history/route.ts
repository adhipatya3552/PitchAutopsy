import { NextRequest, NextResponse } from "next/server";

const MASTRA_BASE = process.env.MASTRA_URL || "http://localhost:4111";

// Simple parser helper to extract questions count
function getQuestionsCount(text: string): number {
  if (!text) return 0;
  const regex = /(?:^|\n)\s*\d+\.\s*/g;
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

// Simple parser helper to extract high risk count
function getHighRiskCount(text: string): number {
  if (!text) return 0;
  const regex = /Validation Status:\s*HIGH[-_]RISK/gi;
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(
      `${MASTRA_BASE}/api/workflows/pitch-analysis-workflow/runs?fields=result,error,payload,steps,activeStepsPath`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch runs from Mastra backend" }, { status: 500 });
    }

    const runEnvelope = await res.json();
    const runsList = runEnvelope.data || [];

    const formattedHistory = runsList.map((run: any) => {
      const snapshot = run.snapshot || run;
      const context = snapshot.context || {};
      
      const parseStep = context["parse-pdf-step"] || {};
      const devilsStep = context["devils-advocate-step"] || {};
      const marketStep = context["market-validator-step"] || {};
      const improvementStep = context["improvement-step"] || {};

      // Get file name from pdfPath
      const pdfPath = parseStep.payload?.pdfPath || context.input?.pdfPath || "pitch-deck.pdf";
      const fileName = pdfPath.split(/[\\/]/).pop() || "pitch-deck.pdf";

      const rawQuestions = devilsStep.output?.investorQuestions || "";
      const rawValidation = marketStep.output?.validationReport || "";

      const questionsCount = getQuestionsCount(rawQuestions);
      const highRisks = getHighRiskCount(rawValidation);

      // Compute Pitch Health Score (baseline 85, deduct for high risks)
      let score = 85;
      if (run.status === "success") {
        score = Math.max(35, Math.min(95, 85 - (highRisks * 12)));
      } else if (run.status === "failed") {
        score = 0;
      }

      return {
        runId: run.runId,
        fileName,
        createdAt: run.createdAt,
        status: run.status,
        score,
        highRisks,
        questionsCount,
      };
    });

    return NextResponse.json({
      history: formattedHistory,
      total: runEnvelope.total || formattedHistory.length
    });

  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Failed to retrieve history" }, { status: 500 });
  }
}
