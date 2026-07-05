"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ParticleCanvas from "@/components/ParticleCanvas";
import UploadZone from "@/components/UploadZone";
import CountUp from "react-countup";
import {
  ArrowRight, Sparkles, Shield, Zap, Target,
  ChevronDown, AlertTriangle, TrendingUp, MessageSquare,
  BarChart3, Layers, CheckCircle2,
} from "lucide-react";

/* ── data ── */
const stats = [
  { value: 1000, suffix: "+", label: "Startup Post-mortems", icon: "📁", desc: "Real failure datasets analyzed" },
  { value: 500, suffix: "+", label: "Investor Questions", icon: "🎯", desc: "Battle-tested VC grilling points" },
  { value: 200, suffix: "+", label: "Funded Benchmarks", icon: "📊", desc: "Successful pitch patterns" },
];

const agents = [
  {
    label: "Devil's Advocate", icon: "💀",
    color: "var(--purple)", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)",
    tip: "Attacks every assumption in your deck with brutal investor-grade questions.",
  },
  {
    label: "Market Validator", icon: "📊",
    color: "var(--amber)", bg: "rgba(255,184,0,0.08)", border: "rgba(255,184,0,0.2)",
    tip: "Cross-references your claims against real startup failure and success patterns.",
  },
  {
    label: "Improvement Agent", icon: "⚡",
    color: "var(--green)", bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.2)",
    tip: "Rewrites weak slides and generates an actionable improvement plan.",
  },
];

