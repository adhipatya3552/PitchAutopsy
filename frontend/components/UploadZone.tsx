"use client";
import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Zap, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { runId } = await res.json();
      router.push(`/analyze/${runId}`);
    } catch (e) {
      setError("Something went wrong. Make sure the Mastra backend is running.");
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop Zone */}
      <motion.div
        className={`upload-zone-premium ${isDragOver ? "drag-active" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        animate={isDragOver ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Animated gradient border */}
        <div className="upload-zone-border" />

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center gap-5 py-4"
              >
                {/* Floating upload icon */}
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(0,212,255,0.08)",
                    border: "1px solid rgba(0,212,255,0.2)",
                  }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Upload size={28} style={{ color: "var(--cyan)" }} />
                </motion.div>
                <div className="text-center">
                  <p className="text-lg font-semibold font-space mb-1.5" style={{ color: "#e2e8f0" }}>
                    Drop your pitch deck here
                  </p>
                  <p className="text-sm" style={{ color: "rgba(226,232,240,0.4)" }}>
                    or click to browse — <span style={{ color: "var(--cyan)", opacity: 0.8 }}>PDF only</span>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-2"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)" }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <FileText size={28} style={{ color: "var(--green)" }} />
                </motion.div>
                <div className="text-center">
                  <p className="text-base font-semibold font-space" style={{ color: "var(--green)" }}>
                    {file.name}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "rgba(226,232,240,0.4)" }}>
                    {(file.size / 1024).toFixed(1)} KB — Ready for autopsy
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all hover:bg-red-500/10"
                  style={{ background: "rgba(255,51,102,0.08)", color: "var(--red)", border: "1px solid rgba(255,51,102,0.2)" }}
                >
                  <X size={12} /> Remove
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm mt-4"
            style={{ color: "var(--red)" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="mt-5"
          >
            <motion.button
              onClick={onSubmit}
              disabled={isUploading}
              className="cta-button w-full py-4 rounded-2xl font-space font-semibold text-base flex items-center justify-center gap-3"
              style={{
                cursor: isUploading ? "not-allowed" : "pointer",
                opacity: isUploading ? 0.7 : 1,
              }}
              whileHover={!isUploading ? { scale: 1.02 } : {}}
              whileTap={!isUploading ? { scale: 0.98 } : {}}
            >
              {isUploading ? (
                <>
                  <motion.div
                    className="w-5 h-5 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "var(--cyan)", borderTopColor: "transparent" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Initiating Analysis...</span>
                </>
              ) : (
                <>
                  <Zap size={20} />
                  <span>Run Autopsy</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
