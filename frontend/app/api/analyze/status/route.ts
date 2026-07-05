import { NextRequest, NextResponse } from "next/server";

const MASTRA_BASE = process.env.MASTRA_URL || "http://localhost:4111";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ error: "Missing runId query parameter" }, { status: 400 });
  }

  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Poll status every 1.5 seconds
      const interval = setInterval(async () => {
        try {
          const res = await fetch(
            `${MASTRA_BASE}/api/workflows/pitch-analysis-workflow/runs/${runId}?fields=result,error,payload,steps,activeStepsPath`
          );

          if (!res.ok) {
            // If the run is not found yet, wait and retry
            sendEvent("status", {
              status: "pending",
              steps: {
                "parse-pdf-step": { status: "pending", output: "" },
                "devils-advocate-step": { status: "pending", output: "" },
                "market-validator-step": { status: "pending", output: "" },
                "improvement-step": { status: "pending", output: "" },
              },
            });
            return;
          }

          const run = await res.json();
          const snapshot = run.snapshot || run;
          const context = snapshot.context || {};
          const steps = snapshot.steps || {};

          // Map Mastra step states to UI statuses: 'pending', 'active', 'done', 'error'
          const formattedSteps: Record<string, { status: string; output: string }> = {};

          const stepIds = [
            "parse-pdf-step",
            "devils-advocate-step",
            "market-validator-step",
            "improvement-step",
          ];

          for (const stepId of stepIds) {
            const stepInfo = context[stepId] || steps[stepId] || {};
            let status = "pending";
            let output = "";

            if (stepInfo.status === "success") {
              status = "done";
              // Extract text outputs based on step specific payload
              if (stepId === "parse-pdf-step") {
                output = `Extracted text (${stepInfo.output?.extractedText?.length || 0} characters).`;
              } else if (stepId === "devils-advocate-step") {
                output = stepInfo.output?.investorQuestions || "Questions generated.";
              } else if (stepId === "market-validator-step") {
                output = stepInfo.output?.validationReport || "Claims validated.";
              } else if (stepId === "improvement-step") {
                output = "Action plan compiled.";
              }
            } else if (stepInfo.status === "failed") {
              status = "error";
              output = stepInfo.error?.message || "Step failed.";
            } else if (stepInfo.status === "running" || stepInfo.startedAt) {
              status = "active";
              output = "Analyzing...";
            }

            formattedSteps[stepId] = { status, output };
          }

          // Push update
          sendEvent("status", {
            status: run.status,
            steps: formattedSteps,
          });

          // End connection if completed or failed
          if (run.status === "success") {
            sendEvent("complete", { runId });
            clearInterval(interval);
            controller.close();
          } else if (run.status === "failed") {
            sendEvent("failed", { error: run.error?.message || "Workflow run failed" });
            clearInterval(interval);
            controller.close();
          }
        } catch (e: any) {
          console.error("SSE polling error:", e);
          sendEvent("status", { error: "Failed to poll backend" });
        }
      }, 1500);

      // Clean up on cancel
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
