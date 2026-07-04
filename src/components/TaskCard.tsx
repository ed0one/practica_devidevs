"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Task, Priority, Status } from "@/types/task";
import { CheckCircle2, Circle, Clock, AlertTriangle, Calendar, Tag, Trash2, Pencil, Repeat } from "lucide-react";
import { useTimeFormat, formatClock, type TimeFormat } from "@/lib/time-format";

const RECURRENCE_LABEL: Record<string, string> = { daily: "Zilnic", weekly: "Săptămânal" };

const priorityConfig: Record<Priority, { border: string; dot: string; label: string; badgeBg: string; badgeText: string }> = {
  high:   { border: "border-l-red-500",    dot: "bg-red-500",    label: "Urgent",  badgeBg: "bg-red-50 dark:bg-red-500/15",        badgeText: "text-red-600 dark:text-red-400" },
  medium: { border: "border-l-amber-400",  dot: "bg-amber-400",  label: "Mediu",   badgeBg: "bg-amber-50 dark:bg-amber-500/15",    badgeText: "text-amber-700 dark:text-amber-400" },
  low:    { border: "border-l-emerald-500",dot: "bg-emerald-500",label: "Scăzut", badgeBg: "bg-emerald-50 dark:bg-emerald-500/15",badgeText: "text-emerald-700 dark:text-emerald-400" },
};

function formatTime(iso: string | null, fmt: TimeFormat): string {
  if (!iso) return "";
  return formatClock(iso.substring(11, 16), fmt);
}

function formatDateShort(iso: string | null): string {
  if (!iso) return "Fără deadline";
  const [y, m, d] = iso.substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  const [y, m, d] = deadline.substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d) < new Date(new Date().setHours(0, 0, 0, 0));
}

interface TaskCardProps {
  task: Task;
  onToggleDone: (id: string, status: Status) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (id: string) => void;
  onEdit?: (task: Task) => void;
  compact?: boolean;
  index?: number;
}

export default function TaskCard({ task, onToggleDone, onDelete, onSchedule, onEdit, compact = false, index = 0 }: TaskCardProps) {
  const timeFmt = useTimeFormat();
  const overdue = task.status === "pending" && isOverdue(task.deadline);
  const cfg = priorityConfig[task.priority];
  const isDone = task.status === "done";

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg border-l-2 ${cfg.border} bg-white dark:bg-[#16161f] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isDone ? "opacity-50" : ""} ${overdue ? "bg-red-50/50 dark:bg-red-500/10" : ""}`}
      >
        <button
          onClick={() => onToggleDone(task.id, isDone ? "pending" : "done")}
          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
          aria-label={isDone ? "Marchează ca activ" : "Marchează ca finalizat"}
          aria-pressed={isDone}
        >
          {isDone
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            : <Circle className="w-3.5 h-3.5 text-gray-300 hover:text-[#ff8a63] transition-colors" />
          }
        </button>
        <span className={`text-xs font-medium flex-1 truncate ${isDone ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
          {task.title}
        </span>
        {task.scheduled_start && (
          <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0">
            <Clock className="w-2.5 h-2.5" />
            {formatTime(task.scheduled_start, timeFmt)}
          </span>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            aria-label={`Șterge task-ul: ${task.title}`}
          >
            <Trash2 className="w-3 h-3 text-gray-300 hover:text-red-400 transition-colors" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: index * 0.04 }}
      whileHover={{ y: -1 }}
      className={`group relative bg-white dark:bg-[#16161f] rounded-2xl border border-gray-200/70 dark:border-white/10 border-l-4 ${cfg.border} shadow-sm hover:shadow-md transition-all ${isDone ? "opacity-55" : ""} ${overdue ? "border-red-300 dark:border-red-500/40 bg-red-50/30 dark:bg-red-500/10" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggleDone(task.id, isDone ? "pending" : "done")}
            className="mt-0.5 shrink-0 transition-transform hover:scale-110 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
            aria-label={isDone ? "Marchează ca activ" : "Marchează ca finalizat"}
            aria-pressed={isDone}
          >
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div key="done" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400 }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div key="pending" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Circle className="w-5 h-5 text-gray-300 hover:text-[#ff8a63] transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-[15px] leading-snug tracking-tight ${isDone ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
              {task.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              {task.category && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 dark:bg-[#ff6a3d]/15 text-[#d24d1f] dark:text-[#ff8a63] px-2 py-0.5 text-[11px] font-medium">
                  <Tag className="w-2.5 h-2.5" />
                  {task.category}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium ${overdue ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400" : "bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400"}`}>
                <Calendar className="w-2.5 h-2.5" />
                {formatDateShort(task.deadline)}
                {overdue && <AlertTriangle className="w-2.5 h-2.5 ml-0.5" />}
              </span>
              {task.scheduled_start && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#3dd4a7]/10 dark:bg-[#3dd4a7]/15 text-[#3dd4a7] dark:text-[#3dd4a7] px-2 py-0.5 text-[11px] font-medium">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(task.scheduled_start, timeFmt)}
                  {task.scheduled_end && `–${formatTime(task.scheduled_end, timeFmt)}`}
                </span>
              )}
              {task.recurrence && task.recurrence !== "none" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 px-2 py-0.5 text-[11px] font-medium">
                  <Repeat className="w-2.5 h-2.5" />
                  {RECURRENCE_LABEL[task.recurrence]}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {onSchedule && !isDone && (
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => onSchedule(task.id)}
                className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-orange-50 text-gray-400 hover:text-[#d24d1f] flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
                title="Programează"
                aria-label="Programează task-ul"
              >
                <Clock className="w-3.5 h-3.5" />
              </motion.button>
            )}
            {onEdit && !isDone && (
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(task)}
                className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-[#3dd4a7]/10 text-gray-400 hover:text-[#3dd4a7] flex items-center justify-center transition-all lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3dd4a7]"
                title="Editează"
                aria-label="Editează task-ul"
              >
                <Pencil className="w-3.5 h-3.5" />
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(task.id)}
                className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                title="Șterge"
                aria-label="Șterge task-ul"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
