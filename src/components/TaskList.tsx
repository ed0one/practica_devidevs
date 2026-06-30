"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Priority, Status } from "@/types/task";
import TaskCard from "./TaskCard";
import { ArrowUpDown } from "lucide-react";

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
}

export default function TaskList({
  tasks,
  onToggleDone,
  onDelete,
  onSchedule,
}: TaskListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const sorted = sortTasks(filtered, sortKey);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="deadline">Deadline</option>
            <option value="priority">Prioritate</option>
            <option value="created">Data creării</option>
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 p-0.5">
          {(["all", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                filter === f
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
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
      </div>

      <AnimatePresence mode="popLayout">
        <div className="flex flex-col gap-2.5">
          {sorted.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleDone={onToggleDone}
              onDelete={onDelete}
              onSchedule={onSchedule}
              index={i}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
