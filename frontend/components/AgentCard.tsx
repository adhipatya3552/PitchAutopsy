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

export default function AgentCard({
  name, subtitle, icon, status, output, color, index,
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
    const rotY = ((e.clientX - cx) / rect.width) * 10;
    const rotX = -((e.clientY - cy) / rect.height) * 10;
    setTilt({ x: rotX, y: rotY });
  };

  const onMouseLeave = () => setTilt({ x: 0, y: 0 });

  const isActive = status === "active";
  const isDone = status === "done";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        className={`glass-card border-spin ${c.spin} p-7 transition-all duration-300 ${
          isActive ? `${c.glow} ${c.pulse}` : isDone ? c.glow : ""
        }`}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: tilt.x === 0 && tilt.y === 0 ? "transform 0.5s ease" : "transform 0.1s ease",
          borderColor: isActive || isDone ? `${c.accent}40` : "var(--glass-border)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon bubble */}
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: `${c.dim}`,
                border: `1px solid ${c.accent}40`,
                color: c.accent,
              }}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {icon}
            </motion.div>
            <div>
              <h3 className="font-space font-bold text-base" style={{ color: "#e2e8f0" }}>
                {name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(226,232,240,0.45)" }}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <StatusBadge status={status} accent={c.accent} />
        </div>

        {/* Progress bar */}
        {(isActive || isDone) && (
          <div className="progress-bar mb-4">
            <motion.div
              className="progress-bar-fill"
              style={{ background: c.bar }}
              initial={{ width: "0%" }}
              animate={{ width: isDone ? "100%" : "65%" }}
              transition={{ duration: isDone ? 0.5 : 2, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Output text */}
        {output && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.4 }}
            className="mt-2 p-3 rounded-xl text-xs leading-relaxed overflow-hidden"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(226,232,240,0.7)",
              maxHeight: "160px",
              overflowY: "auto",
              fontFamily: "var(--font-inter)",
            }}
          >
            <TypewriterText text={output} isActive={isActive} />
            {isActive && <span className="cursor-blink" />}
          </motion.div>
        )}

        {/* Pending state */}
        {status === "pending" && (
          <p className="text-xs mt-2" style={{ color: "rgba(226,232,240,0.3)" }}>
            Waiting for previous step to complete...
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatusBadge({ status, accent }: { status: AgentStatus; accent: string }) {
  if (status === "pending") {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(226,232,240,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Clock size={10} /> Pending
      </div>
    );
  }
  if (status === "active") {
    return (
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
        style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Loader2 size={10} className="animate-spin" /> Active
      </motion.div>
    );
  }
  if (status === "done") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
        style={{ background: "rgba(0,255,136,0.1)", color: "var(--green)", border: "1px solid rgba(0,255,136,0.3)" }}
      >
        <CheckCircle size={10} /> Done
      </motion.div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
      style={{ background: "rgba(255,51,102,0.1)", color: "var(--red)", border: "1px solid rgba(255,51,102,0.3)" }}>
      Error
    </div>
  );
}

function TypewriterText({ text, isActive }: { text: string; isActive: boolean }) {
  if (!isActive) return <span>{text}</span>;
  // For active, just show the text (SSE already streams char-by-char via state)
  return <span>{text}</span>;
}
