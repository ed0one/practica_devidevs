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
import { Task, Status, Priority, ViewMode } from "@/types/task";
import TaskCard from "./TaskCard";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Clock,
  LayoutGrid,
} from "lucide-react";

const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);

interface CalendarViewProps {
  tasks: Task[];
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onSchedule: (id: string) => void;
}

function getTasksForDay(tasks: Task[], date: Date): Task[] {
  return tasks.filter((t) => {
    if (t.scheduled_date) {
      return isSameDay(new Date(t.scheduled_date), date);
    }
    if (t.deadline) {
      return isSameDay(new Date(t.deadline), date);
    }
    return false;
  });
}

function getTasksForHour(tasks: Task[], date: Date, hour: number): Task[] {
  return tasks.filter((t) => {
    if (!t.scheduled_start) return false;
    const start = new Date(t.scheduled_start);
    return isSameDay(start, date) && start.getHours() === hour;
  });
}

export default function CalendarView({
  tasks,
  onToggleDone,
  onDelete,
  onSchedule,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");

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

  const sortedTaskList = [...tasks]
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const aHas = a.scheduled_start ? 1 : 0;
      const bHas = b.scheduled_start ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .concat(tasks.filter((t) => t.status === "done"));

  const unscheduled = tasks.filter((t) => !t.scheduled_date && !t.deadline);

  const headerLabel =
    viewMode === "day"
      ? format(currentDate, "d MMMM yyyy", { locale: ro })
      : `${format(weekStart, "d MMM", { locale: ro })} – ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: ro })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prev}
            className="rounded-lg bg-white/80 backdrop-blur border border-gray-200 p-1.5 shadow-sm hover:shadow-md transition-shadow"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={next}
            className="rounded-lg bg-white/80 backdrop-blur border border-gray-200 p-1.5 shadow-sm hover:shadow-md transition-shadow"
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
        </div>

        <h2 className="text-lg font-bold text-gray-800 capitalize">
          {headerLabel}
        </h2>

        <div className="flex items-center rounded-lg bg-white/80 backdrop-blur border border-gray-200 p-0.5 shadow-sm">
          {(
            [
              ["week", LayoutGrid, "Săptămână"],
              ["day", Clock, "Zi"],
              ["list", List, "Listă"],
            ] as [ViewMode, typeof LayoutGrid, string][]
          ).map(([mode, Icon, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`relative rounded-md px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1 ${
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
                        ? "border-gray-100 bg-gray-50/50 opacity-60"
                        : "border-gray-200/80 bg-white/80 backdrop-blur-sm hover:shadow-md"
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
                        high: "border-l-red-500 bg-red-50/50",
                        medium: "border-l-amber-400 bg-amber-50/50",
                        low: "border-l-emerald-500 bg-emerald-50/50",
                      }[task.priority];

                      return (
                        <motion.div
                          key={task.id}
                          whileHover={{ x: 2 }}
                          className={`border-l-2 rounded-r px-1.5 py-0.5 cursor-pointer ${config} ${task.status === "done" ? "opacity-40 line-through" : ""}`}
                          onClick={() => onSchedule(task.id)}
                        >
                          <p className="text-[10px] font-medium text-gray-700 truncate">
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
            className="rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm overflow-hidden"
          >
            {HOURS.map((hour) => {
              const hourTasks = getTasksForHour(tasks, currentDate, hour);
              const isNow =
                isToday(currentDate) && new Date().getHours() === hour;

              return (
                <div
                  key={hour}
                  className={`flex border-b border-gray-100 last:border-b-0 ${isNow ? "bg-indigo-50/30" : ""}`}
                >
                  <div className="w-16 flex-shrink-0 p-3 text-xs font-medium text-gray-400 border-r border-gray-100">
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
            className="space-y-2"
          >
            {sortedTaskList.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleDone={onToggleDone}
                onDelete={onDelete}
                onSchedule={onSchedule}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {unscheduled.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4"
        >
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Nescheduleate ({unscheduled.length})
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
