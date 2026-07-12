"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import AgentCard, { AgentStatus } from "@/components/AgentCard";
import Navbar from "@/components/Navbar";
import { Cpu, CheckCircle } from "lucide-react";

const AGENTS = [
  {
    id: "devils-advocate",
    name: "Devil's Advocate",
    subtitle: "Stress-testing your assumptions",
    icon: "💀",
    color: "purple" as const,
    stepKey: "devils-advocate-step",
  },
  {
    id: "market-validator",
    name: "Market Validator",
    subtitle: "Checking against 1,000+ failure post-mortems",
    icon: "📊",
    color: "amber" as const,
    stepKey: "market-validator-step",
  },
  {
    id: "improvement",
    name: "Improvement Agent",
    subtitle: "Building your action plan",
    icon: "⚡",
    color: "green" as const,
    stepKey: "improvement-step",
  },
];

function PipelineConnector({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="relative flex justify-center py-3" style={{ height: 56 }}>
      <svg width="4" height="56" viewBox="0 0 4 56">
        <line
          x1="2"
          y1="0"
          x2="2"
          y2="56"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {(active || done) && (
          <motion.line
            x1="2"
            y1="0"
            x2="2"
            y2="56"
            stroke={done ? "var(--remedy)" : "var(--cyan-muted)"}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 4px ${done ? "var(--remedy)" : "var(--cyan-muted)"})`,
            }}
          />
        )}
        {active && (
          <motion.circle
            cx="2"
            cy="0"
            r="3"
            fill="var(--cyan-muted)"
            animate={{ cy: [0, 56], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 4px var(--cyan-muted))" }}
          />
        )}
      </svg>
    </div>
  );
}

export default function AnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;

  const [agents, setAgents] = useState<Record<string, AgentStatus>>({
    "devils-advocate": "pending",
    "market-validator": "pending",
    improvement: "pending",
  });
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`/api/analyze/status?runId=${runId}`);

    eventSource.addEventListener("status", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.steps) {
          setAgents({
            "devils-advocate":
              data.steps["devils-advocate-step"]?.status || "pending",
            "market-validator":
              data.steps["market-validator-step"]?.status || "pending",
            improvement:
              data.steps["improvement-step"]?.status || "pending",
          });
        }
      } catch (err) {
        console.error("Error parsing status event:", err);
      }
    });

    eventSource.addEventListener("complete", () => {
      setDone(true);
      eventSource.close();
    });

    eventSource.addEventListener("failed", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setFailed(data.error || "Workflow processing failure");
      } catch {
        setFailed("Workflow processing failure");
      }
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [runId]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => router.push(`/report/${runId}`), 1800);
      return () => clearTimeout(t);
    }
  }, [done, runId, router]);

  return (
    <main
      className="relative min-h-screen flex flex-col items-center w-full"
      style={{
        background: "var(--void)",
        color: "var(--parchment)",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
        }}
      />

      <Navbar />

      <div className="page-shell page-main relative z-10 w-full">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-space mb-8"
            style={{
              background: done
                ? "rgba(52,211,153,0.08)"
                : failed
                  ? "rgba(226,62,87,0.08)"
                  : "rgba(91,184,212,0.08)",
              border: done
                ? "1px solid rgba(52,211,153,0.25)"
                : failed
                  ? "1px solid rgba(226,62,87,0.25)"
                  : "1px solid rgba(91,184,212,0.25)",
              color: done
                ? "var(--remedy)"
                : failed
                  ? "var(--redline)"
                  : "var(--cyan-muted)",
            }}
            animate={{ opacity: done || failed ? 1 : [1, 0.65, 1] }}
            transition={{ duration: 2, repeat: done || failed ? 0 : Infinity }}
          >
            <motion.span
              animate={{ scale: done || failed ? 1 : [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: done || failed ? 0 : Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: done
                  ? "var(--remedy)"
                  : failed
                    ? "var(--redline)"
                    : "var(--cyan-muted)",
              }}
            />
            {done
              ? "Validation Locked"
              : failed
                ? "Autopsy Failed"
                : "Autopsy Extraction Active"}
          </motion.div>

          <h1 className="font-display text-4xl lg:text-5xl mb-4 leading-tight">
            {done ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ color: "var(--parchment)" }}
              >
                Autopsy Complete
              </motion.span>
            ) : (
              <span style={{ color: "var(--parchment)" }}>
                Deconstructing{" "}
                <span style={{ color: "var(--redline)" }}>Pitch Deck</span>
                ...
              </span>
            )}
          </h1>
          <p className="text-sm" style={{ color: "var(--ash)" }}>
            Run ID:{" "}
            <span
              style={{
                fontFamily: "monospace",
                color: "var(--cyan-muted)",
              }}
            >
              {runId.slice(0, 18)}...
            </span>
          </p>
        </div>

        {/* Main layout: agents + matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-0">
            {AGENTS.map((agent, i) => (
              <div key={agent.id}>
                <AgentCard
                  name={agent.name}
                  subtitle={agent.subtitle}
                  icon={agent.icon}
                  status={agents[agent.id]}
                  color={agent.color}
                  index={i}
                />
                {i < AGENTS.length - 1 && (
                  <PipelineConnector
                    active={agents[AGENTS[i + 1].id] === "active"}
                    done={agents[AGENTS[i + 1].id] === "done"}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="lg:col-span-5">
            <div
              className="card-pad rounded-2xl relative overflow-hidden sticky top-28"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400/20 scanner-laser pointer-events-none" />

              <div
                className="flex items-center gap-2 mb-6 text-xs font-space"
                style={{ color: "var(--ash)" }}
              >
                <Cpu size={14} style={{ color: "var(--cyan-muted)" }} />
                <span>PDF Document Extraction Matrix</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, slideIdx) => {
                  const id = slideIdx + 1;
                  let color = "rgba(255,255,255,0.03)";
                  let border = "rgba(255,255,255,0.06)";
                  let dotColor = "rgba(255,255,255,0.1)";
                  let pulse = false;

                  if (done) {
                    color = "rgba(52, 211, 153, 0.05)";
                    border = "rgba(52, 211, 153, 0.25)";
                    dotColor = "var(--remedy)";
                  } else if (agents["devils-advocate"] === "active" && id <= 3) {
                    color = "rgba(139, 92, 246, 0.08)";
                    border = "rgba(139, 92, 246, 0.3)";
                    dotColor = "var(--purple)";
                    pulse = true;
                  } else if (
                    agents["market-validator"] === "active" &&
                    id <= 6
                  ) {
                    color = "rgba(212, 168, 67, 0.08)";
                    border = "rgba(212, 168, 67, 0.3)";
                    dotColor = "var(--evidence)";
                    pulse = true;
                  } else if (agents["improvement"] === "active") {
                    color = "rgba(52, 211, 153, 0.08)";
                    border = "rgba(52, 211, 153, 0.3)";
                    dotColor = "var(--remedy)";
                    pulse = true;
                  }

                  return (
                    <motion.div
                      key={slideIdx}
                      className="p-4 rounded-xl border flex flex-col justify-between items-start aspect-video relative overflow-hidden"
                      style={{ background: color, borderColor: border }}
                      animate={pulse ? { scale: [1, 1.03, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span
                        className="text-[10px] font-space font-bold"
                        style={{ color: dotColor }}
                      >
                        SLIDE {id}
                      </span>
                      <div className="flex items-center justify-between w-full mt-2">
                        <span
                          className="text-[8px] font-mono"
                          style={{ color: "var(--ash)" }}
                        >
                          PARSED
                        </span>
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: dotColor }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {failed && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-14 text-center p-8 rounded-2xl max-w-xl mx-auto"
              style={{
                background: "rgba(226,62,87,0.06)",
                border: "1px solid rgba(226,62,87,0.2)",
              }}
            >
              <p className="font-space font-bold text-sm mb-2" style={{ color: "var(--redline)" }}>
                Analysis failed
              </p>
              <p className="text-xs mb-6" style={{ color: "var(--ash)" }}>
                {failed}
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-5 py-2.5 rounded-xl text-xs font-space font-semibold"
                style={{
                  background: "rgba(226,62,87,0.1)",
                  border: "1px solid rgba(226,62,87,0.25)",
                  color: "var(--redline)",
                }}
              >
                Back to Home
              </button>
            </motion.div>
          )}

          {done && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-14 text-center p-8 rounded-2xl max-w-xl mx-auto"
              style={{
                background: "rgba(52,211,153,0.06)",
                border: "1px solid rgba(52,211,153,0.2)",
              }}
            >
              <div
                className="flex items-center justify-center gap-2 font-space font-bold text-sm"
                style={{ color: "var(--remedy)" }}
              >
                <CheckCircle size={16} /> Autopsy report compiled successfully
              </div>
              <p className="text-xs mt-3 font-space" style={{ color: "var(--ash)" }}>
                Redirecting to your analysis dashboard in a moment...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
