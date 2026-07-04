"use client";

import { useState } from "react";
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
} from "lucide-react";
import BoardView from "./BoardView";
import { useTimeFormat, formatClock, formatHourLabel } from "@/lib/time-format";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const DAY_START_MIN = 6 * 60; // 06:00
const DAY_END_MIN = 22 * 60; // 22:00
const HOUR_H = 56; // px per oră în day view

// minute din zi pentru "YYYY-MM-DDTHH:MM:SS"
function minutesOf(local: string): number {
  const h = parseInt(local.substring(11, 13), 10);
  const m = parseInt(local.substring(14, 16), 10);
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

interface DayBlock {
  task: Task;
  start: number; // minute
  end: number;
  col: number;
  cols: number;
}

// Așază task-urile suprapuse pe coloane (clasic calendar): task-urile care
// se intersectează în timp împart lățimea în mod egal.
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
  onMoveTask?: (taskId: string, targetCol: string) => void;
  onBulkDone?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
}

const DEFAULT_MOBILE_VIEW: ViewMode = "list";

function parseLocalDate(str: string): Date {
  // Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS..." as local date (avoid UTC midnight shift)
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

export default function CalendarView({
  tasks,
  onToggleDone,
  onDelete,
  onSchedule,
  onEdit,
  onMoveTask,
  onBulkDone,
  onBulkDelete,
}: CalendarViewProps) {
  const timeFmt = useTimeFormat();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(
    typeof window !== "undefined" && window.innerWidth < 640
      ? DEFAULT_MOBILE_VIEW
      : "week"
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(weekStart, i)
  );

  const prev = () =>
    setCurrentDate(
      viewMode === "day" ? addDays(currentDate, -1) : addDays(currentDate, -7)
    );
  const next = () =>
    setCurrentDate(
      viewMode === "day" ? addDays(currentDate, 1) : addDays(currentDate, 7)
    );
  const goToday = () => setCurrentDate(new Date());

  const unscheduled = tasks.filter((t) => !t.scheduled_date && !t.deadline);

  const headerLabel =
    viewMode === "day"
      ? format(currentDate, "d MMMM yyyy", { locale: ro })
      : `${format(weekStart, "d MMM", { locale: ro })} – ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: ro })}`;

  const hasDateNav = viewMode === "week" || viewMode === "day";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {hasDateNav && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prev}
                className="rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur border border-gray-200 dark:border-white/10 p-1.5 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
                aria-label={viewMode === "day" ? "Ziua anterioară" : "Săptămâna anterioară"}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={next}
                className="rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur border border-gray-200 dark:border-white/10 p-1.5 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
                aria-label={viewMode === "day" ? "Ziua următoare" : "Săptămâna următoare"}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToday}
                className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-semibold text-[#d24d1f] hover:bg-orange-100 transition-colors"
              >
                Astăzi
              </motion.button>
            </>
          )}
        </div>

        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 capitalize">
          {hasDateNav ? headerLabel : ""}
        </h2>

        <div className="flex items-center rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur border border-gray-200 dark:border-white/10 p-0.5 shadow-sm">
          {(
            [
              ["week", LayoutGrid, "Săptămână"],
              ["day", Clock, "Zi"],
              ["list", List, "Listă"],
              ["board", Kanban, "Board"],
            ] as [ViewMode, typeof LayoutGrid, string][]
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              aria-label={`Vizualizare ${label}`}
              className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] ${
                viewMode === mode
                  ? "text-[#d24d1f]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {viewMode === mode && (
                <motion.div
                  layoutId="viewTab"
                  className="absolute inset-0 bg-orange-50 border border-orange-200 rounded-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "week" && (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-7 gap-2 sm:gap-1.5"
          >
            {weekDays.map((day, i) => {
              const dayTasks = getTasksForDay(tasks, day);
              const today = isToday(day);
              const past = isBefore(day, startOfDay(new Date()));

              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-xl border p-3 sm:p-2 sm:min-h-[140px] transition-all ${
                    today
                      ? "border-[#ff8a63] bg-orange-50/50 dark:bg-[#ff6a3d]/10 shadow-md shadow-orange-100/50 dark:shadow-none"
                      : past
                        ? "border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] opacity-60"
                        : "border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#16161f] backdrop-blur-sm hover:shadow-md"
                  }`}
                >
                  {/* Mobile: "luni 30" pe un rând; desktop: EEE sus, număr dreapta */}
                  <div className="flex items-center justify-between mb-2 sm:mb-1.5">
                    <span className="text-xs sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      <span className="sm:hidden">{format(day, "EEEE", { locale: ro })}</span>
                      <span className="hidden sm:inline">{format(day, "EEE", { locale: ro })}</span>
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        today
                          ? "bg-[#ff6a3d] text-white w-7 h-7 flex items-center justify-center rounded-full"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-1">
                    {dayTasks.length === 0 && (
                      <p className="text-[11px] text-gray-300 dark:text-gray-600 italic sm:hidden">
                        Nimic programat
                      </p>
                    )}
                    {dayTasks.map((task) => {
                      const config = {
                        high: "border-l-red-500 bg-white dark:bg-white/5",
                        medium: "border-l-amber-400 bg-white dark:bg-white/5",
                        low: "border-l-emerald-500 bg-white dark:bg-white/5",
                      }[task.priority];

                      return (
                        <motion.div
                          key={task.id}
                          whileHover={{ x: 2 }}
                          className={`flex items-center justify-between gap-2 sm:block border-l-2 rounded-r px-2 py-1.5 sm:px-1.5 sm:py-0.5 cursor-pointer ${config} ${task.status === "done" ? "opacity-40 line-through" : ""}`}
                          onClick={() => (onEdit ? onEdit(task) : onSchedule(task.id))}
                        >
                          <p className="text-xs sm:text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">
                            {task.title}
                          </p>
                          {task.scheduled_start && (
                            <p className="text-[11px] sm:text-[9px] text-gray-500 shrink-0">
                              {formatClock(task.scheduled_start.substring(11, 16), timeFmt)}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {viewMode === "day" && (
          <motion.div
            key="day"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#16161f] backdrop-blur-sm overflow-hidden"
          >
            {/* All-day band: tasks for this day without a scheduled hour */}
            {(() => {
              const allDayTasks = getTasksForDay(tasks, currentDate).filter(
                (t) => !t.scheduled_start
              );
              if (allDayTasks.length === 0) return null;
              return (
                <div className="flex border-b border-gray-200 bg-orange-50/40">
                  <div className="w-16 flex-shrink-0 px-3 py-2 text-[10px] font-semibold text-[#ff8a63] uppercase tracking-wider border-r border-gray-200 flex items-center">
                    Toată ziua
                  </div>
                  <div className="flex-1 p-2 flex flex-col gap-1">
                    {allDayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleDone={onToggleDone}
                        onDelete={onDelete}
                        onSchedule={onSchedule}
                        onEdit={onEdit}
                        compact
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Timeline: task-urile se întind de la scheduled_start la scheduled_end */}
            {(() => {
              const scheduled = tasks.filter((t) => {
                if (!t.scheduled_start) return false;
                return isSameDay(parseLocalDate(t.scheduled_start), currentDate);
              });

              const blocks = layoutDayBlocks(
                scheduled.map((t) => {
                  const start = Math.max(minutesOf(t.scheduled_start!), DAY_START_MIN);
                  const rawEnd = t.scheduled_end
                    ? minutesOf(t.scheduled_end)
                    : minutesOf(t.scheduled_start!) + 60;
                  const end = Math.min(Math.max(rawEnd, start + 30), DAY_END_MIN);
                  return { task: t, start, end };
                })
              );

              const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
              const showNow =
                isToday(currentDate) && nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN;

              const blockColor: Record<string, string> = {
                high: "border-l-red-500 bg-red-50/90 dark:bg-red-500/15 hover:bg-red-100/90 dark:hover:bg-red-500/25",
                medium: "border-l-amber-400 bg-amber-50/90 dark:bg-amber-500/15 hover:bg-amber-100/90 dark:hover:bg-amber-500/25",
                low: "border-l-emerald-500 bg-emerald-50/90 dark:bg-emerald-500/15 hover:bg-emerald-100/90 dark:hover:bg-emerald-500/25",
              };

              return (
                <div className="flex">
                  {/* Coloana orelor */}
                  <div className="w-16 flex-shrink-0 border-r border-gray-100 dark:border-white/5">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: HOUR_H }}
                        className="px-3 pt-1 text-xs font-medium text-gray-400"
                      >
                        {formatHourLabel(hour, timeFmt)}
                      </div>
                    ))}
                  </div>

                  {/* Zona de timeline */}
                  <div
                    className="relative flex-1"
                    style={{ height: HOURS.length * HOUR_H }}
                  >
                    {/* Linii orare */}
                    {HOURS.map((hour, i) => (
                      <div
                        key={hour}
                        className="absolute inset-x-0 border-t border-gray-100 dark:border-white/5"
                        style={{ top: i * HOUR_H }}
                      />
                    ))}

                    {/* Indicator ora curentă */}
                    {showNow && (
                      <div
                        className="absolute inset-x-0 z-20 flex items-center pointer-events-none"
                        style={{ top: ((nowMin - DAY_START_MIN) / 60) * HOUR_H }}
                      >
                        <div className="w-2 h-2 rounded-full bg-[#ff6a3d] -ml-1" />
                        <div className="flex-1 h-0.5 bg-[#ff6a3d]" />
                      </div>
                    )}

                    {/* Blocuri task */}
                    {blocks.map(({ task, start, end, col, cols }) => {
                      const top = ((start - DAY_START_MIN) / 60) * HOUR_H;
                      const height = Math.max(((end - start) / 60) * HOUR_H - 2, 24);
                      const width = 100 / cols;
                      const isDone = task.status === "done";

                      return (
                        <div
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => (onEdit ? onEdit(task) : onSchedule(task.id))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (onEdit) onEdit(task);
                              else onSchedule(task.id);
                            }
                          }}
                          className={`group absolute z-10 text-left rounded-lg border-l-4 px-2 py-1 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d] ${blockColor[task.priority]} ${isDone ? "opacity-45" : ""}`}
                          style={{
                            top,
                            height,
                            left: `calc(${col * width}% + 4px)`,
                            width: `calc(${width}% - 8px)`,
                          }}
                          title={task.title}
                        >
                          {/* Acțiuni: vizibile mereu pe touch, hover pe desktop */}
                          <div className="absolute top-1 right-1 flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleDone(task.id, isDone ? "pending" : "done");
                              }}
                              className="w-6 h-6 rounded-md bg-white/80 dark:bg-black/30 backdrop-blur flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors"
                              aria-label={isDone ? "Marchează ca activ" : "Marchează ca finalizat"}
                            >
                              {isDone
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                : <Circle className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.id);
                              }}
                              className="w-6 h-6 rounded-md bg-white/80 dark:bg-black/30 backdrop-blur flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                              aria-label={`Șterge task-ul: ${task.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className={`text-xs font-semibold text-gray-800 dark:text-gray-200 truncate pr-14 ${isDone ? "line-through" : ""}`}>
                            {task.title}
                          </p>
                          {height >= 40 && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {formatClock(task.scheduled_start!.substring(11, 16), timeFmt)}
                              {task.scheduled_end &&
                                ` – ${formatClock(task.scheduled_end.substring(11, 16), timeFmt)}`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {viewMode === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TaskList
              tasks={tasks}
              onToggleDone={onToggleDone}
              onDelete={onDelete}
              onSchedule={onSchedule}
              onEdit={onEdit}
              onBulkDone={onBulkDone}
              onBulkDelete={onBulkDelete}
            />
          </motion.div>
        )}

        {viewMode === "board" && (
          <motion.div
            key="board"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
      </AnimatePresence>

      {unscheduled.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-[#16161f] shadow-sm p-4"
        >
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Neprogramate ({unscheduled.length})
          </h3>
          <div className="space-y-1.5">
            {unscheduled.map((task, i) => (
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
        </motion.div>
      )}
    </div>
  );
}
