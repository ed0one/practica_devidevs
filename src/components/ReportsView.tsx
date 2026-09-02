"use client";

import { motion } from "framer-motion";
import { Download, CheckCircle2, Clock, AlertTriangle, CalendarClock, CalendarCheck, Layers, Tag, Flag } from "lucide-react";
import type { Task } from "@/types/task";
import { computeStats } from "@/lib/stats";
import { priorityBars } from "@/lib/analytics";

interface ReportsViewProps {
  tasks: Task[];
  onExportCSV: () => void;
}

export default function ReportsView({ tasks, onExportCSV }: ReportsViewProps) {
  const s = computeStats(tasks);
  const tiles = [
    { icon: Layers, label: "Total", value: s.total, cls: "text-white" },
    { icon: Clock, label: "Active", value: s.byStatus.pending, cls: "text-orange-400" },
    { icon: CheckCircle2, label: "Finalizate", value: s.byStatus.done, cls: "text-emerald-400" },
    { icon: AlertTriangle, label: "Restante", value: s.overdue, cls: "text-red-400" },
    { icon: CalendarClock, label: "Scadente în 7 zile", value: s.dueNext7Days, cls: "text-amber-400" },
    { icon: CalendarCheck, label: "Programate", value: s.scheduled, cls: "text-sky-400" },
  ];

  const categories = Object.entries(s.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const catMax = Math.max(1, ...categories.map(([, c]) => c));
  const doneByCategory = (cat: string) => tasks.filter((t) => t.category === cat && t.status === "done").length;

  const bars = priorityBars(tasks);
  const prioMax = Math.max(1, ...bars.map((b) => b.count));
  const prioColor: Record<string, string> = {
    high: "from-[#f97316] to-[#ea580c]",
    medium: "from-[#f59e0b] to-[#f97316]",
    low: "from-[#38bdf8] to-[#0ea5e9]",
    blocked: "from-[#ef4444] to-[#f43f5e]",
  };

  const card = "rounded-2xl bg-[#141721]/90 border border-white/[0.07] p-5 backdrop-blur-md shadow-xl";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-base font-bold text-white tracking-tight">Rapoarte</h3>
          <p className="text-xs text-[#94a3b8]">Cifre calculate pe toate task-urile tale, în timp real.</p>
        </div>
        <button
          type="button"
          onClick={onExportCSV}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Exportă CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl bg-[#141721]/90 border border-white/[0.07] p-4 backdrop-blur-md shadow-xl"
          >
            <div className="flex items-center gap-2 text-[#94a3b8]">
              <t.icon className={`w-3.5 h-3.5 ${t.cls}`} />
              <span className="text-[11px] font-medium truncate">{t.label}</span>
            </div>
            <p className={`mt-2 font-display text-2xl font-extrabold tracking-tight ${t.cls}`}>{t.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={card}>
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-orange-400" /> Pe categorii
          </h4>
          {categories.length === 0 ? (
            <p className="text-xs text-[#64748b] italic">Nicio categorie încă. Adaugă task-uri cu categorie ca să vezi distribuția.</p>
          ) : (
            <div className="space-y-3">
              {categories.map(([cat, count]) => {
                const done = doneByCategory(cat);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#cbd5e1] font-medium truncate">{cat}</span>
                      <span className="font-mono text-[#94a3b8]">
                        {done}/{count}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 bg-orange-500/30 rounded-full" style={{ width: `${(count / catMax) * 100}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#f59e0b] to-[#f97316] rounded-full" style={{ width: `${(done / catMax) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={card}>
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Flag className="w-4 h-4 text-orange-400" /> Active pe prioritate
          </h4>
          <div className="space-y-3">
            {bars.map((b) => (
              <div key={b.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#cbd5e1] font-medium">{b.label}</span>
                  <span className="font-mono text-[#94a3b8]">{b.count}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.count / prioMax) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full bg-gradient-to-r ${prioColor[b.key]}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-[#64748b]">
            Rata de finalizare: <span className="font-mono text-white">{Math.round(s.completionRate * 100)}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}
