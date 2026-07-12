"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";

  return (
    <nav
      className={`navbar w-full flex items-center justify-center ${
        scrolled ? "navbar-scrolled" : ""
      }`}
    >
      <div className="page-shell py-5 md:py-6 flex items-center justify-between">
        {/* Logo */}
        <motion.button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 group"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span
            className="font-space font-bold text-sm tracking-wider uppercase"
            style={{ color: "var(--parchment)" }}
          >
            PITCH
            <span style={{ color: "var(--redline)" }}>AUTOPSY</span>
          </span>
        </motion.button>

        {/* Navigation */}
        <motion.div
          className="flex items-center gap-6 md:gap-8"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {isHome && (
            <>
              <button
                onClick={() =>
                  document
                    .getElementById("demo")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="nav-link text-xs font-space uppercase tracking-wider hidden md:block"
                style={{ color: "var(--ash)" }}
              >
                Demo
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("agents")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="nav-link text-xs font-space uppercase tracking-wider hidden md:block"
                style={{ color: "var(--ash)" }}
              >
                Agents
              </button>
            </>
          )}

          <button
            onClick={() => router.push(isHome ? "/history" : "/")}
            className="text-xs font-space px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              background: isHome
                ? "rgba(226,62,87,0.06)"
                : "rgba(255,255,255,0.04)",
              border: isHome
                ? "1px solid rgba(226,62,87,0.15)"
                : "1px solid rgba(255,255,255,0.08)",
              color: isHome ? "var(--redline)" : "var(--parchment)",
            }}
          >
            {isHome ? "History" : "← Back to Analysis"}
          </button>
        </motion.div>
      </div>
    </nav>
  );
}
