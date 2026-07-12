import { NextResponse } from "next/server";

const MASTRA_BASE = process.env.MASTRA_URL || "http://localhost:4111";
const WORKFLOW_ID = "pitch-analysis-workflow";

function getQuestionsCount(text: string): number {
  if (!text) return 0;
  const matches = text.match(/(?:^|\n)\s*\d+\.\s*/g);
  return matches ? matches.length : 0;
}

function getHighRiskCount(text: string): number {
  if (!text) return 0;
  const matches = text.match(/Validation Status:\s*HIGH[-_]RISK/gi);
  return matches ? matches.length : 0;
}

function resolveStepBag(run: Record<string, unknown>) {
  const snapshot = (run.snapshot as Record<string, unknown> | undefined) ?? run;
  return (
    (snapshot.context as Record<string, any> | undefined) ||
    (snapshot.steps as Record<string, any> | undefined) ||
    (run.steps as Record<string, any> | undefined) ||
    {}
  );
}

function extractPdfPath(steps: Record<string, any>, run: Record<string, any>): string {
  const parseStep = steps["parse-pdf-step"] || {};
  return (
    parseStep.payload?.pdfPath ||
    parseStep.input?.pdfPath ||
    run.payload?.pdfPath ||
    run.input?.pdfPath ||
    steps.input?.pdfPath ||
    "pitch-deck.pdf"
  );
}

export async function GET() {
  try {
    const res = await fetch(
      `${MASTRA_BASE}/api/workflows/${WORKFLOW_ID}/runs?perPage=100`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch runs from Mastra backend" },
        { status: 500 }
      );
    }

    const runEnvelope = await res.json();
    // Mastra returns { runs, total } — not { data }
    const runsList: any[] = runEnvelope.runs ?? runEnvelope.data ?? [];

    const formattedHistory = runsList.map((run: any) => {
      const steps = resolveStepBag(run);
      const parseStep = steps["parse-pdf-step"] || {};
      const devilsStep = steps["devils-advocate-step"] || {};
      const marketStep = steps["market-validator-step"] || {};

      const pdfPath = extractPdfPath(steps, run);
      const fileName = String(pdfPath).split(/[\\/]/).pop() || "pitch-deck.pdf";

      const rawQuestions =
        devilsStep.output?.investorQuestions ||
        parseStep.output?.investorQuestions ||
        "";
      const rawValidation =
        marketStep.output?.validationReport ||
        "";

      const questionsCount = getQuestionsCount(rawQuestions);
      const highRisks = getHighRiskCount(rawValidation);

      let score = 85;
      if (run.status === "success") {
        score = Math.max(35, Math.min(95, 85 - highRisks * 12));
      } else if (run.status === "failed") {
        score = 0;
      } else if (run.status === "running" || run.status === "pending") {
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

    // Newest first
    formattedHistory.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({
      history: formattedHistory,
      total: runEnvelope.total ?? formattedHistory.length,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve history" },
      { status: 500 }
    );
  }
}
