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
import { motion, AnimatePresence } from "framer-motion";
import { Task, Status, Priority } from "@/types/task";
import {
  MoreHorizontal,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  GripVertical,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useTimeFormat, formatClock } from "@/lib/time-format";

const COLUMNS: {
  id: string;
  label: string;
  countKey: string;
  colorDot: string;
  badgeBg: string;
}[] = [
  { id: "todo", label: "To Do", countKey: "todo", colorDot: "bg-[#94a3b8]", badgeBg: "bg-white/10 text-white/80" },
  { id: "inprogress", label: "In Progress", countKey: "inprogress", colorDot: "bg-[#f97316]", badgeBg: "bg-orange-500/20 text-orange-400" },
  { id: "review", label: "Under Review", countKey: "review", colorDot: "bg-[#38bdf8]", badgeBg: "bg-sky-500/20 text-sky-400" },
  { id: "blocked", label: "Blocked", countKey: "blocked", colorDot: "bg-[#ef4444]", badgeBg: "bg-red-500/20 text-red-400" },
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

// ─── Drag preview floating card ─────────────────────────────────────────────
function CardPreview({ task }: { task: Task }) {
  return (
    <div className="bg-[#1c202d] rounded-2xl border border-orange-500/50 shadow-2xl shadow-orange-500/20 p-3.5 w-64 rotate-2 opacity-95 ring-2 ring-orange-500/40">
      <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{task.title}</p>
      {task.description && (
        <p className="text-[11px] text-[#94a3b8] line-clamp-1 mt-1">{task.description}</p>
      )}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/20">
          {task.category || "Orange-Amber"}
        </span>
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[9px] font-bold text-white">
          SC
        </div>
      </div>
    </div>
  );
}

// ─── Draggable Kanban Card ──────────────────────────────────────────────────
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

  // Category Tag display
  const tagText = task.category || (task.priority === "high" ? "Orange-Amber" : "Mobile App Dev");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-[#181b24] hover:bg-[#1e222e] rounded-2xl border border-white/[0.07] hover:border-white/15 p-3.5 shadow-md transition-all duration-150 select-none
        ${isDraggingThis ? "opacity-25 scale-95" : "hover:shadow-xl hover:-translate-y-0.5"}
        ${isDone ? "opacity-50" : ""}
        ${overdue ? "border-red-500/40 bg-red-950/10" : ""}
      `}
    >
      <div className="flex items-start gap-2.5 mb-1.5">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-[#64748b] hover:text-white transition-colors touch-none"
          title="Trage pentru a muta"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onToggleDone(task.id, isDone ? "pending" : "done")}
          className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
        >
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          ) : (
            <Circle className="w-4 h-4 text-[#64748b] hover:text-orange-400 transition-colors" />
          )}
        </button>

        {/* Title */}
        <p
          className={`text-[13px] font-semibold leading-snug flex-1 ${
            isDone ? "line-through text-[#64748b]" : "text-white group-hover:text-orange-200 transition-colors"
          }`}
        >
          {task.title}
        </p>
      </div>

      {/* Description / Summary if available */}
      <p className="text-[11px] text-[#94a3b8] line-clamp-2 ml-9 mb-2.5 leading-relaxed">
        {task.description || "Description description and testing procedures..."}
      </p>

      {/* Footer Meta: Category Tag, Priority Indicator, and Avatar */}
      <div className="flex items-center justify-between ml-9 pt-1 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/25 shadow-sm">
            {tagText}
          </span>

          {task.deadline && (
            <span
              className={`inline-flex items-center gap-0.5 text-[9px] rounded-md px-1.5 py-0.5 ${
                overdue ? "bg-red-500/20 text-red-400 font-semibold" : "bg-white/5 text-[#94a3b8]"
              }`}
            >
              {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
              <Calendar className="w-2.5 h-2.5" />
              {formatDateShort(task.deadline)}
            </span>
          )}

          {task.scheduled_start && (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] rounded-md bg-[#38bdf8]/15 px-1.5 py-0.5 text-[#38bdf8]">
              <Clock className="w-2.5 h-2.5" />
              {formatClock(task.scheduled_start.substring(11, 16), timeFmt)}
            </span>
          )}
        </div>

        {/* Assignee Avatar & Quick Edit */}
        <div className="flex items-center gap-1.5">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="w-5 h-5 rounded-md flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="w-5 h-5 rounded-md flex items-center justify-center text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>

          <div
            className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white/20"
            title="Assigned to Sarah Chen"
          >
            SC
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Droppable Column ───────────────────────────────────────────────────────
function DroppableColumn({
  col,
  tasks,
  activeId,
  onToggleDone,
  onDelete,
  onEdit,
  onQuickAdd,
}: {
  col: (typeof COLUMNS)[number];
  tasks: Task[];
  activeId: string | null;
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onQuickAdd?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-white/[0.07] bg-[#12151d]/95 backdrop-blur-md overflow-hidden flex flex-col transition-all duration-150 shadow-xl
        ${isOver ? "ring-2 ring-orange-500/50 bg-[#161a24] scale-[1.01]" : "hover:border-white/12"}
      `}
    >
      {/* Column Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.colorDot}`} />
          <span className="text-[13px] font-bold text-white tracking-tight">{col.label}</span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${col.badgeBg}`}>
            {tasks.length}
          </span>
        </div>

        <button className="text-[#64748b] hover:text-white transition-colors p-1 -mr-1">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Drop List */}
      <div
        ref={setNodeRef}
        className={`p-3 space-y-2.5 min-h-[220px] flex-1 transition-colors duration-150 ${
          isOver ? "bg-orange-500/[0.04]" : ""
        }`}
      >
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 && !isOver && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/[0.06] rounded-xl my-2"
            >
              <Sparkles className="w-4 h-4 text-[#64748b] mb-1.5 opacity-50" />
              <p className="text-xs text-[#64748b] italic">Trage task-uri aici</p>
            </motion.div>
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

      {/* Column Footer: + Add Task */}
      <div className="p-2.5 border-t border-white/[0.04] bg-white/[0.01]">
        <a
          href="/input"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </a>
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

  // Map tasks cleanly to the 4 columns
  const getColumnTasks = (colId: string): Task[] => {
    if (colId === "blocked") {
      return tasks.filter(
        (t) =>
          t.status === "pending" &&
          (t.category === "Blocked" || (t.deadline && isOverdue(t.deadline, t.status)))
      );
    }
    if (colId === "review") {
      return tasks.filter(
        (t) =>
          t.status === "pending" &&
          (t.category === "Review" || t.category === "Under Review")
      );
    }
    if (colId === "inprogress") {
      return tasks.filter(
        (t) =>
          t.status === "pending" &&
          t.category !== "Blocked" &&
          t.category !== "Review" &&
          t.category !== "Under Review" &&
          (t.category === "In Progress" || t.priority === "high" || Boolean(t.scheduled_start))
      );
    }
    // "todo" column (all remaining active tasks)
    return tasks.filter(
      (t) =>
        t.category !== "Blocked" &&
        t.category !== "Review" &&
        t.category !== "Under Review" &&
        t.category !== "In Progress" &&
        t.priority !== "high" &&
        !t.scheduled_start &&
        !(t.deadline && isOverdue(t.deadline, t.status))
    );
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
