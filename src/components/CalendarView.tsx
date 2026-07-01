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
} from "lucide-react";
import BoardView from "./BoardView";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

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

function getTasksForHour(tasks: Task[], date: Date, hour: number): Task[] {
  return tasks.filter((t) => {
    if (!t.scheduled_start) return false;
    // Parse date part directly from string to avoid timezone shifts
    const datePart = t.scheduled_start.substring(0, 10); // "YYYY-MM-DD"
    const hourPart = parseInt(t.scheduled_start.substring(11, 13), 10);
    const taskDate = new Date(datePart + "T00:00:00");
    return isSameDay(taskDate, date) && hourPart === hour;
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
                className="rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur border border-gray-200 dark:border-white/10 p-1.5 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={viewMode === "day" ? "Ziua anterioară" : "Săptămâna anterioară"}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={next}
                className="rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur border border-gray-200 dark:border-white/10 p-1.5 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={viewMode === "day" ? "Ziua următoare" : "Săptămâna următoare"}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToday}
                className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
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
              className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                viewMode === mode
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {viewMode === mode && (
                <motion.div
                  layoutId="viewTab"
                  className="absolute inset-0 bg-indigo-50 border border-indigo-200 rounded-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Icon className="w-3.5 h-3.5" />
                {label}
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
            className="grid grid-cols-7 gap-1.5"
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
                  className={`rounded-xl border p-2 min-h-[140px] transition-all ${
                    today
                      ? "border-indigo-300 bg-indigo-50/50 shadow-md shadow-indigo-100/50"
                      : past
                        ? "border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] opacity-60"
                        : "border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#16161f] backdrop-blur-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {format(day, "EEE", { locale: ro })}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        today
                          ? "bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full"
                          : "text-gray-700"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  <div className="space-y-1">
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
                          className={`border-l-2 rounded-r px-1.5 py-0.5 cursor-pointer ${config} ${task.status === "done" ? "opacity-40 line-through" : ""}`}
                          onClick={() => onSchedule(task.id)}
                        >
                          <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">
                            {task.title}
                          </p>
                          {task.scheduled_start && (
                            <p className="text-[9px] text-gray-500">
                              {formatTimeShort(task.scheduled_start)}
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
                <div className="flex border-b border-gray-200 bg-indigo-50/40">
                  <div className="w-16 flex-shrink-0 px-3 py-2 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider border-r border-gray-200 flex items-center">
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

            {HOURS.map((hour) => {
              const hourTasks = getTasksForHour(tasks, currentDate, hour);
              const isNow =
                isToday(currentDate) && new Date().getHours() === hour;

              return (
                <div
                  key={hour}
                  className={`flex border-b border-gray-100 dark:border-white/5 last:border-b-0 ${isNow ? "bg-indigo-50/30 dark:bg-indigo-500/10" : ""}`}
                >
                  <div className="w-16 flex-shrink-0 p-3 text-xs font-medium text-gray-400 border-r border-gray-100 dark:border-white/5">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  <div className="flex-1 p-2 min-h-[52px] space-y-1">
                    {isNow && (
                      <motion.div
                        layoutId="currentTimeIndicator"
                        className="h-0.5 bg-indigo-500 rounded-full mb-1"
                      />
                    )}
                    {hourTasks.map((task) => (
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
                    {hourTasks.length === 0 && (
                      <div
                        className="h-full min-h-[28px] rounded border border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                        onClick={() => onSchedule("new")}
                      />
                    )}
                  </div>
                </div>
              );
            })}
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

function formatTimeShort(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
