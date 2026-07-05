"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import ParticleCanvas from "@/components/ParticleCanvas";
import SpeedometerGauge from "@/components/SpeedometerGauge";
import RiskBadge from "@/components/RiskBadge";
import ReportSection from "@/components/ReportSection";
import confetti from "canvas-confetti";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";

interface ReportData {
  score: number;
  questions: { q: string; context: string }[];
  risks: { claim: string; level: "SAFE" | "HIGH_RISK"; score: number; match: string }[];
  improvements: { slide: number; title: string; action: string }[];
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;
  const [loaded, setLoaded] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${runId}`);
        if (!res.ok) {
          throw new Error("Failed to load report. Ensure the analysis completed successfully.");
        }
        const data = await res.json();
        setReport(data);
        setLoaded(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.3 },
          colors: ["#00d4ff", "#8b5cf6", "#00ff88"],
          disableForReducedMotion: true,
        });
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [runId]);

  if (loading) {
    return (
      <main className="relative min-h-screen flex items-center justify-center" style={{ background: "var(--bg-void)" }}>
        <ParticleCanvas />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center max-w-md w-full mx-6 glow-cyan"
          style={{ borderColor: "rgba(0,212,255,0.2)" }}
        >
          <motion.div
            className="w-16 h-16 rounded-full border-4 border-t-transparent mx-auto mb-6"
            style={{ borderColor: "var(--cyan)", borderTopColor: "transparent" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="font-space font-bold text-2xl mb-2" style={{ color: "#e2e8f0" }}>
            Compiling Autopsy...
          </h2>
          <p className="text-sm" style={{ color: "rgba(226,232,240,0.5)" }}>
            Retrieving structured reports, running risk calculations, and formatting slide action plan.
          </p>
        </motion.div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="relative min-h-screen flex items-center justify-center" style={{ background: "var(--bg-void)" }}>
        <ParticleCanvas />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 text-center max-w-md w-full mx-6 glow-red"
          style={{ borderColor: "rgba(255,51,102,0.2)" }}
        >
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-space font-bold text-2xl mb-2" style={{ color: "var(--red)" }}>
            Error Loading Report
          </h2>
          <p className="text-sm mb-6" style={{ color: "rgba(226,232,240,0.6)" }}>
            {error || "Could not retrieve completed run logs."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 rounded-xl font-space font-semibold text-sm transition-all"
            style={{
              background: "rgba(255,51,102,0.1)",
              border: "1px solid rgba(255,51,102,0.4)",
              color: "var(--red)",
            }}
          >
            Back to Home
          </button>
        </motion.div>
      </main>
    );
  }

  const highRiskCount = report.risks.filter((r) => r.level === "HIGH_RISK").length;

  return (
    <main className="relative min-h-screen" style={{ background: "var(--bg-void)" }}>
      <ParticleCanvas />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-14">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(226,232,240,0.6)",
            }}
            whileHover={{ scale: 1.02, color: "#e2e8f0" }}
          >
            <ArrowLeft size={14} /> Back
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <motion.button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.25)",
                color: "var(--cyan)",
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,212,255,0.2)" }}
            >
              <RefreshCw size={14} /> Analyze Another
            </motion.button>
            <motion.button
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "var(--purple)",
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(139,92,246,0.2)" }}
              onClick={() => window.print()}
            >
              <Download size={14} /> Export
            </motion.button>
          </motion.div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-space mb-4"
            style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", color: "var(--green)" }}>
            ✅ Autopsy Complete
          </div>
          <h1 className="font-space font-bold text-5xl mb-2">
            <span style={{ color: "#e2e8f0" }}>Pitch </span>
            <span className="gradient-text">Autopsy</span>
            <span style={{ color: "#e2e8f0" }}> Report</span>
          </h1>
          <p className="text-sm" style={{ color: "rgba(226,232,240,0.4)" }}>
            Run ID: <span style={{ fontFamily: "monospace", color: "var(--cyan)" }}>{runId.slice(0, 20)}...</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <span style={{ color: "rgba(226,232,240,0.4)" }}>{new Date().toLocaleString()}</span>
          </p>
        </motion.div>

        {/* Score + Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {/* Speedometer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 flex items-center justify-center col-span-1 glow-cyan"
            style={{ borderColor: "rgba(0,212,255,0.2)" }}
          >
            {loaded && <SpeedometerGauge score={report.score} size={200} />}
          </motion.div>

          {/* Stat cards */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: "Investor Questions", value: report.questions.length, color: "var(--purple)", icon: "💀" },
              { label: "Market Claims Checked", value: report.risks.length, color: "var(--amber)", icon: "📊" },
              { label: "HIGH RISK Flags", value: highRiskCount, color: "var(--red)", icon: "⚠️" },
              { label: "Slide Improvements", value: report.improvements.length, color: "var(--green)", icon: "⚡" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass-card p-5"
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="font-space font-bold text-3xl" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(226,232,240,0.45)" }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Report Sections */}
        <div className="space-y-6">
          {/* Devil's Advocate Questions */}
          <ReportSection
            title="Brutal Investor Questions"
            icon={<span>💀</span>}
            accent="var(--purple)"
            delay={0.3}
          >
            <div className="space-y-3">
              {report.questions.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="p-4 rounded-xl"
                  style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-space font-bold text-sm mt-0.5 flex-shrink-0"
                      style={{ color: "var(--purple)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "#e2e8f0" }}>{item.q}</p>
                      <p className="text-xs" style={{ color: "rgba(226,232,240,0.45)" }}>{item.context}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ReportSection>

          {/* Market Risk Assessment */}
          <ReportSection
            title="Market Risk Assessment"
            icon={<span>📊</span>}
            accent="var(--amber)"
            delay={0.4}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Claim", "Risk Level", "Similarity", "Historical Match"].map((h) => (
                      <th key={h} className="text-left py-2 px-3 font-space text-xs"
                        style={{ color: "rgba(226,232,240,0.4)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.risks.map((risk, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 * i }}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      <td className="py-3 px-3" style={{ color: "rgba(226,232,240,0.8)" }}>{risk.claim}</td>
                      <td className="py-3 px-3"><RiskBadge level={risk.level} score={risk.score} /></td>
                      <td className="py-3 px-3 font-mono text-xs"
                        style={{ color: risk.level === "HIGH_RISK" ? "var(--red)" : "var(--green)" }}>
                        {risk.score.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: "rgba(226,232,240,0.45)" }}>{risk.match}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>

          {/* Improvement Action Plan */}
          <ReportSection
            title="Slide-by-Slide Improvement Plan"
            icon={<span>⚡</span>}
            accent="var(--green)"
            delay={0.5}
          >
            <div className="space-y-3">
              {report.improvements.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)" }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-space font-bold text-sm"
                    style={{ background: "rgba(0,255,136,0.1)", color: "var(--green)", border: "1px solid rgba(0,255,136,0.25)" }}>
                    {item.slide}
                  </div>
                  <div>
                    <p className="font-space font-semibold text-sm mb-1" style={{ color: "#e2e8f0" }}>
                      {item.title}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(226,232,240,0.6)" }}>
                      {item.action}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ReportSection>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center"
        >
          <p className="text-sm mb-4" style={{ color: "rgba(226,232,240,0.4)" }}>
            Ready to revise and test again?
          </p>
          <motion.button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-2xl font-space font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(139,92,246,0.15))",
              border: "1px solid rgba(0,212,255,0.4)",
              color: "var(--cyan)",
            }}
            whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(0,212,255,0.25)" }}
            whileTap={{ scale: 0.97 }}
          >
            🔬 Analyze Another Pitch
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
