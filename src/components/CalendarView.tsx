"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { addDays, format, isSameDay, isToday, isBefore, startOfDay, startOfWeek } from "date-fns";
import { ro } from "date-fns/locale";
import type { Task, Status } from "@/types/task";
import TaskCard from "./TaskCard";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sun } from "lucide-react";
import { useTimeFormat, formatClock, formatHourLabel } from "@/lib/time-format";
import { parseLocalDate } from "@/lib/dates";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_H = 54;
const DEFAULT_BLOCK_MIN = 60;

function minutesOf(local: string): number {
  const h = parseInt(local.substring(11, 13), 10);
  const m = parseInt(local.substring(14, 16), 10);
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

interface DayBlock {
  task: Task;
  start: number;
  end: number;
  col: number;
  cols: number;
}

// Blocurile care se suprapun se împart în coloane alăturate (ca în Google Calendar).
export function layoutDayBlocks(items: { task: Task; start: number; end: number }[]): DayBlock[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: DayBlock[] = [];
  let cluster: DayBlock[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const n = Math.max(...cluster.map((c) => c.col)) + 1;
    cluster.forEach((c) => (c.cols = n));
    cluster = [];
    clusterEnd = -1;
  };

  for (const item of sorted) {
    if (cluster.length > 0 && item.start >= clusterEnd) flush();
    const used = new Set(cluster.filter((c) => c.end > item.start).map((c) => c.col));
    let col = 0;
    while (used.has(col)) col++;
    const block: DayBlock = { ...item, col, cols: 1 };
    cluster.push(block);
    placed.push(block);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (cluster.length > 0) flush();
  return placed;
}

function getTasksForDay(tasks: Task[], date: Date): Task[] {
  return tasks.filter((t) => {
    if (t.scheduled_date) return isSameDay(parseLocalDate(t.scheduled_date), date);
    if (t.deadline) return isSameDay(parseLocalDate(t.deadline), date);
    return false;
  });
}

interface CalendarViewProps {
  tasks: Task[];
  mode: "week" | "day";
  currentDate: Date;
  onDateChange: (d: Date) => void;
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onSchedule: (id: string) => void;
  onEdit?: (task: Task) => void;
}

const priorityStripe: Record<Task["priority"], string> = {
  high: "border-l-red-500 text-red-200",
  medium: "border-l-amber-400 text-amber-200",
  low: "border-l-emerald-500 text-emerald-200",
};

export default function CalendarView({
  tasks,
  mode,
  currentDate,
  onDateChange,
  onToggleDone,
  onDelete,
  onSchedule,
  onEdit,
}: CalendarViewProps) {
  const timeFmt = useTimeFormat();
  const openTask = (task: Task) => (onEdit ? onEdit(task) : onSchedule(task.id));

  // Vederea pe zi derulează la ora curentă (sau 08:00 pentru alte zile).
  const dayScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode !== "day") return;
    const el = dayScrollRef.current;
    if (!el) return;
    const anchorMin = isToday(currentDate) ? new Date().getHours() * 60 + new Date().getMinutes() : 8 * 60;
    el.scrollTop = Math.max((anchorMin / 60) * HOUR_H - HOUR_H, 0);
  }, [mode, currentDate]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const step = mode === "day" ? 1 : 7;
  const headerLabel =
    mode === "day"
      ? format(currentDate, "EEEE, d MMMM yyyy", { locale: ro })
      : `${format(weekStart, "d MMM", { locale: ro })} – ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: ro })}`;

  const unscheduled = tasks.filter((t) => !t.scheduled_date && !t.deadline && t.status !== "done");

  // Ziua curentă: blocuri cu oră + task-uri fără oră („toată ziua").
  const dayTasks = getTasksForDay(tasks, currentDate);
  const timed = dayTasks.filter((t) => t.scheduled_start && !t.all_day);
  const allDay = dayTasks.filter((t) => !t.scheduled_start || t.all_day);
  const blocks = layoutDayBlocks(
    timed.map((t) => {
      const start = minutesOf(t.scheduled_start!);
      const end = t.scheduled_end ? Math.max(minutesOf(t.scheduled_end), start + 15) : start + DEFAULT_BLOCK_MIN;
      return { task: t, start, end: Math.min(end, 24 * 60) };
    })
  );
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#141721]/90 border border-white/[0.07] p-2.5 rounded-2xl backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDateChange(addDays(currentDate, -step))}
            className="rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 p-2 text-[#94a3b8] hover:text-white transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDateChange(addDays(currentDate, step))}
            className="rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 p-2 text-[#94a3b8] hover:text-white transition-colors"
            aria-label="Următor"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDateChange(new Date())}
            className="rounded-xl bg-orange-500/15 border border-orange-500/30 px-3 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/25 transition-colors"
          >
            Astăzi
          </motion.button>
          <span className="text-sm font-semibold text-white ml-2 capitalize">{headerLabel}</span>
        </div>
        <span className="text-[11px] font-mono text-[#64748b] pr-1">
          {mode === "day" ? `${dayTasks.length} task-uri` : `${weekDays.reduce((s, d) => s + getTasksForDay(tasks, d).length, 0)} task-uri`}
        </span>
      </div>

      {mode === "week" && (
        <motion.div
          key={weekStart.toISOString()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-7 gap-2.5"
        >
          {weekDays.map((day, i) => {
            const items = getTasksForDay(tasks, day);
            const today = isToday(day);
            const past = isBefore(day, startOfDay(new Date()));
            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl border p-3 min-h-[160px] transition-all ${
                  today
                    ? "border-orange-500/50 bg-orange-500/[0.08] shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30"
                    : past
                    ? "border-white/[0.04] bg-white/[0.01] opacity-60"
                    : "border-white/[0.07] bg-[#141721]/90 backdrop-blur-sm hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/[0.05]">
                  <span className="text-[10px] uppercase font-mono font-bold text-[#94a3b8] tracking-wider">
                    {format(day, "EEE", { locale: ro })}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      today ? "bg-[#f97316] text-white w-6 h-6 flex items-center justify-center rounded-full shadow-md" : "text-white/80"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.length === 0 && <p className="text-[10px] text-[#64748b] italic">Liber</p>}
                  {items.map((task) => (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => openTask(task)}
                      className={`w-full text-left p-1.5 rounded-lg border-l-2 text-xs font-medium cursor-pointer transition-all bg-white/[0.03] hover:bg-white/[0.08] truncate ${
                        priorityStripe[task.priority]
                      } ${task.status === "done" ? "opacity-40 line-through" : ""}`}
                      title={task.title}
                    >
                      {task.scheduled_start && (
                        <span className="font-mono text-[10px] text-[#94a3b8] mr-1">
                          {formatClock(task.scheduled_start.substring(11, 16), timeFmt)}
                        </span>
                      )}
                      {task.title}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {mode === "day" && (
        <motion.div
          key={currentDate.toDateString()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.08] bg-[#141721]/95 backdrop-blur-sm overflow-hidden"
        >
          {allDay.length > 0 && (
            <div className="px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02] flex items-start gap-3">
              <span className="text-[10px] font-mono uppercase text-[#94a3b8] pt-1 flex items-center gap-1 shrink-0">
                <Sun className="w-3 h-3 text-amber-400" /> Toată ziua
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allDay.map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    onClick={() => openTask(task)}
                    className={`px-2.5 py-1 rounded-lg border-l-2 text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] ${priorityStripe[task.priority]} ${
                      task.status === "done" ? "opacity-40 line-through" : ""
                    }`}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={dayScrollRef} className="flex max-h-[70vh] overflow-y-auto overscroll-contain">
            <div className="w-16 flex-shrink-0 border-r border-white/[0.06]">
              {HOURS.map((hour) => (
                <div key={hour} style={{ height: HOUR_H }} className="px-3 pt-1 text-xs font-mono text-[#64748b]">
                  {formatHourLabel(hour, timeFmt)}
                </div>
              ))}
            </div>

            <div className="relative flex-1" style={{ height: HOURS.length * HOUR_H }}>
              {HOURS.map((hour, i) => (
                <div key={hour} className="absolute inset-x-0 border-t border-white/[0.04]" style={{ top: i * HOUR_H }} />
              ))}

              {isToday(currentDate) && (
                <div
                  className="absolute inset-x-0 h-px bg-[#f97316] z-10 pointer-events-none"
                  style={{ top: (nowMin / 60) * HOUR_H, boxShadow: "0 0 8px rgba(249,115,22,0.6)" }}
                  aria-hidden
                >
                  <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-[#f97316]" />
                </div>
              )}

              {blocks.map((b) => {
                const top = (b.start / 60) * HOUR_H;
                const height = Math.max(((b.end - b.start) / 60) * HOUR_H - 2, 22);
                const widthPct = 100 / b.cols;
                const leftPct = b.col * widthPct;
                const t = b.task;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => openTask(t)}
                    className={`absolute text-left p-2 rounded-xl border-l-2 text-xs font-semibold cursor-pointer shadow-md overflow-hidden ${
                      t.status === "done"
                        ? "bg-white/5 border-white/20 text-[#64748b] line-through"
                        : `bg-orange-500/20 border border-orange-500/40 text-orange-100 hover:bg-orange-500/30 ${priorityStripe[t.priority]}`
                    }`}
                    style={{
                      top,
                      height,
                      left: `calc(${leftPct}% + 8px)`,
                      width: `calc(${widthPct}% - 16px)`,
                      ...(t.color && t.status !== "done" ? { borderLeftColor: t.color } : {}),
                    }}
                    title={t.title}
                  >
                    <span className="font-mono text-[10px] text-white/70 mr-1.5">
                      {formatClock(t.scheduled_start!.substring(11, 16), timeFmt)}
                      {t.scheduled_end && `–${formatClock(t.scheduled_end.substring(11, 16), timeFmt)}`}
                    </span>
                    <span className="truncate">{t.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {unscheduled.length > 0 && (
        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#141721]/90 p-4 shadow-xl">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
            Neprogramate ({unscheduled.length})
          </h4>
          <div className="space-y-2">
            {unscheduled.slice(0, 6).map((task, i) => (
              <TaskCard key={task.id} task={task} onToggleDone={onToggleDone} onDelete={onDelete} onSchedule={onSchedule} compact index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
