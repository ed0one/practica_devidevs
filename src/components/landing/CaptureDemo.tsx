"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// The signature moment: raw Romanian thought (warm) resolves into
// structured task chips (cool). This IS the product, shown not told.

const SENTENCE =
  "Sun la doctor mâine, trimit raportul până vineri și cumpăr pâine diseară";

type Chip = {
  title: string;
  when: string;
  cat: string;
  priority: "high" | "medium" | "low";
};

const CHIPS: Chip[] = [
  { title: "Sună la doctor", when: "mâine · 09:00", cat: "Sănătate", priority: "high" },
  { title: "Trimite raportul", when: "vineri", cat: "Muncă", priority: "high" },
  { title: "Cumpără pâine", when: "diseară", cat: "Personal", priority: "low" },
];

const DOT: Record<Chip["priority"], string> = {
  high: "var(--persimmon)",
  medium: "#f5b544",
  low: "var(--mint)",
};

const PRIO_LABEL: Record<Chip["priority"], string> = {
  high: "urgent",
  medium: "mediu",
  low: "relaxat",
};

export default function CaptureDemo() {
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "parsing" | "done">("typing");

  useEffect(() => {
    if (reduce) {
      // Defer out of the synchronous effect body (no typewriter when reduced).
      const t = setTimeout(() => {
        setTyped(SENTENCE);
        setPhase("done");
      }, 0);
      return () => clearTimeout(t);
    }
    let raf: ReturnType<typeof setTimeout>;
    let i = 0;

    const type = () => {
      if (i <= SENTENCE.length) {
        setTyped(SENTENCE.slice(0, i));
        i += 1;
        // Slight human jitter on the keystroke cadence.
        raf = setTimeout(type, 34 + Math.random() * 46);
      } else {
        setPhase("parsing");
        raf = setTimeout(() => setPhase("done"), 780);
      }
    };
    // Restart the whole loop after the result has been held.
    const loop = setTimeout(type, 500);

    return () => {
      clearTimeout(raf);
      clearTimeout(loop);
    };
  }, [reduce]);

  // After showing results for a while, restart (skip when reduced motion).
  useEffect(() => {
    if (phase !== "done" || reduce) return;
    const t = setTimeout(() => {
      setTyped("");
      setPhase("typing");
      let i = 0;
      const type = () => {
        if (i <= SENTENCE.length) {
          setTyped(SENTENCE.slice(0, i));
          i += 1;
          setTimeout(type, 34 + Math.random() * 46);
        } else {
          setPhase("parsing");
          setTimeout(() => setPhase("done"), 780);
        }
      };
      setTimeout(type, 400);
    }, 4200);
    return () => clearTimeout(t);
  }, [phase, reduce]);

  return (
    <div className="relative w-full rounded-3xl border border-white/10 bg-[var(--ink-2)]/80 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
      {/* window chrome */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-white/10" />
        <span className="h-3 w-3 rounded-full bg-white/10" />
        <span className="h-3 w-3 rounded-full bg-white/10" />
        <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--haze)]">
          captură
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-[var(--haze)]">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: phase === "done" ? "var(--mint)" : "var(--persimmon)",
              boxShadow: `0 0 8px ${phase === "done" ? "var(--mint)" : "var(--persimmon)"}`,
            }}
          />
          {phase === "typing" ? "ascult" : phase === "parsing" ? "procesez" : "gata"}
        </span>
      </div>

      {/* capture bar (raw thought — warm) */}
      <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-5">
        <p className="min-h-[3.5rem] text-[15px] leading-relaxed text-white/90 sm:text-base">
          <span className="text-[var(--persimmon-soft)]">›</span>{" "}
          {typed}
          {phase === "typing" && (
            <span className="capture-caret ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-[var(--persimmon)]" />
          )}
        </p>
      </div>

      {/* the parse (structured tasks — cool) */}
      <div className="min-h-[172px] px-3 py-4">
        <div className="mb-3 flex items-center gap-2 px-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--haze)]">
          <div className="h-px flex-1 bg-white/5" />
          {phase === "done" ? "3 task-uri extrase" : "—"}
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {phase === "done" &&
              CHIPS.map((c, idx) => (
                <motion.div
                  key={c.title}
                  initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: DOT[c.priority], boxShadow: `0 0 10px ${DOT[c.priority]}66` }}
                  />
                  <span className="flex-1 truncate text-sm font-medium text-white/90">
                    {c.title}
                  </span>
                  <span className="hidden shrink-0 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-[var(--haze)] sm:inline">
                    {c.cat}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-[var(--mint)]">
                    {c.when}
                  </span>
                  <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider text-white/25 md:inline">
                    {PRIO_LABEL[c.priority]}
                  </span>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