const faqs = [
  { q: "What file formats are supported?", a: "Currently PDF pitch decks only. We parse every slide into structured text for analysis." },
  { q: "How long does the analysis take?", a: "Typically under 2 minutes. Three AI agents run in parallel to stress-test your deck." },
  { q: "Is my pitch data stored or shared?", a: "No. Your deck is processed locally and never leaves the runtime. We don't store or share any uploaded files." },
  { q: "What AI models power the analysis?", a: "We use NVIDIA NIM endpoints via the Mastra agent framework, with specialized prompts trained on real startup post-mortem data." },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

/* ── page ── */
export default function HomePage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "var(--bg-void)" }}>
      <ParticleCanvas />

      {/* ── Ambient background layers ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute rounded-full"
          style={{ width: 900, height: 900, background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)", top: "-12%", left: "-8%", filter: "blur(90px)" }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute rounded-full"
          style={{ width: 700, height: 700, background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 65%)", top: "25%", left: "45%", filter: "blur(110px)" }}
          animate={{ scale: [1.08, 1, 1.08], x: [0, 40, 0], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute rounded-full"
          style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(255,51,102,0.05) 0%, transparent 65%)", bottom: "-8%", right: "-6%", filter: "blur(100px)" }}
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(0,212,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.015) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />
      </div>

      {/* ═══════════════  NAV  ═══════════════ */}
      <nav className="relative z-20 flex items-center justify-between px-8 lg:px-16 py-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>🔬</div>
          <span className="font-space font-bold text-lg gradient-text">PitchAutopsy</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
          {[
            { label: "How It Works", href: "#how-it-works" },
            { label: "Preview", href: "#preview" },
            { label: "FAQ", href: "#faq" },
            { label: "History", href: "/history", isRoute: true },
          ].map((link, i) => (
            <button key={i}
              onClick={() => link.isRoute ? router.push(link.href) : document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" })}
              className="nav-link font-space text-sm px-4 py-2 rounded-lg transition-all cursor-pointer"
              style={{ color: "rgba(226,232,240,0.5)" }}>
              {link.label}
            </button>
          ))}
          <div className="w-px h-4 mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex items-center gap-1.5 text-xs font-space" style={{ color: "rgba(226,232,240,0.35)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
            Online
          </div>
        </motion.div>
      </nav>

      {/* ═══════════════  HERO  ═══════════════ */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 lg:pt-28 pb-8">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-space tracking-wide mb-12"
          style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.12)", color: "var(--cyan)" }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--cyan)" }} />
          Multi-Agent AI Analysis System
        </motion.div>

        {/* Heading */}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-space font-bold leading-[0.88] mb-8"
          style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", letterSpacing: "-0.045em" }}>
          <span className="gradient-text">PITCH</span><br />
          <span style={{ color: "#e2e8f0" }}>AUTOPSY</span>
        </motion.h1>

        {/* Subtitle — one concise sentence */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.6 }}
          className="text-lg lg:text-xl max-w-xl mb-10"
          style={{ color: "rgba(226,232,240,0.5)", lineHeight: "1.75" }}>
          <span style={{ color: "rgba(226,232,240,0.92)" }}>Brutal, AI-powered stress-testing</span> for startup pitch decks — powered by 3 specialized agents.
        </motion.p>

        {/* Agent pills with tooltip */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mb-14">
          {agents.map((pill, i) => (
            <div key={i} className="relative"
              onMouseEnter={() => setHoveredAgent(i)} onMouseLeave={() => setHoveredAgent(null)}>
              <motion.span
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.48 + i * 0.07 }}
                className="agent-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-space cursor-default"
                style={{ background: pill.bg, border: `1px solid ${pill.border}`, color: pill.color }}>
                <span>{pill.icon}</span>{pill.label}
              </motion.span>
              <AnimatePresence>
                {hoveredAgent === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 p-3 rounded-xl text-xs text-left z-50"
                    style={{
                      background: "rgba(10,14,26,0.95)", backdropFilter: "blur(16px)",
                      border: `1px solid ${pill.border}`, color: "rgba(226,232,240,0.7)",
                    }}>
                    {pill.tip}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                      style={{ background: "rgba(10,14,26,0.95)", borderLeft: `1px solid ${pill.border}`, borderTop: `1px solid ${pill.border}` }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.8 }}
          className="w-full max-w-2xl">
          <UploadZone />
        </motion.div>
      </section>

      {/* ═══════════════  STATS  ═══════════════ */}
      <section className="relative z-10 px-6 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map((s, i) => (
            <motion.div key={i} variants={sectionReveal} initial="hidden" whileInView="visible"
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="stat-card">
              <div className="text-2xl mb-4">{s.icon}</div>
              <div className="font-space font-bold text-4xl gradient-text mb-1.5">
                <CountUp end={s.value} duration={2.5} delay={0.3} suffix={s.suffix} enableScrollSpy scrollSpyOnce />
              </div>
              <div className="font-space text-sm font-medium mb-0.5" style={{ color: "rgba(226,232,240,0.65)" }}>{s.label}</div>
              <div className="text-xs" style={{ color: "rgba(226,232,240,0.3)" }}>{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════  REPORT PREVIEW  ═══════════════ */}
      <section id="preview" className="relative z-10 px-6 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16">
            <div className="section-badge mb-5" style={{ "--badge-color": "var(--cyan)", "--badge-bg": "rgba(0,212,255,0.06)", "--badge-border": "rgba(0,212,255,0.15)" } as React.CSSProperties}>
              EXAMPLE OUTPUT
            </div>
            <h2 className="font-space font-bold text-3xl lg:text-4xl mb-4" style={{ color: "#e2e8f0", letterSpacing: "-0.02em" }}>
              See what you get
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "rgba(226,232,240,0.4)", lineHeight: 1.7 }}>
              A real report preview from our AI pipeline — scores, risks, questions, and slide-by-slide fixes.
            </p>
          </motion.div>

          {/* Mock Report Card */}
          <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="report-preview">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <div className="text-xs font-space tracking-wider mb-1" style={{ color: "rgba(226,232,240,0.35)" }}>PITCH HEALTH SCORE</div>
                <div className="font-space font-bold text-5xl gradient-text">62<span className="text-2xl">%</span></div>
              </div>
              <div className="text-right">
                <div className="text-xs font-space tracking-wider mb-1" style={{ color: "rgba(226,232,240,0.35)" }}>INVESTMENT POTENTIAL</div>
                <div className="font-space font-semibold text-xl" style={{ color: "var(--amber)" }}>Moderate Risk</div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Investor Questions */}
              <div className="report-preview-cell">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} style={{ color: "var(--purple)" }} />
                  <span className="font-space text-xs font-medium tracking-wider" style={{ color: "var(--purple)" }}>INVESTOR QUESTIONS</span>
                </div>
                {[
                  "How do you defend a $4.2B TAM with no bottom-up analysis?",
                  "What's your unit economics at current burn rate?",
                  "Why would enterprise customers switch from incumbents?",
                ].map((q, i) => (
                  <div key={i} className="flex gap-2 mb-3 text-sm" style={{ color: "rgba(226,232,240,0.55)" }}>
                    <span className="font-space text-xs mt-0.5" style={{ color: "var(--purple)", opacity: 0.5 }}>{i + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>

              {/* Critical Risks */}
              <div className="report-preview-cell">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} style={{ color: "var(--red)" }} />
                  <span className="font-space text-xs font-medium tracking-wider" style={{ color: "var(--red)" }}>CRITICAL RISKS</span>
                </div>
                {[
                  { risk: "TAM overestimation", match: "WeWork Case", score: "0.87" },
                  { risk: "No clear moat", match: "Quibi Case", score: "0.79" },
                  { risk: "Burn rate unsustainable", match: "Theranos Case", score: "0.83" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between mb-3 text-sm">
                    <span style={{ color: "rgba(226,232,240,0.55)" }}>{r.risk}</span>
                    <span className="font-space text-xs px-2 py-0.5 rounded-md"
                      style={{ background: "rgba(255,51,102,0.08)", color: "var(--red)", border: "1px solid rgba(255,51,102,0.15)" }}>
                      {r.score}
                    </span>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              <div className="report-preview-cell">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} style={{ color: "var(--green)" }} />
                  <span className="font-space text-xs font-medium tracking-wider" style={{ color: "var(--green)" }}>STRENGTHS</span>
                </div>
                {["Clear problem statement", "Strong founding team credentials", "Early traction with 3 LOIs"].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 mb-3 text-sm" style={{ color: "rgba(226,232,240,0.55)" }}>
                    <CheckCircle2 size={14} style={{ color: "var(--green)", opacity: 0.6 }} />
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              {/* Slide Improvements */}
              <div className="report-preview-cell">
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={16} style={{ color: "var(--cyan)" }} />
                  <span className="font-space text-xs font-medium tracking-wider" style={{ color: "var(--cyan)" }}>SLIDE FIXES</span>
                </div>
                {[
                  { slide: 3, fix: "Replace TAM with bottom-up calculation" },
                  { slide: 7, fix: "Add competitive moat defensibility diagram" },
                  { slide: 11, fix: "Show 18-month runway projection" },
                ].map((s, i) => (
                  <div key={i} className="flex gap-2 mb-3 text-sm" style={{ color: "rgba(226,232,240,0.55)" }}>
                    <span className="font-space text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(0,212,255,0.06)", color: "var(--cyan)", border: "1px solid rgba(0,212,255,0.1)", whiteSpace: "nowrap" }}>
                      S{s.slide}
                    </span>
                    <span>{s.fix}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════  DIVIDER  ═══════════════ */}
      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.12), transparent)" }} />
      </div>

      {/* ═══════════════  HOW IT WORKS  ═══════════════ */}
      <section id="how-it-works" className="relative z-10 px-6 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16">
            <div className="section-badge mb-5" style={{ "--badge-color": "var(--purple)", "--badge-bg": "rgba(139,92,246,0.06)", "--badge-border": "rgba(139,92,246,0.15)" } as React.CSSProperties}>
              THE PIPELINE
            </div>
            <h2 className="font-space font-bold text-3xl lg:text-4xl mb-4" style={{ color: "#e2e8f0", letterSpacing: "-0.02em" }}>
              Three agents. Zero mercy.
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: "rgba(226,232,240,0.4)", lineHeight: 1.7 }}>
              Your deck gets stress-tested by AI agents trained on real startup failures, investor patterns, and successful fundraises.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { step: "01", title: "Upload PDF", desc: "Drop your deck. The system extracts every slide into structured data for analysis.", icon: <Target size={28} />, color: "var(--cyan)", glow: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.15)" },
              { step: "02", title: "3-Agent Analysis", desc: "Devil's Advocate attacks assumptions. Market Validator checks claims. Improvement Agent rewrites weak slides.", icon: <Shield size={28} />, color: "var(--purple)", glow: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.15)" },
              { step: "03", title: "Autopsy Report", desc: "Get a health score, risk flags, investor questions, and slide-by-slide improvements.", icon: <Sparkles size={28} />, color: "var(--green)", glow: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.15)" },
            ].map((step, i) => (
              <motion.div key={i}
                variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="step-card" style={{ "--step-color": step.color, "--step-glow": step.glow, "--step-border": step.border } as React.CSSProperties}>
                <div className="font-space text-xs tracking-widest mb-5" style={{ color: step.color, opacity: 0.45 }}>STEP {step.step}</div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"
                  style={{ background: step.glow, border: `1px solid ${step.border}`, color: step.color }}>
                  {step.icon}
                </div>
                <h3 className="font-space font-semibold text-xl mb-3" style={{ color: "#e2e8f0" }}>{step.title}</h3>
                <p className="text-sm" style={{ color: "rgba(226,232,240,0.42)", lineHeight: 1.7 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════  TRUST  ═══════════════ */}
      <section className="relative z-10 px-6 py-16 lg:py-20">
        <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-space" style={{ color: "rgba(226,232,240,0.3)" }}>
            {[
              { icon: <BarChart3 size={15} />, text: "Trained on 1,000+ post-mortem datasets" },
              { icon: <Shield size={15} />, text: "NVIDIA NIM inference" },
              { icon: <Zap size={15} />, text: "Mastra agent orchestration" },
              { icon: <Target size={15} />, text: "Qdrant vector similarity" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ opacity: 0.5 }}>{t.icon}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════  DIVIDER  ═══════════════ */}
      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
      </div>

      {/* ═══════════════  FAQ  ═══════════════ */}
      <section id="faq" className="relative z-10 px-6 py-24 lg:py-32">
        <div className="max-w-2xl mx-auto">
          <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14">
            <div className="section-badge mb-5" style={{ "--badge-color": "var(--cyan)", "--badge-bg": "rgba(0,212,255,0.06)", "--badge-border": "rgba(0,212,255,0.12)" } as React.CSSProperties}>
              FAQ
            </div>
            <h2 className="font-space font-bold text-3xl lg:text-4xl" style={{ color: "#e2e8f0", letterSpacing: "-0.02em" }}>
              Common questions
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i}
                variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="faq-item w-full text-left flex items-center justify-between gap-4"
                >
                  <span className="font-space text-sm font-medium" style={{ color: "rgba(226,232,240,0.75)" }}>{faq.q}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown size={16} style={{ color: "rgba(226,232,240,0.3)" }} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden">
                      <div className="px-5 pb-5 text-sm" style={{ color: "rgba(226,232,240,0.45)", lineHeight: 1.7 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════  CTA  ═══════════════ */}
      <section className="relative z-10 px-6 py-24 lg:py-32">
        <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center">
          <h2 className="font-space font-bold text-3xl lg:text-4xl mb-5" style={{ color: "#e2e8f0", letterSpacing: "-0.02em" }}>
            Ready to stress-test your pitch?
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(226,232,240,0.4)", lineHeight: 1.7 }}>
            Upload your deck and get an AI-powered autopsy report in under 2 minutes. No signup required.
          </p>
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cta-button inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-space font-semibold text-base"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Zap size={18} />
            Analyze Your Pitch
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
              <ArrowRight size={16} />
            </motion.span>
          </motion.button>
        </motion.div>
      </section>

      {/* ═══════════════  FOOTER  ═══════════════ */}
      <footer className="relative z-10 px-6 pt-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)", marginBottom: "2.5rem" }} />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔬</span>
              <span className="font-space font-semibold text-sm gradient-text">PitchAutopsy</span>
            </div>
            <div className="flex items-center gap-6 text-xs font-space" style={{ color: "rgba(226,232,240,0.25)" }}>
              <button onClick={() => document.querySelector("#faq")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white/50 transition-colors cursor-pointer">FAQ</button>
              <button onClick={() => router.push("/history")} className="hover:text-white/50 transition-colors cursor-pointer">History</button>
              <span>Privacy</span>
              <span>API</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(226,232,240,0.2)" }}>
              Built with Mastra AI · Powered by NVIDIA NIM
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
