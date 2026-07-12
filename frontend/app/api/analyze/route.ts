import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const MASTRA_BASE = process.env.MASTRA_URL || "http://localhost:4111";
const WORKFLOW_ID = "pitch-analysis-workflow";

/** Vercel and Render do not share a filesystem. Always send the PDF bytes
 *  to Mastra as base64 so the backend can write+parse on its own disk. */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Soft size guard (Vercel serverless body limits ~4.5MB on hobby)
    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error:
            "PDF is too large for upload on this host (max ~4MB). Use a smaller deck.",
        },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const pdfBase64 = Buffer.from(bytes).toString("base64");
    const fileName = file.name || `${randomUUID()}.pdf`;

    // 1) Create a run
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

    // 2) Start with PDF payload (base64), not a Vercel-local path
    const startUrl = `${MASTRA_BASE}/api/workflows/${WORKFLOW_ID}/start?runId=${encodeURIComponent(runId)}`;
    console.log(
      `[analyze] Starting workflow run ${runId} (${fileName}, ${file.size} bytes)`
    );

    // Await start acknowledgement so cold-start failures surface (short)
    // Mastra /start returns immediately without waiting for full workflow.
    const startRes = await fetch(startUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputData: {
          pdfBase64,
          fileName,
        },
      }),
    });

    if (!startRes.ok) {
      const errText = await startRes.text();
      return NextResponse.json(
        { error: `Failed to start analysis: ${errText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ runId, fileName });
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
