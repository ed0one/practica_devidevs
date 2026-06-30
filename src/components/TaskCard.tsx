"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Task, Priority, Status } from "@/types/task";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  Tag,
} from "lucide-react";
import JiraSyncStatus from "./JiraSyncStatus";

const priorityConfig: Record<
  Priority,
  { bg: string; border: string; glow: string; label: string; icon: string }
> = {
  high: {
    bg: "bg-gradient-to-r from-red-500 to-rose-500",
    border: "border-red-400/30",
    glow: "shadow-red-500/20",
    label: "Ridicată",
    icon: "🔴",
  },
  medium: {
    bg: "bg-gradient-to-r from-amber-400 to-orange-400",
    border: "border-amber-400/30",
    glow: "shadow-amber-400/20",
    label: "Medie",
    icon: "🟡",
  },
  low: {
    bg: "bg-gradient-to-r from-emerald-500 to-green-500",
    border: "border-emerald-400/30",
    glow: "shadow-emerald-500/20",
    label: "Scăzută",
    icon: "🟢",
  },
};

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(iso: string | null): string {
  if (!iso) return "Fără deadline";
  const d = new Date(iso);
  return d.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
  });
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

interface TaskCardProps {
  task: Task;
  onToggleDone: (id: string, status: Status) => void;
  onSchedule?: (id: string) => void;
  compact?: boolean;
  index?: number;
}

export default function TaskCard({
  task,
  onToggleDone,
  onSchedule,
  compact = false,
  index = 0,
}: TaskCardProps) {
  const overdue = task.status === "pending" && isOverdue(task.deadline);
  const config = priorityConfig[task.priority];
  const isDone = task.status === "done";

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className={`group relative overflow-hidden rounded-lg border ${config.border} bg-white/80 backdrop-blur-sm p-2.5 transition-all hover:shadow-lg hover:shadow-gray-200/50 ${isDone ? "opacity-50" : ""} ${overdue ? "border-red-400 ring-1 ring-red-200" : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs">{config.icon}</span>
          <span
            className={`text-sm font-medium truncate flex-1 ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}
          >
            {task.title}
          </span>
          {task.scheduled_start && (
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {formatTime(task.scheduled_start)}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.04,
      }}
      whileHover={{ y: -2 }}
      className={`group relative overflow-hidden rounded-xl border ${config.border} bg-white/90 backdrop-blur-md transition-all hover:shadow-xl ${config.glow} ${isDone ? "opacity-60 grayscale" : ""} ${overdue ? "border-red-400 ring-2 ring-red-200" : ""}`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${config.bg} rounded-l-xl`}
      />

      <div className="p-4 pl-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              onToggleDone(task.id, isDone ? "pending" : "done")
            }
            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
          >
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="pending"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Circle className="w-5 h-5 text-gray-300 hover:text-blue-400 transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-[15px] leading-snug ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}
            >
              {task.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${config.bg}`}
              >
                {config.label}
              </span>

              {task.category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                  <Tag className="w-2.5 h-2.5" />
                  {task.category}
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${overdue ? "bg-red-100 text-red-600 font-semibold" : "bg-gray-50 text-gray-500"}`}
              >
                <Calendar className="w-2.5 h-2.5" />
                {formatDateShort(task.deadline)}
                {overdue && (
                  <AlertTriangle className="w-2.5 h-2.5 ml-0.5" />
                )}
              </span>

              {task.scheduled_start && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(task.scheduled_start)}
                  {task.scheduled_end && `–${formatTime(task.scheduled_end)}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {onSchedule && !isDone && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSchedule(task.id)}
                className="rounded-lg bg-indigo-50 p-1.5 text-indigo-500 hover:bg-indigo-100 transition-colors"
                title="Programează"
              >
                <Clock className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
