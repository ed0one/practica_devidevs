"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  startOfWeek,
  addDays,
  format,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ro } from "date-fns/locale";
import { Task, Status, ViewMode } from "@/types/task";
import TaskCard from "./TaskCard";
import TaskList from "./TaskList";
import BoardView from "./BoardView";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Clock,
  LayoutGrid,
  Kanban,
  CheckCircle2,
  Circle,
  Trash2,
  GitCommit,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useTimeFormat, formatClock, formatHourLabel } from "@/lib/time-format";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_START_MIN = 0;
const DAY_END_MIN = 24 * 60;
const HOUR_H = 54;

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

function layoutDayBlocks(items: { task: Task; start: number; end: number }[]): DayBlock[] {
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

interface CalendarViewProps {
  tasks: Task[];
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onSchedule: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDuplicate?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onMoveTask?: (taskId: string, targetCol: string) => void;
  onBulkDone?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  initialViewMode?: ViewMode;
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getTasksForDay(tasks: Task[], date: Date): Task[] {
  return tasks.filter((t) => {
    if (t.scheduled_date) return isSameDay(parseLocalDate(t.scheduled_date), date);
    if (t.deadline) return isSameDay(parseLocalDate(t.deadline), date);
    return false;
  });
}

// ─── Timeline Gantt Component (matching mockup) ──────────────────────────────
function ProjectTimelineView({
  tasks,
  onEdit,
}: {
  tasks: Task[];
  onEdit?: (task: Task) => void;
}) {
  const daysHeader = [16, 17, 18, 19, 20, 22, 24, 1, 3, 6, 7, 8, 9, 10, 12];

  // Timeline rows sample & dynamic mapping
  const timelineRows = [
    {
      type: "Milestone",
      title: "Sprint 4 Planning",
      dateLabel: "Oct 24",
      startCol: 4,
      span: 3,
      avatar: "SC",
      variant: "milestone",
    },
    {
      type: "Deadlines",
      title: "Frontend Coding",
      dateLabel: "Oct 28",
      startCol: 6,
      span: 4,
      avatar: "JD",
      variant: "amber-bar",
    },
    {
      type: "QA Testing",
      title: "Frontend Coding",
      dateLabel: "Oct 28",
      startCol: 8,
      span: 3,
      avatar: "AL",
      variant: "orange-bar",
    },
    {
      type: "Milestone",
      title: "QA Testing",
      dateLabel: "Oct 28",
      startCol: 9,
      span: 4,
      avatar: "SC",
      variant: "glass-bar",
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#12151e]/95 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-base font-bold text-white tracking-tight">
            Project Timeline
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
            Oct 16 – Nov 12
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#94a3b8] hover:text-white transition-colors">
            <span>Oct 18 – Nov 12</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[650px] p-5">
          {/* Top Dates Header */}
          <div className="grid grid-cols-12 gap-1 pb-3 mb-4 border-b border-white/[0.06] text-center font-mono text-[11px] text-[#64748b]">
            <div className="col-span-3 text-left font-semibold text-[#94a3b8]">Track / Target</div>
            <div className="col-span-9 grid grid-cols-15 text-[10px]">
              {daysHeader.map((d, i) => (
                <span
                  key={i}
                  className={`py-0.5 ${d === 24 ? "text-orange-400 font-bold" : ""}`}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="space-y-4 relative">
            {/* Vertical guide line at day 24 */}
            <div
              className="absolute top-0 bottom-0 left-[62%] w-px bg-orange-500/40 pointer-events-none z-0"
              style={{ boxShadow: "0 0 8px rgba(249, 115, 22, 0.4)" }}
            />

            {timelineRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center relative z-10">
                {/* Left track details */}
                <div className="col-span-3 flex items-center justify-between pr-3">
                  <div>
                    <p className="text-xs font-semibold text-white/90">{row.type}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-orange-400/90 font-mono mt-0.5">
                      {row.dateLabel}
                    </span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white/10">
                    {row.avatar}
                  </div>
                </div>

                {/* Right gantt track */}
                <div className="col-span-9 relative h-9 bg-white/[0.02] rounded-xl border border-white/[0.04] flex items-center px-1">
                  {row.variant === "milestone" && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="absolute left-[30%] px-3 py-1.5 rounded-lg bg-[#272c3d] border border-white/20 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <GitCommit className="w-3.5 h-3.5 text-orange-400" />
                      <span>{row.title}</span>
                    </motion.div>
                  )}

                  {row.variant === "amber-bar" && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="absolute left-[45%] w-[42%] py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-black font-semibold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{row.title}</span>
                      <span className="text-[9px] font-mono uppercase opacity-70">Active</span>
                    </motion.div>
                  )}

                  {row.variant === "orange-bar" && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="absolute left-[60%] w-[35%] py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white font-semibold text-xs shadow-lg shadow-orange-500/30 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{row.title}</span>
                      <ArrowRight className="w-3 h-3 text-white/80" />
                    </motion.div>
                  )}

                  {row.variant === "glass-bar" && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="absolute left-[70%] w-[28%] py-1.5 px-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-md flex items-center justify-center cursor-pointer"
                    >
                      <span>{row.title}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Progress Bar */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="font-mono text-[#94a3b8]">Sprint Progress: 74%</span>
            <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#f59e0b] to-[#f97316] rounded-full w-[74%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main CalendarView Export ────────────────────────────────────────────────
export default function CalendarView({
  tasks,
  onToggleDone,
  onDelete,
  onSchedule,
  onEdit,
  onDuplicate,
  onSnooze,
  onMoveTask,
  onBulkDone,
  onBulkDelete,
  initialViewMode = "board",
}: CalendarViewProps) {
  const timeFmt = useTimeFormat();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  const dayScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (viewMode !== "day") return;
    const el = dayScrollRef.current;
    if (!el) return;
    const anchorMin = isToday(currentDate)
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : 8 * 60;
    const top = Math.max(((anchorMin - DAY_START_MIN) / 60) * HOUR_H - HOUR_H, 0);
    el.scrollTop = top;
  }, [viewMode, currentDate]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const prev = () =>
    setCurrentDate(viewMode === "day" ? addDays(currentDate, -1) : addDays(currentDate, -7));
  const next = () =>
    setCurrentDate(viewMode === "day" ? addDays(currentDate, 1) : addDays(currentDate, 7));
  const goToday = () => setCurrentDate(new Date());

  const unscheduled = tasks.filter((t) => !t.scheduled_date && !t.deadline);

  const headerLabel =
    viewMode === "day"
      ? format(currentDate, "d MMMM yyyy", { locale: ro })
      : `${format(weekStart, "d MMM", { locale: ro })} – ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: ro })}`;

  const hasDateNav = viewMode === "week" || viewMode === "day";

  return (
    <div className="space-y-4 select-none">
      {/* View Switcher Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#141721]/90 border border-white/[0.07] p-2.5 rounded-2xl backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          {hasDateNav && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prev}
                className="rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 p-2 text-[#94a3b8] hover:text-white transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={next}
                className="rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 p-2 text-[#94a3b8] hover:text-white transition-colors"
                aria-label="Următor"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToday}
                className="rounded-xl bg-orange-500/15 border border-orange-500/30 px-3 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/25 transition-colors"
              >
                Astăzi
              </motion.button>
            </>
          )}

          {hasDateNav && (
            <span className="text-sm font-semibold text-white ml-2 capitalize">
              {headerLabel}
            </span>
          )}
        </div>

        {/* View Mode Pills */}
        <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-1">
          {(
            [
              ["board", Kanban, "Kanban Board"],
              ["timeline", GitCommit, "Timeline (Gantt)"],
              ["week", LayoutGrid, "Săptămână"],
              ["day", Clock, "Zi"],
              ["list", List, "Listă"],
            ] as [ViewMode, typeof Kanban, string][]
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 focus:outline-none ${
                viewMode === mode
                  ? "text-white shadow-md font-bold"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              {viewMode === mode && (
                <motion.div
                  layoutId="viewPillActive"
                  className="absolute inset-0 bg-gradient-to-r from-[#f97316] to-[#ea580c] rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Render Selected View */}
      <AnimatePresence mode="wait">
        {viewMode === "board" && (
          <motion.div
            key="board"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <BoardView
              tasks={tasks}
              onToggleDone={onToggleDone}
              onDelete={onDelete}
              onEdit={onEdit ?? (() => {})}
              onMoveTask={onMoveTask ?? (() => {})}
            />
          </motion.div>
        )}

        {viewMode === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ProjectTimelineView tasks={tasks} onEdit={onEdit} />
          </motion.div>
        )}

        {viewMode === "week" && (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-7 gap-2.5"
          >
            {weekDays.map((day, i) => {
              const dayTasks = getTasksForDay(tasks, day);
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
                        today
                          ? "bg-[#f97316] text-white w-6 h-6 flex items-center justify-center rounded-full shadow-md"
                          : "text-white/80"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {dayTasks.length === 0 && (
                      <p className="text-[10px] text-[#64748b] italic">Liber</p>
                    )}
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => (onEdit ? onEdit(task) : onSchedule(task.id))}
                        className={`p-1.5 rounded-lg border-l-2 text-xs font-medium cursor-pointer transition-all bg-white/[0.03] hover:bg-white/[0.08] truncate ${
                          task.priority === "high"
                            ? "border-l-red-500 text-red-200"
                            : task.priority === "medium"
                            ? "border-l-amber-400 text-amber-200"
                            : "border-l-emerald-500 text-emerald-200"
                        } ${task.status === "done" ? "opacity-40 line-through" : ""}`}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {viewMode === "day" && (
          <motion.div
            key="day"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-white/[0.08] bg-[#141721]/95 backdrop-blur-sm overflow-hidden"
          >
            {/* Timeline: hourly schedule */}
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
                  <div
                    key={hour}
                    className="absolute inset-x-0 border-t border-white/[0.04]"
                    style={{ top: i * HOUR_H }}
                  />
                ))}

                {getTasksForDay(tasks, currentDate).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => (onEdit ? onEdit(task) : onSchedule(task.id))}
                    className="absolute inset-x-4 p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-200 text-xs font-semibold cursor-pointer shadow-md"
                    style={{ top: 80, height: 48 }}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TaskList
              tasks={tasks}
              onToggleDone={onToggleDone}
              onDelete={onDelete}
              onSchedule={onSchedule}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onSnooze={onSnooze}
              onBulkDone={onBulkDone}
              onBulkDelete={onBulkDelete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unscheduled section if applicable */}
      {unscheduled.length > 0 && viewMode !== "board" && viewMode !== "timeline" && (
        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#141721]/90 p-4 shadow-xl">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[#94a3b8] mb-3 flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-orange-400" />
            Neprogramate ({unscheduled.length})
          </h4>
          <div className="space-y-2">
            {unscheduled.slice(0, 4).map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleDone={onToggleDone}
                onDelete={onDelete}
                onSchedule={onSchedule}
                compact
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
