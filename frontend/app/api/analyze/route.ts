import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const MASTRA_BASE = process.env.MASTRA_URL || "http://localhost:4111";
const WORKFLOW_ID = "pitch-analysis-workflow";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Persist PDF to a temp path the Mastra workflow can read
    const fileId = randomUUID();
    const uploadDir = join(tmpdir(), "pitchautopsy");
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, `${fileId}.pdf`);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // 1) Create a run — Mastra returns the canonical runId
    //    create-run body only accepts resourceId / disableScorers (not inputData)
    const createRes = await fetch(
      `${MASTRA_BASE}/api/workflows/${WORKFLOW_ID}/create-run`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      return NextResponse.json(
        { error: `Mastra backend error: ${errText}` },
        { status: 500 }
      );
    }

    const createBody = await createRes.json();
    const runId = createBody?.runId as string | undefined;

    if (!runId) {
      return NextResponse.json(
        { error: "Mastra create-run did not return a runId" },
        { status: 500 }
      );
    }

    // 2) Start THAT same run. runId must be a query param (body runId is ignored).
    //    Prefer /start (fire-and-forget) over /start-async (awaits full completion).
    const startUrl = `${MASTRA_BASE}/api/workflows/${WORKFLOW_ID}/start?runId=${encodeURIComponent(runId)}`;
    console.log(`[analyze] Starting workflow run ${runId} via ${startUrl}`);

    fetch(startUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputData: { pdfPath: filePath },
      }),
    }).catch((err) => {
      console.error("Background trigger error:", err);
    });

    // Return the same runId the frontend will use for /analyze and SSE
    return NextResponse.json({ runId, filePath });
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
