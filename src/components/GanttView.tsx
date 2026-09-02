"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { ChevronLeft, ChevronRight, GitCommit, Sparkles, ArrowRight } from "lucide-react";
import type { Task } from "@/types/task";
import { ganttRange, ganttRows, todayIndex, isWeekend, type GanttRow } from "@/lib/gantt";
import { parseLocalDate, isBeforeToday } from "@/lib/dates";
import { completion } from "@/lib/analytics";

interface GanttViewProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  userInitials?: string;
  /** Pe panoul general: mai puține rânduri, etichete de zi doar la începutul săptămânii. */
  compact?: boolean;
}

const COMPACT_ROWS = 6;

function barClasses(row: GanttRow): string {
  const t = row.task;
  if (t.status === "done") return "bg-white/10 border border-white/15 text-white/60 line-through";
  const overdue = t.deadline ? isBeforeToday(t.deadline) : false;
  const ring = overdue ? " ring-1 ring-red-500/70" : "";
  if (t.priority === "high") return "bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white shadow-lg shadow-orange-500/30" + ring;
  if (t.priority === "medium") return "bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-black shadow-lg shadow-orange-500/25" + ring;
  return "bg-gradient-to-r from-[#38bdf8]/80 to-[#0ea5e9]/80 text-white shadow-md" + ring;
}

function rowDateLabel(t: Task): string {
  if (t.deadline) return `Termen ${format(parseLocalDate(t.deadline), "d MMM", { locale: ro })}`;
  if (t.scheduled_date) return `Programat ${format(parseLocalDate(t.scheduled_date), "d MMM", { locale: ro })}`;
  return "";
}

export default function GanttView({ tasks, onEdit, userInitials = "TC", compact = false }: GanttViewProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const anchor = new Date();
  anchor.setDate(anchor.getDate() + weekOffset * 7);
  const range = ganttRange(anchor, 4);
  const rows = ganttRows(tasks, range);
  const shown = compact ? rows.slice(0, COMPACT_ROWS) : rows;
  const hidden = rows.length - shown.length;
  const tIdx = todayIndex(range);
  const n = range.days.length;
  const { pct, done, total } = completion(rows.map((r) => r.task));

  const rangeLabel = `${format(parseLocalDate(range.start), "d MMM", { locale: ro })} – ${format(
    parseLocalDate(range.end),
    "d MMM yyyy",
    { locale: ro }
  )}`;

  const trackCols = { display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` } as const;
  const leftW = compact ? "minmax(0,120px)" : "minmax(0,200px)";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12151e]/95 backdrop-blur-md overflow-hidden shadow-2xl">
      <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="font-display text-base font-bold text-white tracking-tight">Cronologie proiect</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 whitespace-nowrap">
            {rows.length} task-uri
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 p-1.5 text-[#94a3b8] hover:text-white transition-colors"
            aria-label="Săptămâna anterioară"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-[11px] font-mono text-[#cbd5e1] hover:text-white transition-colors whitespace-nowrap"
            title="Înapoi la săptămâna curentă"
          >
            {rangeLabel}
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            className="rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 p-1.5 text-[#94a3b8] hover:text-white transition-colors"
            aria-label="Săptămâna următoare"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className={`${compact ? "min-w-[420px]" : "min-w-[720px]"} p-4 sm:p-5`}>
          {/* Antet zile */}
          <div className="grid gap-2 pb-2 mb-3 border-b border-white/[0.06]" style={{ gridTemplateColumns: `${leftW} 1fr` }}>
            <div className="text-[11px] font-mono font-semibold text-[#94a3b8] self-end">Task / termen</div>
            <div style={trackCols} className="text-center font-mono text-[10px] text-[#64748b] relative">
              {range.days.map((d, i) => {
                const day = parseLocalDate(d);
                const isToday = i === tIdx;
                const monday = i % 7 === 0;
                const showLabel = !compact || monday || isToday;
                return (
                  <div key={d} className="flex flex-col items-center leading-tight">
                    {monday && (
                      <span className="text-[8px] uppercase text-[#64748b]/80 whitespace-nowrap">
                        {format(day, "MMM", { locale: ro })}
                      </span>
                    )}
                    <span
                      className={`px-0.5 rounded ${
                        isToday
                          ? "text-white bg-[#f97316] font-bold"
                          : isWeekend(d)
                          ? "text-[#64748b]/50"
                          : monday
                          ? "text-[#94a3b8] font-semibold"
                          : ""
                      } ${showLabel ? "" : "invisible"}`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rânduri */}
          {shown.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.06] rounded-xl">
              <Sparkles className="w-4 h-4 text-[#64748b] mb-1.5 opacity-50" />
              <p className="text-xs text-[#64748b] italic">Niciun task cu termen în acest interval</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {shown.map((row) => {
                const t = row.task;
                const span = row.endIdx - row.startIdx + 1;
                const showArrow = span >= (compact ? 5 : 3);
                return (
                  <div key={t.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: `${leftW} 1fr` }}>
                    <div className="flex items-center justify-between gap-2 min-w-0 pr-1">
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${t.status === "done" ? "text-[#64748b] line-through" : "text-white/90"}`} title={t.title}>
                          {t.title}
                        </p>
                        <span className="text-[10px] text-orange-400/90 font-mono">{rowDateLabel(t)}</span>
                      </div>
                      <div className="w-5 h-5 shrink-0 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white/10">
                        {userInitials}
                      </div>
                    </div>

                    <div className="relative h-9 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      {tIdx >= 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-orange-500/40 pointer-events-none"
                          style={{ left: `${((tIdx + 0.5) / n) * 100}%`, boxShadow: "0 0 8px rgba(249,115,22,0.4)" }}
                        />
                      )}
                      <div style={trackCols} className="absolute inset-0 items-center px-0.5">
                        {row.milestone ? (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            onClick={() => onEdit?.(t)}
                            style={{ gridColumn: `${row.startIdx + 1} / span ${Math.min(8, n - row.startIdx)}` }}
                            className="justify-self-start max-w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#272c3d] border border-white/20 text-white text-[11px] font-semibold shadow-lg cursor-pointer z-10 min-w-0"
                            title={t.title}
                          >
                            <GitCommit className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            <span className="truncate">{t.title}</span>
                          </motion.button>
                        ) : (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => onEdit?.(t)}
                            style={{ gridColumn: `${row.startIdx + 1} / ${row.endIdx + 2}` }}
                            className={`h-7 min-w-0 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-1 cursor-pointer ${barClasses(row)} ${
                              row.clippedStart ? "rounded-l-sm" : ""
                            } ${row.clippedEnd ? "rounded-r-sm" : ""}`}
                            title={`${t.title} · ${rowDateLabel(t)}`}
                          >
                            <span className="truncate">{t.title}</span>
                            {showArrow && !row.clippedEnd && <ArrowRight className="w-3 h-3 opacity-70 shrink-0" />}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {hidden > 0 && (
                <p className="text-[11px] text-[#64748b] font-mono pl-1">
                  + încă {hidden} în vederea &bdquo;Cronologie&rdquo;
                </p>
              )}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3 text-xs">
            <span className="font-mono text-[#94a3b8]">
              Progres interval: {pct}% ({done}/{total})
            </span>
            <div className="w-40 sm:w-48 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
