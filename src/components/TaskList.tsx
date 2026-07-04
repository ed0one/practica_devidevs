"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Task, Priority, Status } from "@/types/task";
import TaskCard from "./TaskCard";
import { ArrowUpDown, CheckSquare, Square, CheckCircle2, Trash2, X } from "lucide-react";

type SortKey = "deadline" | "priority" | "created";

const priorityOrder: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function sortTasks(tasks: Task[], key: SortKey): Task[] {
  return [...tasks].sort((a, b) => {
    if (key === "deadline") {
      const aDate = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bDate = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return aDate - bDate;
    }
    if (key === "priority") {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

interface TaskListProps {
  tasks: Task[];
  onToggleDone: (id: string, status: Status) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onBulkDone?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export default function TaskList({
  tasks,
  onToggleDone,
  onDelete,
  onSchedule,
  onEdit,
  onBulkDone,
  onBulkDelete,
}: TaskListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const sorted = sortTasks(filtered, sortKey);

  const bulkEnabled = Boolean(onBulkDone || onBulkDelete);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = sorted.length > 0 && sorted.every((t) => selected.has(t.id));
  const toggleSelectAll = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(sorted.map((t) => t.id)));

  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  // Doar id-urile selectate care sunt încă vizibile în lista curentă.
  const selectedIds = sorted.filter((t) => selected.has(t.id)).map((t) => t.id);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 py-1.5 text-sm text-gray-900 dark:text-gray-200 focus:border-[#ff8a63] focus:outline-none focus:ring-2 focus:ring-orange-100"
          >
            <option value="deadline">Deadline</option>
            <option value="priority">Prioritate</option>
            <option value="created">Data creării</option>
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 p-0.5">
          {(["all", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                filter === f
                  ? "bg-orange-50 text-[#d24d1f] border border-orange-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all"
                ? "Toate"
                : f === "pending"
                  ? "Active"
                  : "Finalizate"}
            </button>
          ))}
        </div>

        {bulkEnabled && !selectMode && sorted.length > 0 && (
          <button
            onClick={() => setSelectMode(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Selectează
          </button>
        )}
      </div>

      {/* Bara de acțiuni bulk */}
      <AnimatePresence>
        {selectMode && (
          <div className="mb-4 flex items-center gap-2 flex-wrap rounded-xl border border-orange-200 dark:border-[#ff6a3d]/30 bg-orange-50/70 dark:bg-[#ff6a3d]/10 px-3 py-2.5">
            <button
              onClick={toggleSelectAll}
              aria-label={allVisibleSelected ? "Deselectează tot" : "Selectează tot"}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#c2410c] dark:text-[#ff8a63] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
            >
              {allVisibleSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {allVisibleSelected ? "Deselectează tot" : "Selectează tot"}
            </button>
            <span className="text-xs text-[#d24d1f]/70 dark:text-[#ff8a63]/70">
              {selectedIds.length} selectate
            </span>

            <div className="ml-auto flex items-center gap-2">
              {onBulkDone && (
                <button
                  onClick={() => { onBulkDone(selectedIds); exitSelect(); }}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Finalizează
                </button>
              )}
              {onBulkDelete && (
                <button
                  onClick={() => { onBulkDelete(selectedIds); exitSelect(); }}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Șterge
                </button>
              )}
              <button
                onClick={exitSelect}
                aria-label="Anulează selecția"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#d24d1f] dark:text-[#ff8a63] hover:bg-orange-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        <div className="flex flex-col gap-2.5">
          {sorted.map((task, i) => {
            const card = (
              <TaskCard
                key={task.id}
                task={task}
                onToggleDone={onToggleDone}
                onDelete={onDelete}
                onSchedule={onSchedule}
                onEdit={onEdit}
                index={i}
              />
            );
            if (!selectMode) return card;
            const isChecked = selected.has(task.id);
            return (
              <div key={task.id} className="flex items-center gap-2.5">
                <button
                  onClick={() => toggleSelect(task.id)}
                  role="checkbox"
                  aria-checked={isChecked}
                  aria-label={`Selectează: ${task.title}`}
                  className="shrink-0 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
                >
                  {isChecked
                    ? <CheckSquare className="w-5 h-5 text-[#d24d1f]" />
                    : <Square className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-[#ff8a63] transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">{card}</div>
              </div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
