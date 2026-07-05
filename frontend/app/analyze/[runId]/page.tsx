"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import AgentCard, { AgentStatus } from "@/components/AgentCard";
import ParticleCanvas from "@/components/ParticleCanvas";

interface AgentState {
  status: AgentStatus;
  output: string;
}

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

// SVG pipeline connector between agent cards
function PipelineConnector({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div className="relative flex justify-center py-2" style={{ height: 48 }}>
      <svg width="4" height="48" viewBox="0 0 4 48">
        {/* Background line */}
        <line x1="2" y1="0" x2="2" y2="48"
          stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" />
        {/* Animated data-flow line */}
        {(active || done) && (
          <motion.line
            x1="2" y1="0" x2="2" y2="48"
            stroke={done ? "var(--green)" : "var(--cyan)"}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${done ? "var(--green)" : "var(--cyan)"})` }}
          />
        )}
        {/* Moving dot */}
        {active && (
          <motion.circle
            cx="2" cy="0" r="3"
            fill="var(--cyan)"
            animate={{ cy: [0, 48], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 4px var(--cyan))" }}
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

  const [agents, setAgents] = useState<Record<string, AgentState>>({
    "devils-advocate": { status: "pending", output: "" },
    "market-validator": { status: "pending", output: "" },
    improvement: { status: "pending", output: "" },
  });
  const [done, setDone] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/analyze/status?runId=${runId}`);

    eventSource.addEventListener("status", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.steps) {
          setAgents({
            "devils-advocate": {
              status: data.steps["devils-advocate-step"]?.status || "pending",
              output: data.steps["devils-advocate-step"]?.output || "",
            },
            "market-validator": {
              status: data.steps["market-validator-step"]?.status || "pending",
              output: data.steps["market-validator-step"]?.output || "",
            },
            improvement: {
              status: data.steps["improvement-step"]?.status || "pending",
              output: data.steps["improvement-step"]?.output || "",
            },
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

    eventSource.addEventListener("failed", (event: any) => {
      const data = JSON.parse(event.data);
      console.error("Workflow failed:", data.error);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [runId]);

  // Navigate to report when done
  useEffect(() => {
    if (done) {
      setTimeout(() => router.push(`/report/${runId}`), 1500);
    }
  }, [done, runId, router]);

  return (
    <main className="relative min-h-screen" style={{ background: "var(--bg-void)" }}>
      <ParticleCanvas />

      {/* Grid overlay for depth */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-space mb-6"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.25)",
              color: "var(--cyan)",
            }}
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: done ? 0 : Infinity }}
          >
            <motion.span
              animate={{ scale: done ? 1 : [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: done ? 0 : Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: done ? "var(--green)" : "var(--cyan)" }}
            />
            {done ? "Analysis Complete" : "Analysis In Progress"}
          </motion.div>

          <h1 className="font-space font-bold text-4xl mb-2">
            {done ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="gradient-text"
              >
                Autopsy Complete
              </motion.span>
            ) : (
              <span style={{ color: "#e2e8f0" }}>
                Running <span className="gradient-text">Autopsy</span>...
              </span>
            )}
          </h1>
          <p className="text-sm" style={{ color: "rgba(226,232,240,0.4)" }}>
            ID: <span style={{ fontFamily: "monospace", color: "var(--cyan)" }}>{runId.slice(0, 16)}...</span>
          </p>
        </motion.div>

        {/* Pipeline */}
        <div className="space-y-0">
          {AGENTS.map((agent, i) => (
            <div key={agent.id}>
              <AgentCard
                name={agent.name}
                subtitle={agent.subtitle}
                icon={agent.icon}
                status={agents[agent.id].status}
                output={agents[agent.id].output || undefined}
                color={agent.color}
                index={i}
              />
              {i < AGENTS.length - 1 && (
                <PipelineConnector
                  active={agents[AGENTS[i + 1].id].status === "active"}
                  done={agents[AGENTS[i + 1].id].status === "done"}
                />
              )}
            </div>
          ))}
        </div>

        {/* Done redirect notice */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center glass-card p-4 glow-green"
              style={{ borderColor: "rgba(0,255,136,0.3)" }}
            >
              <p className="font-space text-sm" style={{ color: "var(--green)" }}>
                ✅ Autopsy complete — loading your report...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
