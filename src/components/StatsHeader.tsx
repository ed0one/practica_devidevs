"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Task } from "@/types/task";
import { MoreHorizontal, TrendingUp, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import { velocitySeries, axisTicks, priorityBars, completion, overdueCount } from "@/lib/analytics";

interface StatsHeaderProps {
  tasks: Task[];
  /** Pe panoul general widgeturile stau pe coloană (dreapta), altfel pe rând. */
  layout?: "row" | "column";
}

// Butonul „⋯" din colțul fiecărui widget deschide un mic panou cu cifrele
// din spatele graficului — nu e decorativ.
function WidgetDetails({ lines }: { lines: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Detalii"
        className="text-[#64748b] hover:text-white transition-colors p-1 -mr-1 rounded-md"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 mt-1 w-48 rounded-xl bg-[#161a26] border border-white/10 shadow-2xl p-2.5 z-20 space-y-1">
            {lines.map((l) => (
              <p key={l} className="text-[11px] text-[#cbd5e1] font-mono leading-snug">
                {l}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const cardBase =
  "rounded-2xl bg-[#141721]/90 border border-white/[0.07] backdrop-blur-md shadow-xl flex flex-col justify-between hover:border-white/15 transition-all group min-w-0";

export default function StatsHeader({ tasks, layout = "row" }: StatsHeaderProps) {
  const column = layout === "column";
  const cardCls = `${cardBase} ${column ? "p-3" : "p-4"}`;
  const titles = column
    ? { velocity: "Viteză", completion: "Finalizate", bars: "Priorități" }
    : { velocity: "Viteză sprint", completion: "Task-uri finalizate", bars: "Blocate & priorități" };
  const now = new Date();
  const series = velocitySeries(tasks, now, 7);
  const weekDone = series.reduce((s, p) => s + p.count, 0);
  const vTicks = axisTicks(Math.max(...series.map((p) => p.count)));
  const vMax = vTicks[0];

  const width = 160;
  const height = 65;
  const points = series.map((p, idx) => {
    const x = (idx / (series.length - 1)) * (width - 16) + 8;
    const y = height - (p.count / vMax) * (height - 18) - 9;
    return { x, y, count: p.count };
  });
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cx = prev.x + (pt.x - prev.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const { done, total, pct } = completion(tasks);
  const pending = total - done;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const bars = priorityBars(tasks);
  const overdue = overdueCount(tasks, now);
  const bTicks = axisTicks(Math.max(...bars.map((b) => b.count)));
  const bMax = bTicks[0];
  const barColor: Record<string, string> = {
    high: "bg-[#f97316]",
    medium: "bg-[#f59e0b]",
    low: "bg-[#38bdf8]",
    blocked: "bg-[#ef4444]",
  };

  // În coloana din dreapta (panou) cele trei widgeturi stau pe un rând, ca în mockup.
  const gridCls =
    layout === "column"
      ? "grid grid-cols-1 sm:grid-cols-3 gap-3 select-none"
      : "grid grid-cols-1 md:grid-cols-3 gap-3.5 select-none";

  return (
    <div className={gridCls}>
      {/* Viteză sprint: task-uri finalizate pe zi, ultimele 7 zile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cardCls}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-[#f8fafc] tracking-tight truncate">{titles.velocity}</span>
            {!column && <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />}
          </div>
          <WidgetDetails
            lines={[
              `${weekDone} finalizate în 7 zile`,
              ...series.map((p) => `${p.date.slice(5)}: ${p.count}`),
            ]}
          />
        </div>

        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="flex flex-col justify-between h-14 text-[9px] font-mono text-[#64748b]">
            {vTicks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="flex-1 relative flex flex-col items-center">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible" role="img" aria-label={`Task-uri finalizate pe zi: ${series.map((p) => p.count).join(", ")}`}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path d={areaD} fill="url(#velocityGradient)" />
              <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
              {points.map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="3.5" className="fill-[#fbbf24] stroke-[#141721] stroke-2 transition-transform group-hover:scale-125">
                  <title>{`${series[i].date}: ${pt.count}`}</title>
                </circle>
              ))}
            </svg>
            <div className="w-full flex justify-between px-1.5 pt-1 text-[9px] font-mono text-[#64748b]">
              {series.map((p) => (
                <span key={p.date}>{p.label}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Task-uri finalizate: procent real */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }} className={cardCls}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-[#f8fafc] tracking-tight truncate">{titles.completion}</span>
            {!column && <CheckCircle2 className="w-3.5 h-3.5 text-[#f97316] shrink-0" />}
          </div>
          <WidgetDetails lines={[`${done} finalizate`, `${pending} active`, `${total} în total`]} />
        </div>

        <div className="flex items-center justify-center py-1">
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" role="img" aria-label={`${pct}% finalizate`}>
              <circle cx="48" cy="48" r={radius} className="stroke-[#222736]" strokeWidth="7" fill="transparent" />
              <motion.circle
                cx="48"
                cy="48"
                r={radius}
                stroke="url(#donutGradient)"
                strokeWidth="7"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
                fill="transparent"
              />
              <defs>
                <linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-extrabold text-2xl text-white tracking-tight">{pct}%</span>
              <span className="text-[9px] font-mono text-[#94a3b8] uppercase">
                {done}/{total}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Blocate & priorități: task-uri active pe prioritate + coloana blocată */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }} className={cardCls}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-[#f8fafc] tracking-tight truncate">{titles.bars}</span>
            {!column && <ShieldAlert className="w-3.5 h-3.5 text-[#ef4444] shrink-0" />}
          </div>
          <WidgetDetails lines={[...bars.map((b) => `${b.label}: ${b.count}`), `Restante: ${overdue}`]} />
        </div>

        <div className="flex items-end justify-between gap-3 pt-1">
          <div className="flex flex-col justify-between h-14 text-[9px] font-mono text-[#64748b]">
            {bTicks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="flex-1 flex items-end justify-around gap-2 h-16 pb-1">
            {bars.map((bar, i) => {
              const heightPercent = (bar.count / bMax) * 100;
              return (
                <div key={bar.key} className="flex flex-col items-center gap-1.5 flex-1 group/bar" title={`${bar.label}: ${bar.count}`}>
                  <div className="w-full flex items-end justify-center h-12">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPercent, bar.count > 0 ? 8 : 2)}%` }}
                      transition={{ duration: 0.8, delay: 0.15 + i * 0.08 }}
                      className={`w-3 sm:w-4 rounded-t-md ${barColor[bar.key]} shadow-lg shadow-orange-500/10 group-hover/bar:brightness-125 transition-all`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-[#64748b] truncate">{bar.label.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </div>
        {overdue > 0 && (
          <p className="mt-1 text-[10px] font-mono text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {overdue} restante
          </p>
        )}
      </motion.div>
    </div>
  );
}
