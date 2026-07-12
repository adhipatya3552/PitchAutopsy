import { NextRequest, NextResponse } from "next/server";

const MASTRA_BASE = process.env.MASTRA_URL || "http://localhost:4111";
const POLL_MS = 2200;

const EMPTY_STEPS = {
  "parse-pdf-step": { status: "pending" },
  "devils-advocate-step": { status: "pending" },
  "market-validator-step": { status: "pending" },
  "improvement-step": { status: "pending" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json(
      { error: "Missing runId query parameter" },
      { status: 400 }
    );
  }

  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      let notFoundCount = 0;
      const MAX_NOT_FOUND = 5;

      const interval = setInterval(async () => {
        try {
          // Lean fields only — status mapping, not full payloads
          const res = await fetch(
            `${MASTRA_BASE}/api/workflows/pitch-analysis-workflow/runs/${runId}?fields=steps,error`
          );

          if (!res.ok) {
            notFoundCount++;
            if (notFoundCount >= MAX_NOT_FOUND) {
              sendEvent("failed", {
                error:
                  "Analysis run not found on Mastra backend. Please try uploading again.",
              });
              clearInterval(interval);
              controller.close();
              return;
            }
            sendEvent("status", { status: "pending", steps: EMPTY_STEPS });
            return;
          }

          notFoundCount = 0;
          const run = await res.json();
          const snapshot = run.snapshot || run;
          const context = snapshot.context || {};
          const steps = snapshot.steps || run.steps || {};

          const formattedSteps: Record<string, { status: string }> = {};
          const stepIds = [
            "parse-pdf-step",
            "devils-advocate-step",
            "market-validator-step",
            "improvement-step",
          ];

          for (const stepId of stepIds) {
            const stepInfo =
              context[stepId] || steps[stepId] || run.steps?.[stepId] || {};
            let status = "pending";

            if (stepInfo.status === "success") {
              status = "done";
            } else if (stepInfo.status === "failed") {
              status = "error";
            } else if (stepInfo.status === "running" || stepInfo.startedAt) {
              status = "active";
            }

            formattedSteps[stepId] = { status };
          }

          sendEvent("status", {
            status: run.status,
            steps: formattedSteps,
          });

          if (run.status === "success") {
            sendEvent("complete", { runId });
            clearInterval(interval);
            controller.close();
          } else if (run.status === "failed") {
            sendEvent("failed", {
              error: run.error?.message || "Workflow run failed",
            });
            clearInterval(interval);
            controller.close();
          }
        } catch (e) {
          console.error("SSE polling error:", e);
          sendEvent("status", { error: "Failed to poll backend" });
        }
      }, POLL_MS);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
