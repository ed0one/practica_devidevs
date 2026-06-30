"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Task, Status, Priority } from "@/types/task";
import { CheckCircle2, Circle, Clock, Calendar, Tag, Trash2, Pencil, AlertTriangle } from "lucide-react";

const COLUMNS: { id: string; label: string; emoji: string; bg: string; border: string; header: string }[] = [
  { id: "high",   label: "Urgent",     emoji: "🔴", bg: "bg-red-50/60",     border: "border-red-200",    header: "bg-red-500" },
  { id: "medium", label: "Normal",     emoji: "🟡", bg: "bg-amber-50/60",   border: "border-amber-200",  header: "bg-amber-400" },
  { id: "low",    label: "Scăzut",    emoji: "🟢", bg: "bg-emerald-50/60", border: "border-emerald-200", header: "bg-emerald-500" },
  { id: "done",   label: "Finalizate", emoji: "✅", bg: "bg-gray-50/60",    border: "border-gray-200",   header: "bg-gray-400" },
];

function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

function isOverdue(deadline: string | null, status: Status): boolean {
  if (!deadline || status === "done") return false;
  const [y, m, d] = deadline.substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d) < new Date(new Date().setHours(0, 0, 0, 0));
}

interface BoardViewProps {
  tasks: Task[];
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export default function BoardView({ tasks, onToggleDone, onDelete, onEdit }: BoardViewProps) {
  const getColumnTasks = (colId: string): Task[] => {
    if (colId === "done") return tasks.filter((t) => t.status === "done");
    return tasks.filter((t) => t.status === "pending" && t.priority === (colId as Priority));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col, ci) => {
        const colTasks = getColumnTasks(col.id);
        return (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.07 }}
            className={`rounded-2xl border ${col.border} ${col.bg} overflow-hidden`}
          >
            {/* Column header */}
            <div className={`${col.header} px-4 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{col.emoji}</span>
                <span className="text-sm font-bold text-white">{col.label}</span>
              </div>
              <span className="text-xs font-bold text-white/80 bg-white/20 rounded-full px-2 py-0.5">
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-2.5 min-h-[120px]">
              <AnimatePresence mode="popLayout">
                {colTasks.length === 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-400 text-center py-6 italic"
                  >
                    {col.id === "done" ? "Niciun task finalizat" : "Niciun task"}
                  </motion.p>
                )}
                {colTasks.map((task, i) => {
                  const overdue = isOverdue(task.deadline, task.status);
                  const isDone = task.status === "done";
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.03 }}
                      className={`group bg-white rounded-xl border border-gray-200/80 p-3 shadow-sm hover:shadow-md transition-all ${isDone ? "opacity-55" : ""} ${overdue ? "border-red-300 ring-1 ring-red-200" : ""}`}
                    >
                      {/* Title row */}
                      <div className="flex items-start gap-2 mb-2">
                        <button
                          onClick={() => onToggleDone(task.id, isDone ? "pending" : "done")}
                          className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                        >
                          {isDone
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <Circle className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" />}
                        </button>
                        <p className={`text-[13px] font-medium leading-snug flex-1 ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.title}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-1 ml-6">
                        {task.deadline && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] rounded-full px-1.5 py-0.5 ${overdue ? "bg-red-100 text-red-600 font-semibold" : "bg-gray-100 text-gray-500"}`}>
                            {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDateShort(task.deadline)}
                          </span>
                        )}
                        {task.category && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] rounded-full bg-indigo-50 px-1.5 py-0.5 text-indigo-600">
                            <Tag className="w-2.5 h-2.5" />
                            {task.category}
                          </span>
                        )}
                        {task.scheduled_start && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] rounded-full bg-violet-50 px-1.5 py-0.5 text-violet-600">
                            <Clock className="w-2.5 h-2.5" />
                            {task.scheduled_start.substring(11, 16)}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isDone && (
                          <button
                            onClick={() => onEdit(task)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Editează"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(task.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Șterge"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
