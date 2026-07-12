"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import SpeedometerGauge from "@/components/SpeedometerGauge";
import RiskBadge from "@/components/RiskBadge";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface ReportData {
  score: number;
  questions: { q: string; context: string }[];
  risks: {
    claim: string;
    level: "SAFE" | "HIGH_RISK";
    score: number;
    match: string;
  }[];
  improvements: { slide: number; title: string; action: string }[];
  rawOutput?: {
    rawQuestions?: string;
    rawValidation?: string;
    rawImprovement?: string;
  };
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;
  const [loaded, setLoaded] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "slides" | "risks" | "grill"
  >("overview");
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/report/${runId}`);
        if (!res.ok) {
          throw new Error(
            "Failed to load report. Ensure the analysis completed successfully."
          );
        }
        const data = await res.json();
        setReport(data);
        setLoaded(true);

        // Lightweight confetti — dynamic import only on success
        try {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.25 },
            colors: ["#E23E57", "#D4A843", "#34D399", "#5BB8D4"],
            disableForReducedMotion: true,
          });
        } catch {
          /* optional */
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [runId]);

  const handleExportPdf = useCallback(() => {
    setPrinting(true);
    // Allow print layout to paint before dialog
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 80);
    });
  }, []);

  useEffect(() => {
    const onAfter = () => setPrinting(false);
    window.addEventListener("afterprint", onAfter);
    return () => window.removeEventListener("afterprint", onAfter);
  }, []);

  if (loading) {
    return (
      <main
        className="relative min-h-screen flex items-center justify-center"
        style={{ background: "var(--void)" }}
      >
        <div className="glass-card p-12 md:p-16 text-center max-w-md w-full mx-6">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto mb-8 animate-spin"
            style={{
              borderColor: "var(--cyan-muted)",
              borderTopColor: "transparent",
            }}
          />
          <h2
            className="font-space font-bold text-2xl mb-3"
            style={{ color: "var(--parchment)" }}
          >
            Compiling Autopsy...
          </h2>
          <p className="text-sm" style={{ color: "var(--ash)" }}>
            Retrieving structured reports and formatting your action plan.
          </p>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main
        className="relative min-h-screen flex items-center justify-center"
        style={{ background: "var(--void)" }}
      >
        <div
          className="glass-card p-12 text-center max-w-md w-full mx-6"
          style={{ borderColor: "rgba(226,62,87,0.25)" }}
        >
          <div className="text-4xl mb-5">⚠️</div>
          <h2
            className="font-space font-bold text-2xl mb-3"
            style={{ color: "var(--redline)" }}
          >
            Error Loading Report
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--ash)" }}>
            {error || "Could not retrieve completed run logs."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl font-space font-semibold text-xs"
            style={{
              background: "rgba(226,62,87,0.1)",
              border: "1px solid rgba(226,62,87,0.35)",
              color: "var(--redline)",
            }}
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const highRiskCount = report.risks.filter(
    (r) => r.level === "HIGH_RISK"
  ).length;
  const slideImprovements = report.improvements || [];

  return (
    <main
      className={`relative min-h-screen flex flex-col items-center w-full report-page ${
        printing ? "is-printing" : ""
      }`}
      style={{ background: "var(--void)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0 no-print"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
        }}
      />

      <div className="page-shell page-main relative z-10 w-full">
        {/* Actions — screen only */}
        <div className="flex items-center justify-between mb-12 md:mb-14 no-print">
          <button
            onClick={() => router.push("/history")}
            className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--ash)",
            }}
          >
            <ArrowLeft size={14} /> Back to History
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl"
              style={{
                background: "rgba(91,184,212,0.08)",
                border: "1px solid rgba(91,184,212,0.25)",
                color: "var(--cyan-muted)",
              }}
            >
              <RefreshCw size={14} /> Analyze Another
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl"
              style={{
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "var(--purple)",
              }}
            >
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-10 md:mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-space mb-5 no-print"
            style={{
              background: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.3)",
              color: "var(--remedy)",
            }}
          >
            ✅ Autopsy Verified & Graded
          </div>
          <h1 className="font-display text-4xl lg:text-5xl mb-4">
            <span style={{ color: "var(--parchment)" }}>Pitch </span>
            <span style={{ color: "var(--redline)" }}>Autopsy</span>
            <span style={{ color: "var(--parchment)" }}> Report</span>
          </h1>
          <p className="text-sm" style={{ color: "var(--ash)" }}>
            Run ID:{" "}
            <span
              style={{ fontFamily: "monospace", color: "var(--cyan-muted)" }}
            >
              {runId}
            </span>
          </p>
        </div>

        {/* Tabs — screen only */}
        <div className="flex flex-wrap border-b border-white/5 mb-10 gap-2 no-print">
          {(
            [
              { id: "overview", label: "Executive Summary", icon: "📊" },
              { id: "slides", label: "Slide Annotations", icon: "📄" },
              { id: "risks", label: "Failure Risk Matrix", icon: "⚠️" },
              { id: "grill", label: "Investor Grill List", icon: "💀" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-xs font-space font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ========== SCREEN TABS ========== */}
        <div className={`no-print ${printing ? "hidden" : "block"}`}>
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                <OverviewPanel
                  report={report}
                  loaded={loaded}
                  highRiskCount={highRiskCount}
                />
              </motion.div>
            )}

            {activeTab === "slides" && (
              <motion.div
                key="slides"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <SlidesPanel
                  slides={slideImprovements}
                  raw={report.rawOutput?.rawImprovement}
                />
              </motion.div>
            )}

            {activeTab === "risks" && (
              <motion.div
                key="risks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <RisksPanel
                  risks={report.risks}
                  raw={report.rawOutput?.rawValidation}
                />
              </motion.div>
            )}

            {activeTab === "grill" && (
              <motion.div
                key="grill"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <GrillPanel
                  questions={report.questions}
                  raw={report.rawOutput?.rawQuestions}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========== PRINT DOCUMENT (all sections) ========== */}
        <div className={`print-only-document ${printing ? "block" : "hidden"}`}>
          <section className="print-section">
            <h2 className="print-h2">1. Executive Summary</h2>
            <OverviewPanel
              report={report}
              loaded={true}
              highRiskCount={highRiskCount}
            />
          </section>
          <section className="print-section">
            <h2 className="print-h2">2. Slide Annotations</h2>
            <SlidesPanel
              slides={slideImprovements}
              raw={report.rawOutput?.rawImprovement}
            />
          </section>
          <section className="print-section">
            <h2 className="print-h2">3. Failure Risk Matrix</h2>
            <RisksPanel
              risks={report.risks}
              raw={report.rawOutput?.rawValidation}
            />
          </section>
          <section className="print-section print-section-last">
            <h2 className="print-h2">4. Investor Grill List</h2>
            <GrillPanel
              questions={report.questions}
              raw={report.rawOutput?.rawQuestions}
            />
          </section>
        </div>

        <div className="mt-16 md:mt-20 text-center border-t border-white/5 pt-12 no-print">
          <p className="text-sm mb-6" style={{ color: "var(--ash)" }}>
            Ready to correct your deck and run again?
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-4 rounded-2xl font-space font-semibold text-xs bg-white/5 border border-white/10 text-neutral-300"
          >
            🔬 Stress Test New Deck Draft
          </button>
        </div>
      </div>
    </main>
  );
}

function OverviewPanel({
  report,
  loaded,
  highRiskCount,
}: {
  report: ReportData;
  loaded: boolean;
  highRiskCount: number;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card card-pad flex flex-col items-center justify-center min-h-[260px]">
          <h3 className="text-xs font-space text-neutral-400 mb-4 uppercase font-bold tracking-wider">
            Pitch Health Score
          </h3>
          {loaded && <SpeedometerGauge score={report.score} size={180} />}
        </div>
        <div className="glass-card card-pad md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-space text-neutral-400 mb-4 uppercase font-bold tracking-wider">
              Autopsy Verdict Summary
            </h3>
            <p className="text-sm leading-relaxed text-neutral-300">
              Agents analyzed claims across your deck against historical failure
              patterns. Your pitch health score is{" "}
              <strong style={{ color: "var(--cyan-muted)" }}>
                {report.score}%
              </strong>
              .
              {highRiskCount > 0
                ? ` We flagged ${highRiskCount} high-risk assumption${highRiskCount === 1 ? "" : "s"} similar to known startup failures.`
                : " No critical high-risk structural failures were identified from the validation pass."}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap border-t border-white/5 pt-6 mt-6">
            <span className="text-[10px] px-3 py-1 rounded-full font-space bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              🛡️ Toxicity Safe
            </span>
            <span className="text-[10px] px-3 py-1 rounded-full font-space bg-purple-500/10 border border-purple-500/25 text-purple-400">
              🤖 Enkrypt Graded
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Investor Questions",
            value: report.questions.length,
            color: "var(--purple)",
            icon: "💀",
          },
          {
            label: "Market Claims Checked",
            value: report.risks.length,
            color: "var(--amber)",
            icon: "📊",
          },
          {
            label: "HIGH RISK Flags",
            value: highRiskCount,
            color: "var(--red)",
            icon: "⚠️",
          },
          {
            label: "Slide Improvements",
            value: report.improvements.length,
            color: "var(--green)",
            icon: "⚡",
          },
        ].map((stat) => (
          <div key={stat.label} className="glass-card card-pad">
            <div className="text-xl mb-3">{stat.icon}</div>
            <div
              className="font-space font-bold text-3xl"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-[11px] mt-2 text-neutral-500 font-space">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SlidesPanel({
  slides,
  raw,
}: {
  slides: { slide: number; title: string; action: string }[];
  raw?: string;
}) {
  if (slides.length === 0) {
    return (
      <div className="glass-card card-pad text-center py-12">
        <p className="text-sm text-neutral-400 mb-4">
          No structured slide improvements were parsed for this run.
        </p>
        {raw ? (
          <details className="text-left max-w-3xl mx-auto">
            <summary
              className="text-xs font-space cursor-pointer mb-3"
              style={{ color: "var(--cyan-muted)" }}
            >
              Show raw improvement output
            </summary>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap p-4 rounded-xl max-h-96 overflow-y-auto text-neutral-400 bg-black/30 border border-white/5">
              {raw}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm mb-2" style={{ color: "var(--ash)" }}>
        {slides.length} slide rewrite{slides.length === 1 ? "" : "s"} from the
        Improvement Agent.
      </p>
      {slides.map((s) => (
        <article
          key={s.slide}
          className="glass-card card-pad border border-white/5 slide-card"
        >
          <div className="flex items-start gap-4 mb-4">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center font-space font-bold text-sm flex-shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {s.slide}
            </span>
            <div>
              <p className="text-[10px] font-space uppercase tracking-wider text-neutral-500 mb-1">
                Slide {s.slide}
              </p>
              <h3 className="font-space font-bold text-base text-white">
                {s.title}
              </h3>
            </div>
          </div>
          <div className="pl-0 md:pl-14">
            <h4 className="text-[10px] font-space uppercase tracking-wider text-neutral-500 mb-2 font-bold">
              Rewrite action
            </h4>
            <p className="text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
              {s.action}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function RisksPanel({
  risks,
  raw,
}: {
  risks: ReportData["risks"];
  raw?: string;
}) {
  if (risks.length === 0) {
    return (
      <div className="glass-card card-pad text-center py-12">
        <AlertTriangle className="mx-auto mb-3 text-amber-400" size={22} />
        <p className="text-sm text-neutral-400 mb-4">
          No structured risk rows were parsed for this run.
        </p>
        {raw ? (
          <details className="text-left max-w-3xl mx-auto">
            <summary
              className="text-xs font-space cursor-pointer mb-3"
              style={{ color: "var(--cyan-muted)" }}
            >
              Show raw validation output
            </summary>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap p-4 rounded-xl max-h-96 overflow-y-auto text-neutral-400 bg-black/30 border border-white/5">
              {raw}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--ash)" }}>
        {risks.length} claim{risks.length === 1 ? "" : "s"} checked against
        historical failure patterns.
      </p>
      {risks.map((risk, i) => (
        <div
          key={i}
          className="glass-card p-5 md:p-6 border border-white/5 flex flex-col md:flex-row md:items-start gap-4"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-space uppercase tracking-wider text-neutral-500 mb-1">
              Claim {i + 1}
            </p>
            <p className="text-sm text-neutral-200 leading-relaxed font-medium">
              {risk.claim}
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              Match:{" "}
              <span className="text-rose-400/90 font-medium">{risk.match}</span>
            </p>
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 flex-shrink-0">
            <RiskBadge level={risk.level} score={risk.score} />
            <span className="font-mono text-xs text-neutral-400">
              sim {risk.score.toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function GrillPanel({
  questions,
  raw,
}: {
  questions: ReportData["questions"];
  raw?: string;
}) {
  return (
    <>
      <div className="glass-card card-pad border border-white/5 mb-2">
        <h3 className="font-space font-bold text-lg text-white mb-3">
          💀 Devil&apos;s Advocate Grilling Checklist
        </h3>
        <p className="text-sm text-neutral-400 leading-relaxed">
          {questions.length > 0
            ? `These ${questions.length} critical partner-meeting questions target weaknesses in your deck.`
            : "Investor questions appear here when the Devil's Advocate step returns structured output."}
        </p>
      </div>

      {questions.length > 0 ? (
        <div className="grid grid-cols-1 gap-5">
          {questions.map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border flex items-start gap-5 bg-purple-950/5 border-purple-500/10"
            >
              <span className="font-space font-extrabold text-sm flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400 border border-purple-500/15">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-200 font-space mb-2 leading-snug">
                  {item.q}
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {item.context}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card card-pad border border-white/5 text-center py-12">
          <p className="text-sm text-neutral-400 mb-4">
            No structured questions were parsed for this run.
          </p>
          {raw ? (
            <details className="text-left max-w-3xl mx-auto">
              <summary
                className="text-xs font-space cursor-pointer mb-3"
                style={{ color: "var(--cyan-muted)" }}
              >
                Show raw agent output
              </summary>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap p-4 rounded-xl max-h-96 overflow-y-auto text-neutral-400 bg-black/30 border border-white/5">
                {raw}
              </pre>
            </details>
          ) : null}
        </div>
      )}
    </>
  );
}
