"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/UploadZone";
import { ChevronDown, ArrowRight } from "lucide-react";

/* ── data ── */

const annotations = [
  {
    agent: "Devil's Advocate",
    icon: "💀",
    color: "#E23E57",
    label: "Critical risk",
    target: "TAM",
    critique:
      "Top-down market size calculation based on '1% capture' is a classic VC filter point. You fail to establish your bottoms-up GTM customer acquisition cost.",
    caseMatch: "WeWork Post-Mortem — arbitrary unit metrics & top-down TAM",
    remedy: null,
  },
  {
    agent: "Market Validator",
    icon: "📊",
    color: "#ffb800",
    label: "Unvalidated",
    target: "SAM",
    critique:
      "A $10 Billion SAM represents a high-density competitive space. No competitor CAC or unit economics projections to defend how you scale here.",
    caseMatch: null,
    remedy: null,
  },
  {
    agent: "Improvement Agent",
    icon: "⚡",
    color: "#34D399",
    label: "Fix available",
    target: "SOM",
    critique:
      "Targeting a $1B SOM directly is too vague. Restructure this slide with a bottom-up formula.",
    caseMatch: null,
    remedy:
      "Compute SOM as: [Target companies in region] × [ACV]. Add a competitive moat defensibility matrix immediately after.",
  },
];

const agents = [
  {
    name: "Devil's Advocate",
    icon: "💀",
    color: "#E23E57",
    role: "Finds what's broken",
    description:
      "Hunts for the claims that will get you killed in a partner meeting. Stress-tests financial models, growth rates, and market size claims against real investor grilling patterns.",
  },
  {
    name: "Market Validator",
    icon: "📊",
    color: "#ffb800",
    role: "Measures against reality",
    description:
      "Cross-references every assumption against 1,000+ startup post-mortems and competitor structures. If your numbers don't hold up against history, you'll know exactly why.",
  },
  {
    name: "Improvement Agent",
    icon: "⚡",
    color: "#34D399",
    role: "Fixes what's broken",
    description:
      "Provides specific rewrites: bottom-up calculations to replace hand-waved TAMs, competitive moat structures, and copy fixes that make each slide defensible.",
  },
];

const faqs = [
  {
    q: "What file formats are supported?",
    a: "PDF pitch decks only. We extract text, layout, and slide structure to run our analysis. Your file is processed in memory and purged after analysis completes — nothing is stored.",
  },
  {
    q: "How long does the analysis take?",
    a: "Under 2 minutes. The three agents run in parallel across your slides, and results stream to your browser in real-time as each agent finishes.",
  },
  {
    q: "Is my pitch deck confidential?",
    a: "Yes. We don't train on your uploads, store your files, or share data with third parties. Analysis runs on sandboxed endpoints and results are cached locally in your browser.",
  },
  {
    q: "What AI models are used?",
    a: "We use the Mastra framework to orchestrate analysis across NVIDIA NIM endpoints including Llama-3-70B and specialized embedding models optimized against real startup failure data.",
  },
];

const slideBoxes = [
  { label: "TAM", value: "$100B", desc: "Global food spending", annotationIdx: 0 },
  { label: "SAM", value: "$10B", desc: "Online food delivery", annotationIdx: 1 },
  { label: "SOM", value: "$1B", desc: "10% share in year 3", annotationIdx: 2 },
];

