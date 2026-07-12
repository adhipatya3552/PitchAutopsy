"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Clock } from "lucide-react";

export type AgentStatus = "pending" | "active" | "done" | "error";

interface AgentCardProps {
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  status: AgentStatus;
  /** @deprecated Long agent text is not shown on analyze cards — report holds full output */
  output?: string;
  color: "purple" | "amber" | "green";
  index: number;
}

const colorMap = {
  purple: {
    glow: "glow-purple",
    pulse: "pulse-purple",
    spin: "border-spin-purple",
    accent: "var(--purple)",
    dim: "var(--purple-dim)",
    bar: "linear-gradient(90deg, var(--purple), #c4b5fd)",
  },
  amber: {
    glow: "glow-amber",
    pulse: "pulse-amber",
    spin: "border-spin-amber",
    accent: "var(--amber)",
    dim: "var(--amber-dim)",
    bar: "linear-gradient(90deg, var(--amber), #fde68a)",
  },
  green: {
    glow: "glow-green",
    pulse: "pulse-green",
    spin: "border-spin-green",
    accent: "var(--green)",
    dim: "var(--green-dim)",
    bar: "linear-gradient(90deg, var(--green), #86efac)",
  },
};

const statusHint: Record<AgentStatus, string> = {
  pending: "Waiting for previous step…",
  active: "Running…",
  done: "Complete — full results on report",
  error: "Step failed",
};

export default function AgentCard({
  name,
  subtitle,
  icon,
  status,
  color,
  index,
}: AgentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const c = colorMap[color];

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rotY = ((e.clientX - cx) / rect.width) * 6;
    const rotX = -((e.clientY - cy) / rect.height) * 6;
    setTilt({ x: rotX, y: rotY });
  };

  const onMouseLeave = () => setTilt({ x: 0, y: 0 });

  const isActive = status === "active";
  const isDone = status === "done";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`glass-card border-spin ${c.spin} p-6 md:p-7 transition-all duration-300 ${
          isActive ? `${c.glow} ${c.pulse}` : isDone ? c.glow : ""
        }`}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition:
            tilt.x === 0 && tilt.y === 0
              ? "transform 0.4s ease"
              : "transform 0.1s ease",
          borderColor:
            isActive || isDone ? `${c.accent}40` : "var(--glass-border)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                background: `${c.dim}`,
                border: `1px solid ${c.accent}40`,
                color: c.accent,
              }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h3
                className="font-space font-bold text-base"
                style={{ color: "var(--parchment)" }}
              >
                {name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--ash)" }}>
                {subtitle}
              </p>
            </div>
          </div>
          <StatusBadge status={status} accent={c.accent} />
        </div>

        {(isActive || isDone) && (
          <div className="progress-bar mt-5 mb-3">
            <motion.div
              className="progress-bar-fill"
              style={{ background: c.bar }}
              initial={{ width: "0%" }}
              animate={{ width: isDone ? "100%" : "65%" }}
              transition={{ duration: isDone ? 0.4 : 1.2, ease: "easeOut" }}
            />
          </div>
        )}

        <p
          className="text-xs mt-3"
          style={{
            color:
              status === "error"
                ? "var(--redline)"
                : status === "done"
                  ? "var(--remedy)"
                  : "var(--ash)",
          }}
        >
          {statusHint[status]}
        </p>
      </div>
    </motion.div>
  );
}

function StatusBadge({
  status,
  accent,
}: {
  status: AgentStatus;
  accent: string;
}) {
  if (status === "pending") {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs flex-shrink-0"
        style={{
          background: "rgba(255,255,255,0.05)",
          color: "rgba(226,232,240,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Clock size={10} /> Pending
      </div>
    );
  }
  if (status === "active") {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs flex-shrink-0"
        style={{
          background: `${accent}20`,
          color: accent,
          border: `1px solid ${accent}40`,
        }}
      >
        <Loader2 size={10} className="animate-spin" /> Active
      </div>
    );
  }
  if (status === "done") {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs flex-shrink-0"
        style={{
          background: "rgba(0,255,136,0.1)",
          color: "var(--green)",
          border: "1px solid rgba(0,255,136,0.3)",
        }}
      >
        <CheckCircle size={10} /> Done
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs flex-shrink-0"
      style={{
        background: "rgba(255,51,102,0.1)",
        color: "var(--red)",
        border: "1px solid rgba(255,51,102,0.3)",
      }}
    >
      Error
    </div>
  );
}
