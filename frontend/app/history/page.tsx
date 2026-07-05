"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ParticleCanvas from "@/components/ParticleCanvas";
import SpeedometerGauge from "@/components/SpeedometerGauge";
import RiskBadge from "@/components/RiskBadge";
import { ArrowLeft, RefreshCw, Trash2, Calendar, FileText, Activity } from "lucide-react";

interface HistoryItem {
  runId: string;
  fileName: string;
  createdAt: string;
  status: string;
  score: number;
  highRisks: number;
  questionsCount: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchHistory() {
    try {
      setLoading(true);
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Failed to load history list.");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalAutopsies = history.length;
  const successfulAutopsies = history.filter(h => h.status === "success");
  const averageScore = successfulAutopsies.length 
    ? Math.round(successfulAutopsies.reduce((sum, item) => sum + item.score, 0) / successfulAutopsies.length) 
    : 0;
  const totalHighRisks = history.reduce((sum, item) => sum + item.highRisks, 0);

  return (
    <main className="relative min-h-screen pb-20" style={{ background: "var(--bg-void)" }}>
      <ParticleCanvas />

      {/* Grid overlay for depth */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12">
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-16">
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
            <ArrowLeft size={14} /> Back to Analysis
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={fetchHistory}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.25)",
              color: "var(--cyan)",
            }}
            whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(0,212,255,0.15)" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </motion.button>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-space mb-4"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "var(--purple)" }}>
            🔬 Local SQLite Archive
          </div>
          <h1 className="font-space font-bold text-5xl mb-2">
            <span style={{ color: "#e2e8f0" }}>Autopsy </span>
            <span className="gradient-text">History</span>
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "rgba(226,232,240,0.45)" }}>
            Review past pitch deck stress testing results, scores, and flagged failure risks from your local database logs.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {[
            { label: "Total Autopsies", value: totalAutopsies, icon: "📁", color: "var(--purple)" },
            { label: "Average Health Score", value: `${averageScore}%`, icon: "⚡", color: "var(--cyan)" },
            { label: "Total High Risks Flagged", value: totalHighRisks, icon: "⚠️", color: "var(--red)" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-6"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="font-space font-bold text-4xl" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: "rgba(226,232,240,0.4)" }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* History List/Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 gap-4"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card p-6 h-24 animate-pulse flex items-center justify-between" style={{ opacity: 0.5 }}>
                  <div className="w-1/3 h-4 bg-gray-700 rounded" />
                  <div className="w-1/6 h-4 bg-gray-700 rounded" />
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-12 glass-card border-spin glow-red"
              style={{ borderColor: "rgba(255,51,102,0.2)" }}
            >
              <h3 className="font-space font-bold text-xl text-red-500 mb-2">Error Loading History</h3>
              <p className="text-sm" style={{ color: "rgba(226,232,240,0.5)" }}>{error}</p>
            </motion.div>
          ) : history.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 px-6 glass-card glow-cyan"
              style={{ borderColor: "rgba(0,212,255,0.15)" }}
            >
              <div className="text-5xl mb-6">📭</div>
              <h3 className="font-space font-bold text-2xl mb-2" style={{ color: "#e2e8f0" }}>No Reports Yet</h3>
              <p className="text-sm max-w-sm mx-auto mb-8" style={{ color: "rgba(226,232,240,0.5)" }}>
                You haven't run any startup pitch autopsies. Upload a pitch deck to generate your first stress-testing report!
              </p>
              <motion.button
                onClick={() => router.push("/")}
                className="px-8 py-3 rounded-2xl font-space font-semibold text-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(139,92,246,0.15))",
                  border: "1px solid rgba(0,212,255,0.4)",
                  color: "var(--cyan)",
                }}
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(0,212,255,0.25)" }}
              >
                🔬 Analyze Your First Pitch
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {history.map((item, idx) => (
                <motion.div
                  key={item.runId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    if (item.status === "success") {
                      router.push(`/report/${item.runId}`);
                    } else {
                      router.push(`/analyze/${item.runId}`);
                    }
                  }}
                  className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:border-cyan-400/30 transition-all duration-300 group"
                  whileHover={{ scale: 1.01, x: 4 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{
                        background: item.status === "success" ? "rgba(0,255,136,0.06)" : "rgba(255,51,102,0.06)",
                        border: `1px solid ${item.status === "success" ? "rgba(0,255,136,0.2)" : "rgba(255,51,102,0.2)"}`
                      }}
                    >
                      {item.status === "success" ? "📄" : "⚡"}
                    </div>
                    <div>
                      <h4 className="font-space font-semibold text-lg group-hover:text-cyan-400 transition-colors" style={{ color: "#e2e8f0" }}>
                        {item.fileName}
                      </h4>
                      <div className="flex items-center gap-4 text-xs mt-1" style={{ color: "rgba(226,232,240,0.4)" }}>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity size={12} /> Status: <span style={{ color: item.status === "success" ? "var(--green)" : "var(--red)" }}>{item.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.status === "success" && (
                    <div className="flex items-center gap-8 self-end md:self-auto">
                      <div className="text-right">
                        <div className="text-xs" style={{ color: "rgba(226,232,240,0.4)" }}>Investor Questions</div>
                        <div className="font-space font-semibold text-lg text-purple-400">{item.questionsCount}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: "rgba(226,232,240,0.4)" }}>High Risks</div>
                        <div className="font-space font-semibold text-lg text-red-400">{item.highRisks}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-space font-bold text-2xl"
                          style={{
                            color: item.score >= 75 ? "var(--green)" : item.score >= 50 ? "var(--amber)" : "var(--red)"
                          }}
                        >
                          {item.score}%
                        </span>
                        <span className="text-xs" style={{ color: "rgba(226,232,240,0.3)" }}>Score</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
