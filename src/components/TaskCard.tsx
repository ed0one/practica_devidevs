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
  Trash2,
  Pencil,
  Repeat,
  MapPin,
  ListChecks,
  Copy,
  AlarmClockPlus,
  Sun,
} from "lucide-react";
import { useTimeFormat, formatClock, type TimeFormat } from "@/lib/time-format";

const RECURRENCE_LABEL: Record<string, string> = { daily: "Zilnic", weekly: "Săptămânal" };

const priorityConfig: Record<
  Priority,
  { border: string; dot: string; label: string; badgeBg: string; badgeText: string }
> = {
  high: {
    border: "border-l-red-500",
    dot: "bg-red-500",
    label: "Urgent",
    badgeBg: "bg-red-500/15 border border-red-500/30",
    badgeText: "text-red-400",
  },
  medium: {
    border: "border-l-amber-400",
    dot: "bg-amber-400",
    label: "Mediu",
    badgeBg: "bg-amber-500/15 border border-amber-500/30",
    badgeText: "text-amber-400",
  },
  low: {
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    label: "Scăzut",
    badgeBg: "bg-emerald-500/15 border border-emerald-500/30",
    badgeText: "text-emerald-400",
  },
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
  onDuplicate?: (id: string) => void;
  onSnooze?: (id: string) => void;
  compact?: boolean;
  index?: number;
}

export default function TaskCard({
  task,
  onToggleDone,
  onDelete,
  onSchedule,
  onEdit,
  onDuplicate,
  onSnooze,
  compact = false,
  index = 0,
}: TaskCardProps) {
  const timeFmt = useTimeFormat();
  const overdue = task.status === "pending" && isOverdue(task.deadline);
  const cfg = priorityConfig[task.priority];
  const isDone = task.status === "done";
  const subCount = task.subtasks?.length ?? 0;
  const subDone = task.subtasks?.filter((s) => s.done).length ?? 0;

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-l-2 ${cfg.border} bg-[#181b24] hover:bg-[#1e222e] border border-white/[0.06] transition-colors ${
          isDone ? "opacity-50" : ""
        } ${overdue ? "bg-red-950/20 border-red-500/30" : ""}`}
      >
        <button
          onClick={() => onToggleDone(task.id, isDone ? "pending" : "done")}
          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          aria-label={isDone ? "Marchează ca activ" : "Marchează ca finalizat"}
        >
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          ) : (
            <Circle className="w-4 h-4 text-[#64748b] hover:text-orange-400 transition-colors" />
          )}
        </button>
        <span
          className={`text-xs font-semibold flex-1 truncate ${
            isDone ? "line-through text-[#64748b]" : "text-[#f8fafc]"
          }`}
        >
          {task.title}
        </span>
        {task.scheduled_start && (
          <span className="text-[10px] text-[#94a3b8] font-mono flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-orange-400" />
            {formatTime(task.scheduled_start, timeFmt)}
          </span>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#64748b] hover:text-red-400"
            aria-label={`Șterge task: ${task.title}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: index * 0.03 }}
      whileHover={{ y: -1 }}
      style={task.color ? { borderLeftColor: task.color } : undefined}
      className={`group relative bg-[#151821]/95 rounded-2xl border border-white/[0.08] border-l-4 ${
        task.color ? "" : cfg.border
      } shadow-lg hover:shadow-2xl hover:border-white/15 transition-all ${
        isDone ? "opacity-55" : ""
      } ${overdue ? "border-red-500/40 bg-red-950/15" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggleDone(task.id, isDone ? "pending" : "done")}
            className="mt-0.5 shrink-0 transition-transform hover:scale-110 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label={isDone ? "Marchează ca activ" : "Marchează ca finalizat"}
          >
            <AnimatePresence mode="wait">
              {isDone ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                </motion.div>
              ) : (
                <motion.div
                  key="pending"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Circle className="w-5 h-5 text-[#64748b] hover:text-orange-400 transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold text-sm leading-snug tracking-tight ${
                isDone ? "line-through text-[#64748b]" : "text-white"
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>

              {task.category && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-orange-500/15 border border-orange-500/25 text-orange-300 px-2 py-0.5 text-[10px] font-medium">
                  <Tag className="w-2.5 h-2.5" />
                  {task.category}
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                  overdue
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/5 text-[#94a3b8] border border-white/5"
                }`}
              >
                <Calendar className="w-2.5 h-2.5" />
                {formatDateShort(task.deadline)}
                {overdue && <AlertTriangle className="w-2.5 h-2.5 ml-0.5 text-red-400" />}
              </span>

              {task.scheduled_start && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/25 text-[#38bdf8] px-2 py-0.5 text-[10px] font-medium font-mono">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(task.scheduled_start, timeFmt)}
                  {task.scheduled_end && `–${formatTime(task.scheduled_end, timeFmt)}`}
                </span>
              )}

              {task.recurrence && task.recurrence !== "none" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/25 px-2 py-0.5 text-[10px] font-medium">
                  <Repeat className="w-2.5 h-2.5" />
                  {RECURRENCE_LABEL[task.recurrence]}
                </span>
              )}

              {task.location && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 text-[#94a3b8] px-2 py-0.5 text-[10px] font-medium max-w-[140px] truncate">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  {task.location}
                </span>
              )}

              {subCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-medium">
                  <ListChecks className="w-2.5 h-2.5" />
                  {subDone}/{subCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {onSchedule && !isDone && (
              <button
                onClick={() => onSchedule(task.id)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-orange-500/20 text-[#94a3b8] hover:text-orange-400 flex items-center justify-center transition-all"
                title="Programează"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            )}
            {onEdit && !isDone && (
              <button
                onClick={() => onEdit(task)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                title="Editează"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onSnooze && !isDone && (
              <button
                onClick={() => onSnooze(task.id)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-amber-500/20 text-[#94a3b8] hover:text-amber-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                title="Amână cu o zi"
              >
                <AlarmClockPlus className="w-3.5 h-3.5" />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(task.id)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-sky-500/20 text-[#94a3b8] hover:text-sky-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                title="Duplică"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#64748b] hover:text-red-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                title="Șterge"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
