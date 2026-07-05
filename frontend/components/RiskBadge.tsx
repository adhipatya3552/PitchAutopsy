"use client";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface RiskBadgeProps {
  level: "SAFE" | "HIGH_RISK";
  score?: number;
}

export default function RiskBadge({ level, score }: RiskBadgeProps) {
  const isSafe = level === "SAFE";
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-space ${
        isSafe ? "badge-safe" : "badge-risk"
      }`}
    >
      {isSafe ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
      {isSafe ? "SAFE" : "HIGH RISK"}
      {score !== undefined && (
        <span className="opacity-70 font-normal ml-1">
          ({score.toFixed(2)})
        </span>
      )}
    </motion.span>
  );
}
