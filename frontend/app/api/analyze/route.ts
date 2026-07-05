import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const MASTRA_BASE = process.env.MASTRA_URL || "http://localhost:4111";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Save PDF to a temp location the Mastra backend can access
    const runId = randomUUID();
    const uploadDir = join(tmpdir(), "pitchautopsy");
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, `${runId}.pdf`);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Create the run on Mastra backend
    const triggerRes = await fetch(
      `${MASTRA_BASE}/api/workflows/pitch-analysis-workflow/create-run`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputData: { pdfPath: filePath },
        }),
      }
    );

    if (!triggerRes.ok) {
      // Fallback: return a mock runId for demo purposes
      return NextResponse.json({ runId, filePath, demo: true });
    }

    const { runId: workflowRunId } = await triggerRes.json();

    // Trigger the background execution (do not await it so we return immediately)
    fetch(`${MASTRA_BASE}/api/workflows/pitch-analysis-workflow/start-async`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: workflowRunId,
        inputData: { pdfPath: filePath },
      }),
    }).catch((err) => {
      console.error("Background trigger error:", err);
    });

    return NextResponse.json({ runId: workflowRunId || runId, filePath });
  } catch (error) {
    console.error("Analyze API error:", error);
    // Return a demo runId so UI still navigates and shows the design
    const runId = randomUUID();
    return NextResponse.json({ runId, demo: true });
  }
}
