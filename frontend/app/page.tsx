"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadZone from "@/components/UploadZone";
import Navbar from "@/components/Navbar";
import {
  ChevronDown,
  AlertTriangle,
  Search,
  Crosshair,
  Wrench,
  ShieldCheck,
} from "lucide-react";

/* ── DATA ── */

interface Annotation {
  agent: string;
  icon: string;
  color: string;
  label: string;
  targetId: string;
  critique: string;
  caseMatch: string | null;
  remedy: string | null;
}

interface DemoSlide {
  id: number;
  label: string;
  title: string;
  tagline: string;
  boxes: { id: string; label: string; value: string; desc: string }[];
  annotations: Annotation[];
}

const DEMO_SLIDES: DemoSlide[] = [
  {
    id: 3,
    label: "Market Size",
    title: "Market TAM & SAM Scale",
    tagline:
      "We plan to capture 1% of a massive $100 Billion global industry.",
    boxes: [
      { id: "tam", label: "TAM", value: "$100B", desc: "Global food spending" },
      { id: "sam", label: "SAM", value: "$10B", desc: "Online food delivery" },
      { id: "som", label: "SOM", value: "$1B", desc: "10% share in Year 3" },
    ],
    annotations: [
      {
        agent: "Devil's Advocate",
        icon: "💀",
        color: "#E23E57",
        label: "Critical assumption flaw",
        targetId: "tam",
        critique:
          "Top-down market size calculation based on '1% capture' is a classic VC filter point. You fail to establish your bottoms-up GTM customer acquisition cost.",
        caseMatch:
          "WeWork Post-Mortem — arbitrary unit metrics & top-down TAM",
        remedy:
          "Replace the top-down TAM with a bottom-up formula based on target accounts multiplied by average contract value.",
      },
      {
        agent: "Market Validator",
        icon: "📊",
        color: "#D4A843",
        label: "Unvalidated metrics",
        targetId: "sam",
        critique:
          "A $10 Billion SAM represents a high-density competitive space. No competitor CAC or unit economics projections to defend how you scale here.",
        caseMatch:
          "Kozmo.com Case — scaling logistics without customer retention",
        remedy:
          "Provide a competitor matrix with active CAC ranges to show margins can hold.",
      },
      {
        agent: "Improvement Agent",
        icon: "⚡",
        color: "#34D399",
        label: "Alternative treatment",
        targetId: "som",
        critique:
          "Targeting a $1B SOM directly is too vague. Restructure this slide with a bottom-up formula.",
        caseMatch: null,
        remedy:
          "Compute SOM as: [Target companies in region] × [ACV]. Add a competitive moat defensibility matrix immediately after.",
      },
    ],
  },
  {
    id: 5,
    label: "Financials",
    title: "Revenue Projections",
    tagline:
      "Unparalleled growth trajectory based on rapid customer acquisition.",
    boxes: [
      {
        id: "y1",
        label: "Year 1 Revenue",
        value: "$2.4M",
        desc: "15% churn estimate",
      },
      {
        id: "y2",
        label: "Year 2 Revenue",
        value: "$18.5M",
        desc: "Zero churn assumption",
      },
      {
        id: "y3",
        label: "Year 3 Revenue",
        value: "$95.0M",
        desc: "150% expansion rate",
      },
    ],
    annotations: [
      {
        agent: "Devil's Advocate",
        icon: "💀",
        color: "#E23E57",
        label: "Unrealistic Projection",
        targetId: "y2",
        critique:
          "Assuming absolute zero churn in Year 2 while scaling from $2.4M to $18.5M is a statistical anomaly. VCs will discount this instantly.",
        caseMatch:
          "Quibi Post-Mortem — failure to model churn when free trials ended",
        remedy:
          "Apply a realistic churn scale (e.g. 5-8% annual) and show net revenue retention (NRR) instead.",
      },
      {
        agent: "Market Validator",
        icon: "📊",
        color: "#D4A843",
        label: "Unrealistic scaling",
        targetId: "y3",
        critique:
          "Scaling 5x in Year 3 with a 150% expansion rate requires massive upsell without market validation.",
        caseMatch: "Fast.co Case — burning cash to buy revenue growth",
        remedy:
          "Present a conservative scenario alongside the aggressive forecast.",
      },
    ],
  },
  {
    id: 8,
    label: "Competition",
    title: "Our Defensible Moat",
    tagline:
      "We maintain 100% feature superiority over legacy incumbents.",
    boxes: [
      {
        id: "moat1",
        label: "Incumbents",
        value: "Slow",
        desc: "Legacy codebases",
      },
      {
        id: "moat2",
        label: "Our Platform",
        value: "Instant",
        desc: "AI-native architecture",
      },
      {
        id: "moat3",
        label: "Defensibility",
        value: "Patent",
        desc: "Pending utility patent",
      },
    ],
    annotations: [
      {
        agent: "Market Validator",
        icon: "📊",
        color: "#D4A843",
        label: "Empty checkmark matrix",
        targetId: "moat1",
        critique:
          "Incumbents are labeled as slow without listing specific feature lists. This is a classic 'magical checkmark' pattern that raises skepticism.",
        caseMatch:
          "Juicero Case — product complexity failed to defend pricing",
        remedy:
          "Specify raw benchmarking speed metrics rather than abstract qualitative adjectives.",
      },
      {
        agent: "Improvement Agent",
        icon: "⚡",
        color: "#34D399",
        label: "Intellectual Property risk",
        targetId: "moat3",
        critique:
          "Patent pending claims hold zero legal weight until granted. Incumbents can duplicate your AI wrapper code in days.",
        caseMatch:
          "Theranos Case — proprietary tech claims without peer-reviewed audits",
        remedy:
          "Highlight proprietary data access or lock-in loops instead of software patents.",
      },
    ],
  },
];

