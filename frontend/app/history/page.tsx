"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  RefreshCw,
  Calendar,
  Activity,
  FileText,
  AlertTriangle,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";

interface HistoryItem {
  runId: string;
  fileName: string;
  createdAt: string;
  status: string;
  score: number;
  highRisks: number;
  questionsCount: number;
}

function scoreColor(score: number): string {
  if (score >= 75) return "var(--remedy)";
  if (score >= 50) return "var(--evidence)";
  return "var(--redline)";
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalAutopsies = history.length;
  const successfulAutopsies = history.filter((h) => h.status === "success");
  const averageScore = successfulAutopsies.length
    ? Math.round(
        successfulAutopsies.reduce((sum, item) => sum + item.score, 0) /
          successfulAutopsies.length
      )
    : 0;
  const totalHighRisks = history.reduce(
    (sum, item) => sum + item.highRisks,
    0
  );

  return (
    <main
      className="relative min-h-screen flex flex-col items-center w-full"
      style={{
        background: "var(--void)",
        color: "var(--parchment)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Navbar */}
      <Navbar />

      <div className="page-shell page-main relative z-10 w-full">
        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-14 md:mb-16"
        >
          <div>
            <h1
              className="font-display text-4xl lg:text-5xl mb-4"
              style={{ color: "var(--parchment)" }}
            >
              Autopsy History
            </h1>
            <p
              className="text-sm max-w-md leading-relaxed"
              style={{ color: "var(--ash)" }}
            >
              Review past pitch deck analyses, scores, and flagged risks.
            </p>
          </div>

          <motion.button
            onClick={fetchHistory}
            className="flex items-center gap-2 text-xs font-space px-4 py-2 rounded-lg transition-all"
            style={{
              background: "rgba(226,62,87,0.06)",
              border: "1px solid rgba(226,62,87,0.15)",
              color: "var(--redline)",
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 0 15px rgba(226,62,87,0.1)",
            }}
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin" : ""}
            />{" "}
            Refresh
          </motion.button>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14 md:mb-16">
          {/* Total autopsies */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="card-pad rounded-xl"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="text-xs font-space uppercase tracking-wider mb-3"
              style={{ color: "var(--ash)" }}
            >
              Total Autopsies
            </div>
            <div className="font-space font-bold text-3xl text-white">
              {totalAutopsies}
            </div>
          </motion.div>

          {/* Average score — color-coded */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-pad rounded-xl"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="text-xs font-space uppercase tracking-wider mb-3"
              style={{ color: "var(--ash)" }}
            >
              Average Health Score
            </div>
            <div
              className="font-space font-bold text-3xl"
              style={{
                color: averageScore > 0 ? scoreColor(averageScore) : "var(--ash)",
              }}
            >
              {averageScore > 0 ? `${averageScore}%` : "—"}
            </div>
          </motion.div>

          {/* Total high risks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-pad rounded-xl"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              className="text-xs font-space uppercase tracking-wider mb-3"
              style={{ color: "var(--ash)" }}
            >
              High Risks Flagged
            </div>
            <div
              className="font-space font-bold text-3xl"
              style={{ color: totalHighRisks > 0 ? "var(--redline)" : "var(--ash)" }}
            >
              {totalHighRisks}
            </div>
          </motion.div>
        </div>

        {/* History list */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="history-row h-24 animate-pulse flex items-center justify-between"
                  style={{ opacity: 0.4 }}
                >
                  <div
                    className="w-1/3 h-4 rounded"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                  <div
                    className="w-1/6 h-4 rounded"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-16 rounded-2xl"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(226,62,87,0.15)",
              }}
            >
              <AlertTriangle
                size={24}
                className="mx-auto mb-4"
                style={{ color: "var(--redline)" }}
              />
              <h3 className="font-space font-bold text-lg text-white mb-2">
                Error Loading History
              </h3>
              <p className="text-sm" style={{ color: "var(--ash)" }}>
                {error}
              </p>
            </motion.div>
          ) : history.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 px-8 rounded-2xl"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <FileText
                size={32}
                className="mx-auto mb-5"
                style={{ color: "var(--ash)" }}
              />
              <h3 className="font-space font-bold text-xl mb-3 text-white">
                No Reports Yet
              </h3>
              <p
                className="text-sm max-w-sm mx-auto mb-10 leading-relaxed"
                style={{ color: "var(--ash)" }}
              >
                Upload a pitch deck to generate your first stress-testing
                report.
              </p>
              <motion.button
                onClick={() => router.push("/")}
                className="px-6 py-3 rounded-xl font-space font-semibold text-sm"
                style={{
                  background: "rgba(226,62,87,0.08)",
                  border: "1px solid rgba(226,62,87,0.2)",
                  color: "var(--redline)",
                }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 0 20px rgba(226,62,87,0.1)",
                }}
              >
                Analyze Your First Pitch
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {history.map((item, idx) => (
                <motion.div
                  key={item.runId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => {
                    if (item.status === "success") {
                      router.push(`/report/${item.runId}`);
                    } else {
                      router.push(`/analyze/${item.runId}`);
                    }
                  }}
                  className="history-row flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-center gap-5">
                    {/* Status dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background:
                          item.status === "success"
                            ? "var(--remedy)"
                            : item.status === "failed"
                              ? "var(--redline)"
                              : "var(--evidence)",
                        boxShadow:
                          item.status === "success"
                            ? "0 0 8px rgba(52,211,153,0.4)"
                            : item.status === "failed"
                              ? "0 0 8px rgba(226,62,87,0.4)"
                              : "0 0 8px rgba(212,168,67,0.4)",
                      }}
                    />
                    <div>
                      <h4
                        className="font-space font-semibold text-base group-hover:text-white transition-colors"
                        style={{ color: "var(--parchment)" }}
                      >
                        {item.fileName}
                      </h4>
                      <div
                        className="flex items-center gap-4 text-xs mt-1.5"
                        style={{ color: "var(--ash)" }}
                      >
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity size={11} />{" "}
                          <span
                            style={{
                              color:
                                item.status === "success"
                                  ? "var(--remedy)"
                                  : item.status === "failed"
                                    ? "var(--redline)"
                                    : "var(--evidence)",
                            }}
                          >
                            {item.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.status === "success" && (
                    <div className="flex items-center gap-8 self-end md:self-auto">
                      <div className="text-right">
                        <div
                          className="text-[10px] font-space uppercase tracking-wider"
                          style={{ color: "var(--ash)" }}
                        >
                          Questions
                        </div>
                        <div className="font-space font-semibold text-base flex items-center gap-1 justify-end">
                          <MessageSquare
                            size={12}
                            style={{ color: "var(--evidence)" }}
                          />
                          <span style={{ color: "var(--evidence)" }}>
                            {item.questionsCount}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-[10px] font-space uppercase tracking-wider"
                          style={{ color: "var(--ash)" }}
                        >
                          Risks
                        </div>
                        <div className="font-space font-semibold text-base flex items-center gap-1 justify-end">
                          <AlertTriangle
                            size={12}
                            style={{ color: "var(--redline)" }}
                          />
                          <span style={{ color: "var(--redline)" }}>
                            {item.highRisks}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-[10px] font-space uppercase tracking-wider"
                          style={{ color: "var(--ash)" }}
                        >
                          Score
                        </div>
                        <div
                          className="font-space font-bold text-xl"
                          style={{ color: scoreColor(item.score) }}
                        >
                          {item.score}%
                        </div>
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="opacity-0 group-hover:opacity-50 transition-opacity"
                        style={{ color: "var(--parchment)" }}
                      />
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
