"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useTimeFormat, formatClock } from "@/lib/time-format";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Status, Priority } from "@/types/task";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Tag,
  Trash2,
  Pencil,
  AlertTriangle,
  GripVertical,
} from "lucide-react";

const COLUMNS: {
  id: string;
  label: string;
  dot: string;
  ring: string;
  countBg: string;
  countText: string;
}[] = [
  { id: "high",   label: "Urgent",     dot: "bg-red-500",     ring: "ring-red-300",     countBg: "bg-red-100",     countText: "text-red-600" },
  { id: "medium", label: "Normal",     dot: "bg-amber-400",   ring: "ring-amber-300",   countBg: "bg-amber-100",   countText: "text-amber-700" },
  { id: "low",    label: "Scăzut",    dot: "bg-emerald-500", ring: "ring-emerald-300", countBg: "bg-emerald-100", countText: "text-emerald-700" },
  { id: "done",   label: "Finalizate", dot: "bg-gray-400",    ring: "ring-gray-300",    countBg: "bg-gray-100",    countText: "text-gray-600" },
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

// ─── Mini card used in DragOverlay ──────────────────────────────────────────
function CardPreview({ task }: { task: Task }) {
  return (
    <div className="bg-white rounded-xl border border-indigo-300 shadow-2xl shadow-indigo-200/60 p-3 w-56 rotate-2 opacity-95 ring-2 ring-indigo-400">
      <p className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2">{task.title}</p>
      {task.deadline && (
        <p className="mt-1 text-[10px] text-gray-400">{formatDateShort(task.deadline)}</p>
      )}
    </div>
  );
}

// ─── Draggable card ──────────────────────────────────────────────────────────
function DraggableCard({
  task,
  onToggleDone,
  onDelete,
  onEdit,
  isDraggingThis,
}: {
  task: Task;
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  isDraggingThis: boolean;
}) {
  const timeFmt = useTimeFormat();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const overdue = isOverdue(task.deadline, task.status);
  const isDone = task.status === "done";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white dark:bg-[#16161f] rounded-xl border border-gray-200/80 dark:border-white/10 p-3 shadow-sm transition-all
        ${isDraggingThis ? "opacity-30 scale-95" : "hover:shadow-md"}
        ${isDone ? "opacity-55" : ""}
        ${overdue ? "border-red-300 ring-1 ring-red-200" : ""}
      `}
    >
      <div className="flex items-start gap-2 mb-2">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors touch-none"
          title="Trage pentru a muta"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Toggle done */}
        <button
          onClick={() => onToggleDone(task.id, isDone ? "pending" : "done")}
          className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
        >
          {isDone
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : <Circle className="w-4 h-4 text-gray-300 hover:text-blue-400 transition-colors" />}
        </button>

        <p className={`text-[13px] font-medium leading-snug flex-1 ${isDone ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
          {task.title}
        </p>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1 ml-9">
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
            {formatClock(task.scheduled_start.substring(11, 16), timeFmt)}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-1 mt-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        {!isDone && (
          <button
            onClick={() => onEdit(task)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Droppable column ────────────────────────────────────────────────────────
function DroppableColumn({
  col,
  tasks,
  activeId,
  onToggleDone,
  onDelete,
  onEdit,
}: {
  col: (typeof COLUMNS)[number];
  tasks: Task[];
  activeId: string | null;
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] overflow-hidden transition-all duration-150
        ${isOver ? `ring-2 ${col.ring} shadow-md scale-[1.01]` : "hover:shadow-sm"}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${col.dot} shrink-0`} />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{col.label}</span>
        </div>
        <span className={`text-xs font-bold ${col.countBg} ${col.countText} rounded-full px-2 py-0.5 min-w-[20px] text-center`}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`p-3 space-y-2 min-h-[120px] transition-colors duration-150 ${isOver ? "bg-indigo-50/20" : ""}`}
      >
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 && !isOver && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-gray-400 text-center py-6 italic"
            >
              {col.id === "done" ? "Niciun task finalizat" : "Trage task-uri aici"}
            </motion.p>
          )}
          {tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              onToggleDone={onToggleDone}
              onDelete={onDelete}
              onEdit={onEdit}
              isDraggingThis={task.id === activeId}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main BoardView ──────────────────────────────────────────────────────────
export interface BoardViewProps {
  tasks: Task[];
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onMoveTask: (taskId: string, targetCol: string) => void;
}

export default function BoardView({
  tasks,
  onToggleDone,
  onDelete,
  onEdit,
  onMoveTask,
}: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const getColumnTasks = (colId: string): Task[] => {
    if (colId === "done") return tasks.filter((t) => t.status === "done");
    return tasks.filter((t) => t.status === "pending" && t.priority === (colId as Priority));
  };

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const targetCol = over.id as string;

    // Find which column the task was in before
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    const sourceCol = task.status === "done" ? "done" : task.priority;
    if (sourceCol === targetCol) return; // no change

    onMoveTask(active.id as string, targetCol);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            col={col}
            tasks={getColumnTasks(col.id)}
            activeId={activeId}
            onToggleDone={onToggleDone}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeTask ? <CardPreview task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