const AGENTS = [
  {
    name: "Devil's Advocate",
    color: "#E23E57",
    icon: Crosshair,
    role: "Finds what's broken",
    description:
      "Hunts for the claims that will get you killed in a partner meeting. Stress-tests financial models, growth rates, and market size claims against real investor grilling patterns.",
    query: "VcGrillMatrix WHERE category='TAM'",
  },
  {
    name: "Market Validator",
    color: "#D4A843",
    icon: Search,
    role: "Measures against reality",
    description:
      "Cross-references every assumption against 1,000+ startup post-mortems and competitor structures. If your numbers don't hold up against history, you'll know exactly why.",
    query: "VECTOR_SEARCH('1% market penetration', threshold=0.78)",
  },
  {
    name: "Improvement Agent",
    color: "#34D399",
    icon: Wrench,
    role: "Fixes what's broken",
    description:
      "Provides specific rewrites: bottom-up calculations to replace hand-waved TAMs, competitive moat structures, and copy fixes that make each slide defensible.",
    query: "GENERATE_REWRITE(slide_context, failure_records)",
  },
];

const FAQS = [
  {
    q: "What file formats are supported?",
    a: "We support PDF pitch decks. All files are parsed in memory, checked against our localized vector collections, and deleted immediately after the analysis report compiles.",
  },
  {
    q: "How does the Enkrypt AI Safety Gate work?",
    a: "It sits as a mandatory guardrail between agent processing and your dashboard. If an agent produces overly toxic criticism or inaccurate suggestions, Enkrypt's Toxicity Guard filters the content, triggering a semantic calibration retry loop.",
  },
  {
    q: "What models are running behind the agents?",
    a: "We build on the Mastra AI orchestrator framework, connecting to NVIDIA NIM endpoints including Llama-3-70B and specialized embedders trained directly on startup failure datasets.",
  },
  {
    q: "Are my business details safe?",
    a: "100%. We operate local, sandboxed API endpoints, and we never train our models or store vector documents of user-uploaded materials. Your intellectual property is protected.",
  },
];

/* ── COMPONENT ── */

