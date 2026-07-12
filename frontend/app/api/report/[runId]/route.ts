import { NextRequest, NextResponse } from "next/server";

const MASTRA_BASE = process.env.MASTRA_URL || "http://localhost:4111";
const WORKFLOW_ID = "pitch-analysis-workflow";

/** Remove common Markdown emphasis so UI never shows raw ** / __ / ` */
function stripMarkdown(s: string): string {
  if (!s) return "";
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^\*+\s*/gm, "")
    .trim();
}

/** Mastra may place step state on context, snapshot.steps, or top-level steps */
function resolveSteps(run: Record<string, any>): Record<string, any> {
  const snapshot = run.snapshot ?? run;
  // Merge all known locations; later layers override earlier ones
  return {
    ...(run.steps || {}),
    ...(snapshot.steps || {}),
    ...(snapshot.context || {}),
  } as Record<string, any>;
}

function stepOutputText(step: any, keys: string[]): string {
  if (!step) return "";
  const out = step.output;
  if (typeof out === "string" && out.trim()) return out;
  if (out && typeof out === "object") {
    for (const k of keys) {
      const v = out[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    if (typeof out.text === "string" && out.text.trim()) return out.text;
  }
  if (typeof step.result === "string" && step.result.trim()) return step.result;
  return "";
}

function parseQuestions(text: string): { q: string; context: string }[] {
  if (!text?.trim()) return [];

  const normalized = text.replace(/\r\n/g, "\n").trim();

  // Split on numbered items: "1. " at start, after newline, or after space (packed lists)
  const parts = normalized
    .split(/(?:^|\n|(?<=\S)\s+)(?=\d{1,2}\.\s+)/)
    .map((p) => p.trim())
    .filter(Boolean);

  const questions: { q: string; context: string }[] = [];

  for (const part of parts) {
    // Drop leading "12. "
    let body = part.replace(/^\d{1,2}\.\s*/, "").trim();
    if (!body) continue;

    body = stripMarkdown(body);

    // Prefer Question: / Why: labels
    const labeledQ = body.match(
      /Question:\s*([\s\S]*?)(?:\n\s*Why:|$)/i
    );
    const labeledWhy = body.match(/Why:\s*([\s\S]+)/i);
    if (labeledQ) {
      const q = stripMarkdown(labeledQ[1]).replace(/\s+/g, " ").trim();
      const context = labeledWhy
        ? stripMarkdown(labeledWhy[1]).replace(/\s+/g, " ").trim()
        : "Identified under investor scrutiny.";
      if (q.length > 5) questions.push({ q, context });
      continue;
    }

    // Pattern: "Question text? - explanation" or "Question text? — explanation"
    const dashSplit = body.match(
      /^([\s\S]*?\?)\s*[-–—:]\s+([\s\S]+)$/
    );
    if (dashSplit) {
      const q = stripMarkdown(dashSplit[1]).replace(/\s+/g, " ").trim();
      const context = stripMarkdown(dashSplit[2]).replace(/\s+/g, " ").trim();
      if (q.length > 5) {
        questions.push({
          q,
          context: context || "Identified under investor scrutiny.",
        });
        continue;
      }
    }

    // Multi-line: first line question, rest context
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      const q = stripMarkdown(lines[0]).replace(/\s+/g, " ").trim();
      const context = stripMarkdown(lines.slice(1).join(" "))
        .replace(/^Context:\s*|^Explanation:\s*|^Why:\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
      if (q.length > 5) {
        questions.push({
          q,
          context: context || "Identified under investor scrutiny.",
        });
        continue;
      }
    }

    // Single blob: use first sentence as question if possible
    const sentence = body.match(/^(.+?\?)(?:\s+|$)([\s\S]*)/);
    if (sentence) {
      const q = stripMarkdown(sentence[1]).replace(/\s+/g, " ").trim();
      const context = stripMarkdown(sentence[2] || "")
        .replace(/^[-–—:]\s*/, "")
        .replace(/\s+/g, " ")
        .trim();
      if (q.length > 5) {
        questions.push({
          q,
          context: context || "Identified under investor scrutiny.",
        });
        continue;
      }
    }

    const q = stripMarkdown(body).replace(/\s+/g, " ").trim();
    if (q.length > 5) {
      questions.push({
        q,
        context: "Identified under investor scrutiny.",
      });
    }
  }

  if (questions.length > 0) return questions;

  // Last-resort: any line that looks like a question
  const lines = normalized.split("\n").filter((l) => l.trim().length > 15);
  return lines.slice(0, 15).map((line) => ({
    q: stripMarkdown(line.replace(/^\d{1,2}\.\s*/, "")).replace(/\s+/g, " "),
    context: "Context flagged by Devil's Advocate.",
  })).filter((item) => item.q.length > 5);
}

function parseRisks(
  text: string
): { claim: string; level: "SAFE" | "HIGH_RISK"; score: number; match: string }[] {
  if (!text?.trim()) return [];
  const risks: {
    claim: string;
    level: "SAFE" | "HIGH_RISK";
    score: number;
    match: string;
  }[] = [];

  let blocks = text.split(
    /(?=\*\*Claim\s*\d*\:|\*\*Claim\:|(?:^|\n)\s*Claim\s*\d*\:)/gi
  );

  if (blocks.length <= 1) {
    blocks = text.split(/(?=(?:^|\n)\s*(?:\d{1,2}[\.\)]\s+|[-*]\s+))/);
  }

  for (const block of blocks) {
    if (!block.trim() || block.trim().length < 12) continue;

    const claimMatch =
      block.match(
        /(?:Claim\s*\d*\:?\s*)([\s\S]*?)(?=\n\s*Validation Status|\n\s*Similarity Score|\n\s*Lesson:|$)/i
      ) ||
      block.match(
        /^(?:[-*]\s*|\d{1,2}[\.\)]\s*)([\s\S]*?)(?=\n\s*Validation Status|\n\s*Similarity|HIGH[-_\s]?RISK|$)/i
      );

    const statusMatch = block.match(
      /Validation Status:\s*(Safe|HIGH[-_\s]?RISK)|(?:\b)(HIGH[-_\s]?RISK|Safe)\b/i
    );
    const scoreMatch = block.match(
      /Similarity Score:\s*([\d.]+)|similarity[:\s]+([\d.]+)/i
    );
    const matchName = block.match(
      /\b(Quibi|Fast(?:\.co)?|Juicero|Webvan|Theranos|WeWork|Kozmo|Segway)\b/i
    );

    let claim = "";
    if (claimMatch) {
      claim = stripMarkdown(claimMatch[1] || "")
        .replace(/^\*+|\*+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    } else {
      const firstLine = stripMarkdown(block)
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.length > 20);
      claim = (firstLine || "").slice(0, 240);
    }

    if (!claim || claim.length < 8) continue;
    if (/^(narrative|risk mitigation|output format)/i.test(claim)) continue;

    const statusRaw = (statusMatch?.[1] || statusMatch?.[2] || "").toUpperCase();
    const level: "SAFE" | "HIGH_RISK" =
      /HIGH/.test(statusRaw) || /high[-_\s]?risk/i.test(block)
        ? "HIGH_RISK"
        : "SAFE";

    const scoreStr = scoreMatch?.[1] || scoreMatch?.[2];
    let score = scoreStr ? parseFloat(scoreStr) : level === "HIGH_RISK" ? 0.82 : 0.65;
    if (score > 1 && score <= 100) score = score / 100;
    if (Number.isNaN(score)) score = level === "HIGH_RISK" ? 0.82 : 0.65;

    const match = matchName?.[1]
      ? `${matchName[1].replace(/\.co$/i, "")} Case`
      : level === "HIGH_RISK"
        ? "Historical failure match"
        : "Low similarity match";

    risks.push({ claim: claim.slice(0, 320), level, score, match });
  }

  if (risks.length === 0) {
    // Paragraph fallback only — never invent mock company rows
    const cleaned = stripMarkdown(text);
    const paras = cleaned
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40)
      .slice(0, 8);

    return paras.map((p, i) => ({
      claim: p.slice(0, 280).replace(/\s+/g, " "),
      level: /high[-_\s]?risk/i.test(p) ? ("HIGH_RISK" as const) : ("SAFE" as const),
      score: /high[-_\s]?risk/i.test(p) ? 0.82 : 0.65,
      match: `Validation note ${i + 1}`,
    }));
  }

  return risks.slice(0, 12);
}