export default function HomePage() {
  const router = useRouter();
  const [activeAnnotation, setActiveAnnotation] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{ background: "var(--void)", color: "var(--parchment)", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute rounded-full"
          style={{
            width: 800,
            height: 800,
            background: "radial-gradient(circle, rgba(226,62,87,0.035) 0%, transparent 65%)",
            top: "-15%",
            left: "30%",
            filter: "blur(120px)",
          }}
        />
      </div>

      {/* ═══════════════  NAV  ═══════════════ */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🔬</span>
          <span className="font-space font-bold text-sm tracking-wider uppercase" style={{ color: "var(--parchment)" }}>
            PITCH<span style={{ color: "var(--redline)" }}>AUTOPSY</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            className="text-sm transition-colors duration-200 hover:opacity-100"
            style={{ color: "var(--graphite)" }}
          >
            How it works
          </button>
          <button
            onClick={() => router.push("/history")}
            className="text-sm transition-colors duration-200 hover:opacity-100"
            style={{ color: "var(--graphite)" }}
          >
            History
          </button>
        </div>
      </nav>

      {/* ═══════════════  HERO  ═══════════════ */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pt-16 lg:pt-24 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display leading-[1.08] mb-6"
          style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)", color: "var(--parchment)" }}
        >
          Your pitch deck has{" "}
          <em style={{ color: "var(--redline)" }}>problems you can&apos;t see.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-lg max-w-xl mx-auto mb-12 leading-relaxed"
          style={{ color: "var(--graphite)" }}
        >
          Three AI agents trained on 1,000+ startup failures dissect every slide.
          You get the brutal truth and a fix for each weakness — in under 2 minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-lg mx-auto"
        >
          <UploadZone />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-sm"
          style={{ color: "var(--graphite)" }}
        >
          <span>200+ decks analyzed</span>
          <span className="hidden sm:block w-1 h-1 rounded-full opacity-40" style={{ background: "var(--graphite)" }} />
          <span>PDF only</span>
          <span className="hidden sm:block w-1 h-1 rounded-full opacity-40" style={{ background: "var(--graphite)" }} />
          <span>~2 min average</span>
        </motion.div>
      </section>

      {/* ═══════════════  RED-PEN DEMO  ═══════════════ */}
      <section
        id="how-it-works"
        className="relative z-10 max-w-6xl mx-auto px-6 py-24"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl lg:text-4xl mb-4" style={{ color: "var(--parchment)" }}>
            See what an autopsy looks like
          </h2>
          <p className="text-sm" style={{ color: "var(--graphite)" }}>
            Click the markers to see how each agent annotates a real slide.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Mock pitch slide — warm light background contrasts against dark page */}
          <div
            className="lg:col-span-7 relative rounded-lg overflow-hidden flex flex-col justify-between"
            style={{ background: "#F7F5F0", padding: "2.5rem 2rem", minHeight: 420 }}
          >
            {/* Slide header */}
            <div className="mb-8">
              <p className="text-xs font-space uppercase tracking-wider mb-2" style={{ color: "#9CA3AF" }}>
                Slide 3 of 12
              </p>
              <h3 className="font-space font-bold text-xl lg:text-2xl" style={{ color: "#1F2937" }}>
                Our Addressable Market Opportunity
              </h3>
              <p className="text-sm italic mt-1" style={{ color: "#6B7280" }}>
                We plan to capture 1% of a massive $100 Billion global industry.
              </p>
            </div>

            {/* Market size boxes with annotation markers */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 my-auto">
              {slideBoxes.map((box, i) => (
                <div
                  key={i}
                  className="relative p-3 sm:p-4 rounded-md cursor-pointer transition-all duration-200"
                  style={{
                    background: "#FFFFFF",
                    border: activeAnnotation === box.annotationIdx
                      ? `2px solid ${annotations[box.annotationIdx].color}`
                      : "1px solid #E5E7EB",
                    boxShadow: activeAnnotation === box.annotationIdx
                      ? `0 0 20px ${annotations[box.annotationIdx].color}18`
                      : "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                  onClick={() => setActiveAnnotation(box.annotationIdx)}
                >
                  <p className="text-[10px] font-space uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>
                    {box.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-space font-bold" style={{ color: "#1F2937" }}>
                    {box.value}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: "#9CA3AF" }}>
                    {box.desc}
                  </p>

                  {/* Annotation dot */}
                  <div
                    className="annotation-dot absolute -top-1.5 -right-1.5"
                    style={{ background: annotations[box.annotationIdx].color }}
                  />

                  {/* Animated strikethrough on active box */}
                  {activeAnnotation === box.annotationIdx && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute left-3 right-3 h-[2px] origin-left"
                      style={{
                        top: "52%",
                        background: annotations[box.annotationIdx].color,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Source line */}
            <p className="text-[10px] mt-6 uppercase tracking-wider" style={{ color: "#D1D5DB" }}>
              Source: Statista Report (2024) · Proprietary specimen
            </p>
          </div>

          {/* Critique panel */}
          <div
            className="lg:col-span-5 rounded-lg p-6 flex flex-col justify-between"
            style={{ background: "var(--slate-surface)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAnnotation}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Agent header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{annotations[activeAnnotation].icon}</span>
                    <h4 className="font-space font-semibold text-sm" style={{ color: "var(--parchment)" }}>
                      {annotations[activeAnnotation].agent}
                    </h4>
                  </div>
                  <span
                    className="text-[11px] font-space font-medium px-2.5 py-1 rounded-full uppercase tracking-wide"
                    style={{
                      background: `${annotations[activeAnnotation].color}15`,
                      color: annotations[activeAnnotation].color,
                      border: `1px solid ${annotations[activeAnnotation].color}30`,
                    }}
                  >
                    {annotations[activeAnnotation].label}
                  </span>
                </div>

                {/* Critique */}
                <div>
                  <p className="text-xs uppercase tracking-wider mb-2 font-space" style={{ color: "var(--graphite)" }}>
                    Observation
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(240,237,230,0.75)" }}>
                    {annotations[activeAnnotation].critique}
                  </p>
                </div>

                {/* Remedy */}
                {annotations[activeAnnotation].remedy && (
                  <div className="p-4 rounded-md" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                    <p className="text-xs uppercase tracking-wider mb-2 font-space" style={{ color: "var(--remedy)" }}>
                      Recommended fix
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(240,237,230,0.7)" }}>
                      {annotations[activeAnnotation].remedy}
                    </p>
                  </div>
                )}

                {/* Case match */}
                {annotations[activeAnnotation].caseMatch && (
                  <div className="flex items-start gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-xs mt-0.5" style={{ color: "var(--redline)" }}>↗</span>
                    <p className="text-xs" style={{ color: "var(--graphite)" }}>
                      Historical match:{" "}
                      <span style={{ color: "var(--redline)" }}>
                        {annotations[activeAnnotation].caseMatch}
                      </span>
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Dot navigation */}
            <div className="flex gap-2 justify-center pt-6 mt-6">
              {annotations.map((a, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveAnnotation(idx)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: activeAnnotation === idx ? 20 : 8,
                    height: 8,
                    background: activeAnnotation === idx ? a.color : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════  THREE AGENTS  ═══════════════ */}
      <section className="relative z-10 px-6 py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl lg:text-4xl mb-4" style={{ color: "var(--parchment)" }}>
              Three perspectives. One verdict.
            </h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--graphite)" }}>
              Each agent evaluates your deck from a distinct angle, then delivers a combined report.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group rounded-lg p-6 flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "var(--slate-surface)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: `3px solid ${agent.color}`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <h3 className="font-space font-bold text-base" style={{ color: "var(--parchment)" }}>
                      {agent.name}
                    </h3>
                    <span className="text-xs" style={{ color: agent.color }}>
                      {agent.role}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--graphite)" }}>
                  {agent.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════  FAQ  ═══════════════ */}
      <section className="relative z-10 px-6 py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl lg:text-4xl mb-12 text-center" style={{ color: "var(--parchment)" }}>
            Questions
          </h2>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden transition-colors duration-200"
                style={{
                  background: openFaq === i ? "rgba(255,255,255,0.03)" : "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium pr-4" style={{ color: "var(--parchment)" }}>
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown size={16} style={{ color: "var(--graphite)" }} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════  CTA  ═══════════════ */}
      <section className="relative z-10 px-6 py-24" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl lg:text-4xl mb-4" style={{ color: "var(--parchment)" }}>
            Your pitch won&apos;t fix itself.
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--graphite)" }}>
            Upload your deck, get the autopsy, and iterate before investors do it for you.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-space font-semibold text-sm tracking-wide transition-all duration-300 hover:shadow-[0_0_30px_rgba(226,62,87,0.15)]"
            style={{
              background: "rgba(226,62,87,0.1)",
              border: "1px solid rgba(226,62,87,0.3)",
              color: "var(--redline)",
            }}
          >
            Upload your deck
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ═══════════════  FOOTER  ═══════════════ */}
      <footer
        className="relative z-10 px-6 py-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#080A0E" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔬</span>
            <span className="font-space font-bold text-xs tracking-wider uppercase" style={{ color: "var(--parchment)" }}>
              PITCH<span style={{ color: "var(--redline)" }}>AUTOPSY</span>
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--graphite)", opacity: 0.6 }}>
            Built with Mastra AI · Powered by NVIDIA NIM
          </p>
        </div>
      </footer>
    </main>
  );
}