export default function HomePage() {
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [activeAnnotationIdx, setActiveAnnotationIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentSlide = DEMO_SLIDES[activeSlideIdx];
  const activeAnnotation =
    currentSlide.annotations[activeAnnotationIdx] ||
    currentSlide.annotations[0];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main
      className="min-h-screen overflow-x-hidden relative flex flex-col items-center w-full"
      style={{
        background: "var(--void)",
        color: "var(--parchment)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute bg-ambient-glow"
          style={{
            left: cursor.x - 350,
            top: cursor.y - 350,
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(226,62,87,0.03) 0%, transparent 65%)",
            transition: "left 0.15s ease-out, top 0.15s ease-out",
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: "100px 100px",
        }}
      />

      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ── SECTION 1: HERO + UPLOAD ── */}
      <section className="relative z-10 w-full pt-28 md:pt-32 pb-36 md:pb-40 flex flex-col items-center">
        <div className="page-shell text-center flex flex-col items-center w-full">
          {/* Headline */}
          <motion.h1
            className="font-display leading-[1.05] mb-8 tracking-tight max-w-[900px] mx-auto"
            style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Your pitch deck has{" "}
            <span style={{ color: "var(--redline)" }}>
              problems you can&apos;t see.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base max-w-xl mx-auto mb-16 md:mb-20 leading-relaxed"
            style={{ color: "var(--ash)" }}
          >
            Stop collecting polite lies. Stress-test your assumptions against
            1,000+ historical startup failures in under 2 minutes.
          </motion.p>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl w-full relative"
          >
            <UploadZone />
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mt-14 text-xs font-space"
            style={{ color: "var(--ash)" }}
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" /> Privacy
              protected
            </span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)" }}
            />
            <span>No LLM training on your data</span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)" }}
            />
            <span>Full audit log history</span>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: INTERACTIVE AUTOPSY DEMO ── */}
      <section
        id="demo"
        className="relative z-10 w-full section-band flex flex-col items-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="page-shell w-full flex flex-col items-stretch">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 flex flex-col items-center">
            <h2 className="font-display text-4xl lg:text-5xl mb-5 leading-tight">
              See what an autopsy looks like.
            </h2>
            <p
              className="text-sm max-w-lg mx-auto leading-relaxed"
              style={{ color: "var(--ash)" }}
            >
              Click the boxed items below to see how our agents red-line common
              failure structures in real pitch slides.
            </p>

            {/* Slide tab selector */}
            <div className="flex gap-3 mt-10">
              {DEMO_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => {
                    setActiveSlideIdx(idx);
                    setActiveAnnotationIdx(0);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-space transition-all duration-200"
                  style={{
                    background:
                      activeSlideIdx === idx
                        ? "rgba(226,62,87,0.08)"
                        : "transparent",
                    border:
                      activeSlideIdx === idx
                        ? "1px solid rgba(226,62,87,0.2)"
                        : "1px solid transparent",
                    color:
                      activeSlideIdx === idx
                        ? "var(--redline)"
                        : "var(--ash)",
                  }}
                >
                  {slide.label}
                </button>
              ))}
            </div>
          </div>

          {/* Demo grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-stretch w-full">
            {/* Specimen card — the mock slide */}
            <div
              className="lg:col-span-7 flex flex-col rounded-2xl overflow-hidden relative w-full corner-marks"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Slide header strip */}
              <div
                className="flex items-center justify-between px-6 py-3"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span
                  className="text-[10px] font-space uppercase tracking-widest"
                  style={{ color: "var(--ash)" }}
                >
                  Specimen · Slide {currentSlide.id}
                </span>
                <span
                  className="text-[10px] font-space"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  seed-deck-v3.pdf
                </span>
              </div>

              {/* Slide body */}
              <div
                className="p-10 flex-1 flex flex-col justify-between relative min-h-[400px]"
                style={{ background: "#FAF8F5" }}
              >
                {/* Scanline */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-red-400/15 to-transparent absolute top-0 scanner-laser" />
                </div>

                {/* Header */}
                <div>
                  <span
                    className="text-[10px] font-space font-bold uppercase tracking-wider block mb-1"
                    style={{ color: "#9CA3AF" }}
                  >
                    Draft Section {currentSlide.id}
                  </span>
                  <h3
                    className="font-space font-extrabold text-2xl lg:text-3xl"
                    style={{ color: "#1F2937" }}
                  >
                    {currentSlide.title}
                  </h3>
                  <p
                    className="text-sm italic mt-1 max-w-md"
                    style={{ color: "#9CA3AF" }}
                  >
                    &ldquo;{currentSlide.tagline}&rdquo;
                  </p>
                </div>

                {/* Box grid */}
                <div className="grid grid-cols-3 gap-5 my-8">
                  {currentSlide.boxes.map((box) => {
                    const corrIdx = currentSlide.annotations.findIndex(
                      (a) => a.targetId === box.id
                    );
                    const isAnnotated = corrIdx !== -1;
                    const isActive =
                      isAnnotated && activeAnnotationIdx === corrIdx;
                    const aColor = isAnnotated
                      ? currentSlide.annotations[corrIdx].color
                      : "";

                    return (
                      <div
                        key={box.id}
                        onClick={() =>
                          isAnnotated && setActiveAnnotationIdx(corrIdx)
                        }
                        className={`p-4 rounded-xl relative transition-all duration-200 select-none ${
                          isAnnotated ? "cursor-pointer" : "cursor-default"
                        }`}
                        style={{
                          background: "#ffffff",
                          border: isActive
                            ? `2px solid ${aColor}`
                            : "1px solid #E5E7EB",
                          boxShadow: isActive
                            ? `0 8px 20px ${aColor}15`
                            : "0 1px 4px rgba(0,0,0,0.03)",
                        }}
                      >
                        <span
                          className="text-[10px] font-space font-bold uppercase tracking-wide block mb-0.5"
                          style={{ color: "#9CA3AF" }}
                        >
                          {box.label}
                        </span>
                        <span
                          className="text-xl font-space font-extrabold block"
                          style={{ color: "#1F2937" }}
                        >
                          {box.value}
                        </span>
                        <span
                          className="text-xs mt-1 block"
                          style={{ color: "#9CA3AF" }}
                        >
                          {box.desc}
                        </span>

                        {/* Annotation dot */}
                        {isAnnotated && (
                          <div
                            className="annotation-dot absolute -top-1.5 -right-1.5"
                            style={{ background: aColor }}
                          />
                        )}

                        {/* Strike-through on active */}
                        {isActive && (
                          <motion.div
                            className="pen-strike"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            style={{ background: aColor }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <span
                    className="text-[9px] font-space tracking-wider"
                    style={{ color: "#D1D5DB" }}
                  >
                    © 2026 INTERNAL USE ONLY
                  </span>
                  <span
                    className="text-[9px] font-space tracking-wider"
                    style={{ color: "#D1D5DB" }}
                  >
                    SOURCE: SYSTEM ESTIMATES
                  </span>
                </div>
              </div>
            </div>

            {/* Critique panel */}
            <div
              className="lg:col-span-5 flex flex-col justify-between rounded-2xl p-7 relative w-full"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeSlideIdx}-${activeAnnotationIdx}`}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {/* Agent header */}
                  <div
                    className="flex items-center justify-between pb-4"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">
                        {activeAnnotation.icon}
                      </span>
                      <div>
                        <h4 className="font-space font-bold text-sm text-white">
                          {activeAnnotation.agent}
                        </h4>
                        <p
                          className="text-[10px] font-space tracking-wide"
                          style={{ color: "var(--ash)" }}
                        >
                          ANALYSIS REPORT
                        </p>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-space px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold"
                      style={{
                        background: `${activeAnnotation.color}12`,
                        color: activeAnnotation.color,
                        border: `1px solid ${activeAnnotation.color}30`,
                      }}
                    >
                      {activeAnnotation.label}
                    </span>
                  </div>

                  {/* Observation */}
                  <div>
                    <h5
                      className="text-[10px] font-space uppercase tracking-wider mb-2 font-bold"
                      style={{ color: "var(--ash)" }}
                    >
                      Observation
                    </h5>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "rgba(232,228,220,0.75)" }}
                    >
                      {activeAnnotation.critique}
                    </p>
                  </div>

                  {/* Case match */}
                  {activeAnnotation.caseMatch && (
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: "rgba(226,62,87,0.04)",
                        border: "1px solid rgba(226,62,87,0.1)",
                      }}
                    >
                      <h5
                        className="text-[10px] font-space uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1"
                        style={{ color: "var(--redline)" }}
                      >
                        <AlertTriangle size={11} /> Failure Database Match
                      </h5>
                      <p
                        className="text-xs leading-normal"
                        style={{ color: "var(--ash)" }}
                      >
                        {activeAnnotation.caseMatch}
                      </p>
                    </div>
                  )}

                  {/* Remedy */}
                  {activeAnnotation.remedy && (
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: "rgba(52,211,153,0.04)",
                        border: "1px solid rgba(52,211,153,0.1)",
                      }}
                    >
                      <h5
                        className="text-[10px] font-space uppercase tracking-wider mb-1.5 font-bold"
                        style={{ color: "var(--remedy)" }}
                      >
                        Recommended Rewrite
                      </h5>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "rgba(232,228,220,0.65)" }}
                      >
                        {activeAnnotation.remedy}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Dot indicators */}
              <div
                className="flex gap-2 justify-center pt-6 mt-4 w-full"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                {currentSlide.annotations.map((a, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveAnnotationIdx(idx)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: activeAnnotationIdx === idx ? 20 : 7,
                      height: 7,
                      background:
                        activeAnnotationIdx === idx
                          ? a.color
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: THE THREE AGENTS ── */}
      <section
        id="agents"
        className="relative z-10 w-full section-band flex flex-col items-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="page-shell w-full flex flex-col items-center">
          <div className="text-center max-w-xl mx-auto mb-16 md:mb-20 flex flex-col items-center">
            <h2 className="font-display text-3xl lg:text-4xl mb-5">
              Three perspectives. One verdict.
            </h2>
            <p
              className="text-sm max-w-md mx-auto leading-relaxed"
              style={{ color: "var(--ash)" }}
            >
              Each agent dissects your deck from a distinct angle, then compiles
              a unified risk report.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col p-8 md:p-9 rounded-2xl"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-6"
                    style={{
                      background: `${agent.color}10`,
                      border: `1px solid ${agent.color}20`,
                    }}
                  >
                    <Icon size={18} style={{ color: agent.color }} />
                  </div>

                  {/* Name + role */}
                  <h3 className="font-space font-bold text-base text-white mb-1">
                    {agent.name}
                  </h3>
                  <p
                    className="text-xs font-space mb-4"
                    style={{ color: agent.color }}
                  >
                    {agent.role}
                  </p>

                  {/* Description */}
                  <p
                    className="text-xs leading-relaxed mb-6 flex-1"
                    style={{ color: "var(--ash)" }}
                  >
                    {agent.description}
                  </p>

                  {/* Query snippet */}
                  <div
                    className="font-mono text-[10px] px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      color: "rgba(255,255,255,0.35)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span style={{ color: agent.color, opacity: 0.7 }}>
                      $
                    </span>{" "}
                    {agent.query}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: FAQ + FOOTER ── */}
      <section
        className="relative z-10 w-full section-band flex flex-col items-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="page-shell max-w-[900px] w-full flex flex-col items-center">
          <h2 className="font-display text-3xl mb-12 text-center text-white">
            Questions
          </h2>

          <div className="space-y-4 w-full">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden transition-all duration-200 w-full"
                style={{
                  background:
                    openFaq === i
                      ? "rgba(255,255,255,0.02)"
                      : "transparent",
                  border:
                    openFaq === i
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold pr-4 text-white">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                    style={{ color: "var(--ash)" }}
                  >
                    <ChevronDown size={15} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p
                        className="px-6 pb-5 text-xs leading-relaxed"
                        style={{ color: "var(--ash)" }}
                      >
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

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 w-full py-12 flex flex-col items-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="page-shell w-full flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-space font-bold text-xs tracking-wider uppercase">
            PITCH
            <span style={{ color: "var(--redline)" }}>AUTOPSY</span>
          </span>
          <p
            className="text-[10px] font-space"
            style={{ color: "var(--ash)" }}
          >
            Built with Mastra AI · Powered by NVIDIA NIM · Enkrypt AI Guarded
          </p>
        </div>
      </footer>
    </main>
  );
}