function parseImprovements(
  text: string
): { slide: number; title: string; action: string }[] {
  if (!text?.trim()) return [];

  // Prefer slide-by-slide portion; cut narrative/risk appendices
  let working = text.replace(/\r\n/g, "\n");
  const narrativeCut = working.search(
    /\n\s*(?:#{1,3}\s*)?(?:Narrative Reframe|Risk Mitigation)\b/i
  );
  if (narrativeCut > 80) {
    working = working.slice(0, narrativeCut);
  }

  const cleaned = stripMarkdown(working);

  // Split on "Slide N:" even when packed on one line
  const chunks = cleaned
    .split(/(?=Slide\s*\d+\s*:)/i)
    .map((c) => c.trim())
    .filter((c) => /^Slide\s*\d+\s*:/i.test(c));

  const improvements: { slide: number; title: string; action: string }[] = [];

  for (const chunk of chunks) {
    const header = chunk.match(
      /^Slide\s*(\d+)\s*:\s*([\s\S]*?)(?=\s*Action\s*:|$)/i
    );
    if (!header) continue;

    const slideNum = parseInt(header[1], 10);
    let title = stripMarkdown(header[2] || "")
      .replace(/\s+/g, " ")
      .replace(/[-–—]\s*$/, "")
      .trim();

    title = title.split(/\s+Action\s*:/i)[0].trim();

    const actionMatch = chunk.match(
      /Action\s*:\s*([\s\S]*?)(?=Slide\s*\d+\s*:|$)/i
    );
    let action = stripMarkdown(actionMatch?.[1] || "")
      .replace(/\s+/g, " ")
      .trim();

    const textHint = chunk.match(/Text\s*:\s*["“]([^"”]+)["”]/i);
    if (textHint?.[1] && action.length > 400) {
      action = `${action.split(/Text\s*:/i)[0].trim()} Suggested: "${textHint[1]}"`.trim();
    }

    if (action.length > 600) {
      action = action.slice(0, 600).replace(/\s+\S*$/, "") + "…";
    }

    if (slideNum > 0 && (title || action)) {
      improvements.push({
        slide: slideNum,
        title: title || `Slide ${slideNum}`,
        action:
          action || "Refactor this slide for clearer investor messaging.",
      });
    }
  }

  const bySlide = new Map<
    number,
    { slide: number; title: string; action: string }
  >();
  for (const item of improvements) {
    if (!bySlide.has(item.slide)) bySlide.set(item.slide, item);
  }

  // No mock slides — empty when nothing parsed (UI shows raw)
  return Array.from(bySlide.values()).sort((a, b) => a.slide - b.slide);
}


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  try {
    const res = await fetch(
      `${MASTRA_BASE}/api/workflows/${WORKFLOW_ID}/runs/${runId}?fields=result,error,payload,steps,activeStepsPath`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Report run not found" },
        { status: 404 }
      );
    }

    const run = await res.json();
    if (run.status !== "success") {
      return NextResponse.json(
        { error: "Analysis run is not completed yet" },
        { status: 400 }
      );
    }

    const steps = resolveSteps(run);

    const parseStep = steps["parse-pdf-step"] || {};
    const devilsStep = steps["devils-advocate-step"] || {};
    const marketStep = steps["market-validator-step"] || {};
    const improvementStep = steps["improvement-step"] || {};

    // Also check top-level result if step outputs are nested there
    const result = run.result || run.snapshot?.result || {};

    const rawQuestions =
      stepOutputText(devilsStep, ["investorQuestions"]) ||
      (typeof result.investorQuestions === "string"
        ? result.investorQuestions
        : "") ||
      "";

    const rawValidation =
      stepOutputText(marketStep, ["validationReport"]) ||
      (typeof result.validationReport === "string"
        ? result.validationReport
        : "") ||
      "";

    const rawImprovement =
      stepOutputText(improvementStep, ["finalReport", "actionPlan"]) ||
      (typeof result.finalReport === "string" ? result.finalReport : "") ||
      "";

    if (!rawQuestions) {
      console.warn(
        `[report] No investorQuestions found for run ${runId}. Step keys:`,
        Object.keys(steps)
      );
    }

    const questions = parseQuestions(rawQuestions);
    const risks = parseRisks(rawValidation);
    const improvements = parseImprovements(rawImprovement);

    const highRiskCount = risks.filter((r) => r.level === "HIGH_RISK").length;
    const score = Math.max(35, Math.min(95, 85 - highRiskCount * 12));

    return NextResponse.json({
      score,
      questions,
      risks,
      improvements,
      rawOutput: {
        rawQuestions: stripMarkdown(rawQuestions),
        rawValidation: stripMarkdown(rawValidation),
        rawImprovement: stripMarkdown(rawImprovement),
      },
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load report from Mastra backend" },
      { status: 500 }
    );
  }
}
