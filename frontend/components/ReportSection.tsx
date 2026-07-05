"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ReportSectionProps {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  delay?: number;
}

export default function ReportSection({
  title, icon, accent, children, defaultOpen = true, delay = 0,
}: ReportSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card overflow-hidden"
      style={{ borderColor: `${accent}20` }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-7 text-left group"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}
          >
            {icon}
          </div>
          <h2 className="font-space font-bold text-lg" style={{ color: "#e2e8f0" }}>
            {title}
          </h2>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ color: accent }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <div
              className="px-7 pb-7"
              style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}
            >
              <div className="pt-5">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
