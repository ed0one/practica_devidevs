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
  onDuplicate?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onBulkDone?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export default function TaskList({
  tasks,
  onToggleDone,
  onDelete,
  onSchedule,
  onEdit,
  onDuplicate,
  onSnooze,
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

  const selectedIds = sorted.filter((t) => selected.has(t.id)).map((t) => t.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap bg-[#141721]/90 border border-white/[0.07] p-2.5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#94a3b8]" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-xl border border-white/10 bg-[#1e222e] px-3 py-1.5 text-xs text-white focus:border-orange-400 focus:outline-none"
          >
            <option value="deadline">Deadline</option>
            <option value="priority">Prioritate</option>
            <option value="created">Data creării</option>
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-black/40 border border-white/10 p-1">
          {(["all", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white shadow-sm"
                  : "text-[#94a3b8] hover:text-white"
              }`}
            >
              {f === "all" ? "Toate" : f === "pending" ? "Active" : "Finalizate"}
            </button>
          ))}
        </div>

        {bulkEnabled && !selectMode && sorted.length > 0 && (
          <button
            onClick={() => setSelectMode(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-orange-400" /> Selectează
          </button>
        )}
      </div>

      {/* Bulk action toolbar */}
      <AnimatePresence>
        {selectMode && (
          <div className="flex items-center gap-2 flex-wrap rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 shadow-lg">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-400"
            >
              {allVisibleSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {allVisibleSelected ? "Deselectează tot" : "Selectează tot"}
            </button>
            <span className="text-xs text-orange-300/80">
              {selectedIds.length} selectate
            </span>

            <div className="ml-auto flex items-center gap-2">
              {onBulkDone && (
                <button
                  onClick={() => { onBulkDone(selectedIds); exitSelect(); }}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Finalizează
                </button>
              )}
              {onBulkDelete && (
                <button
                  onClick={() => { onBulkDelete(selectedIds); exitSelect(); }}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Șterge
                </button>
              )}
              <button
                onClick={exitSelect}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-orange-300 hover:bg-white/10 transition-colors"
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
                onDuplicate={onDuplicate}
                onSnooze={onSnooze}
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
                  className="shrink-0 rounded p-1 text-orange-400"
                >
                  {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-500" />}
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
