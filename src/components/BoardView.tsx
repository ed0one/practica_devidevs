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
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import type { Task, Status, BoardColumn } from "@/types/task";
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
  ListChecks,
  Repeat,
  Tag,
} from "lucide-react";
import { useTimeFormat, formatClock } from "@/lib/time-format";
import { BOARD_COLUMNS, groupByColumn, isBoardColumn } from "@/lib/board";
import { parseLocalDate, isBeforeToday } from "@/lib/dates";

const PRIORITY_LABEL: Record<Task["priority"], { label: string; cls: string }> = {
  high: { label: "Urgent", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  medium: { label: "Mediu", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  low: { label: "Scăzut", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

function formatDateShort(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

// ─── Previzualizarea cardului în timpul drag-ului ────────────────────────────
function CardPreview({ task, initials }: { task: Task; initials: string }) {
  return (
    <div className="bg-[#1c202d] rounded-2xl border border-orange-500/50 shadow-2xl shadow-orange-500/20 p-3.5 w-64 rotate-2 opacity-95 ring-2 ring-orange-500/40">
      <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{task.title}</p>
      {task.description && <p className="text-[11px] text-[#94a3b8] line-clamp-1 mt-1">{task.description}</p>}
      <div className="mt-2.5 flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${PRIORITY_LABEL[task.priority].cls}`}>
          {task.category || PRIORITY_LABEL[task.priority].label}
        </span>
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[9px] font-bold text-white">
          {initials}
        </div>
      </div>
    </div>
  );
}

// ─── Card Kanban (draggable) ─────────────────────────────────────────────────
function DraggableCard({
  task,
  initials,
  onToggleDone,
  onDelete,
  onEdit,
  isDraggingThis,
  compact = false,
}: {
  task: Task;
  initials: string;
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  isDraggingThis: boolean;
  compact?: boolean;
}) {
  const timeFmt = useTimeFormat();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const isDone = task.status === "done";
  const overdue = !isDone && !!task.deadline && isBeforeToday(task.deadline);
  const subCount = task.subtasks?.length ?? 0;
  const subDone = task.subtasks?.filter((s) => s.done).length ?? 0;
  const prio = PRIORITY_LABEL[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      className={`group relative bg-[#181b24] hover:bg-[#1e222e] rounded-2xl border border-white/[0.07] hover:border-white/15 ${compact ? "p-2.5" : "p-3.5"} shadow-md transition-all duration-150 select-none
        ${isDraggingThis ? "opacity-25 scale-95" : "hover:shadow-xl hover:-translate-y-0.5"}
        ${isDone ? "opacity-50" : ""}
        ${overdue ? "border-red-500/40 bg-red-950/10" : ""}
      `}
    >
      <div className="flex items-start gap-2 mb-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-[#64748b] hover:text-white transition-colors touch-none rounded"
          title="Trage pentru a muta"
          aria-label={`Mută task-ul ${task.title}`}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onToggleDone(task.id, isDone ? "pending" : "done")}
          className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform rounded-full"
          aria-label={isDone ? "Marchează ca activ" : "Marchează ca finalizat"}
        >
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          ) : (
            <Circle className="w-4 h-4 text-[#64748b] hover:text-orange-400 transition-colors" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onEdit(task)}
          className={`text-[13px] font-semibold leading-snug flex-1 text-left ${
            isDone ? "line-through text-[#64748b]" : "text-white group-hover:text-orange-200 transition-colors"
          }`}
        >
          {task.title}
        </button>
      </div>

      {task.description && (
        <p className="text-[11px] text-[#94a3b8] line-clamp-2 mb-2 leading-relaxed">{task.description}</p>
      )}

      {/* Rând de etichete: categorie, prioritate, subtask-uri, recurență */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {task.category ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/25 max-w-full">
            <Tag className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{task.category}</span>
          </span>
        ) : null}
        <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-lg border whitespace-nowrap ${prio.cls}`}>
          {prio.label}
        </span>
        {subCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[9px] rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300 font-mono whitespace-nowrap">
            <ListChecks className="w-2.5 h-2.5" />
            {subDone}/{subCount}
          </span>
        )}
        {task.recurrence && task.recurrence !== "none" && (
          <Repeat className="w-3 h-3 text-purple-300" aria-label="Recurent" />
        )}
      </div>

      {/* Rând de jos: termen + oră în stânga, acțiuni + avatar în dreapta */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {task.deadline && (
            <span
              className={`inline-flex items-center gap-0.5 text-[9px] rounded-md px-1.5 py-0.5 whitespace-nowrap ${
                overdue ? "bg-red-500/20 text-red-400 font-semibold" : "bg-white/5 text-[#94a3b8]"
              }`}
              title={overdue ? "Termen depășit" : "Termen"}
            >
              {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
              <Calendar className="w-2.5 h-2.5" />
              {formatDateShort(task.deadline)}
            </span>
          )}
          {task.scheduled_start && (
            <span className="inline-flex items-center gap-0.5 text-[9px] rounded-md bg-[#38bdf8]/15 px-1.5 py-0.5 text-[#38bdf8] font-mono whitespace-nowrap">
              <Clock className="w-2.5 h-2.5" />
              {formatClock(task.scheduled_start.substring(11, 16), timeFmt)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="w-5 h-5 rounded-md flex items-center justify-center text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Editează"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="w-5 h-5 rounded-md flex items-center justify-center text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Șterge"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
          <div
            className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white/20"
            title="Task-ul tău"
          >
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Coloană (droppable) ─────────────────────────────────────────────────────
function DroppableColumn({
  col,
  tasks,
  initials,
  activeId,
  onToggleDone,
  onDelete,
  onEdit,
  onQuickAdd,
  onBulkDone,
  compact = false,
}: {
  col: (typeof BOARD_COLUMNS)[number];
  tasks: Task[];
  initials: string;
  activeId: string | null;
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onQuickAdd?: (col: BoardColumn) => void;
  onBulkDone?: (ids: string[]) => void;
  compact?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingIds = tasks.filter((t) => t.status !== "done").map((t) => t.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      data-column={col.id}
      className={`rounded-2xl border border-white/[0.07] bg-[#12151d]/95 backdrop-blur-md flex flex-col transition-all duration-150 shadow-xl min-w-0
        ${isOver ? "ring-2 ring-orange-500/50 bg-[#161a24] scale-[1.01]" : "hover:border-white/12"}
      `}
    >
      <div className={`${compact ? "px-3 py-2.5" : "px-4 py-3"} flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] rounded-t-2xl`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
          <span className="text-[13px] font-bold text-white tracking-tight truncate">{col.label}</span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${col.badge}`} title="Task-uri active">
            {pendingIds.length}
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={`Acțiuni pentru coloana ${col.label}`}
            className="text-[#64748b] hover:text-white transition-colors p-1 -mr-1 rounded-md"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
              <div className="absolute right-0 mt-1 w-48 rounded-xl bg-[#161a26] border border-white/10 shadow-2xl p-1.5 z-20 space-y-0.5">
                {onQuickAdd && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onQuickAdd(col.id);
                    }}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-white/10"
                  >
                    <Plus className="w-3.5 h-3.5 text-orange-400" /> Adaugă task aici
                  </button>
                )}
                {onBulkDone && (
                  <button
                    type="button"
                    disabled={pendingIds.length === 0}
                    onClick={() => {
                      setMenuOpen(false);
                      onBulkDone(pendingIds);
                    }}
                    className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-white/10 disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Finalizează toate ({pendingIds.length})
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`${compact ? "p-2 space-y-2" : "p-3 space-y-2.5"} min-h-[220px] flex-1 transition-colors duration-150 ${isOver ? "bg-orange-500/[0.04]" : ""}`}
      >
        {tasks.length === 0 && !isOver && (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/[0.06] rounded-xl my-2">
            <Sparkles className="w-4 h-4 text-[#64748b] mb-1.5 opacity-50" />
            <p className="text-xs text-[#64748b] italic">Trage task-uri aici</p>
          </div>
        )}
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            initials={initials}
            onToggleDone={onToggleDone}
            onDelete={onDelete}
            onEdit={onEdit}
            isDraggingThis={task.id === activeId}
            compact={compact}
          />
        ))}
      </div>

      <div className="p-2.5 border-t border-white/[0.04] bg-white/[0.01] rounded-b-2xl">
        <button
          type="button"
          onClick={() => onQuickAdd?.(col.id)}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adaugă task</span>
        </button>
      </div>
    </motion.div>
  );
}

// Cardul se trage de mânerul din stânga, deci corpul lui iese spre dreapta și
// ar „atinge" coloana vecină. Decidem coloana după poziția cursorului, nu după
// suprapunerea dreptunghiurilor; suprapunerea rămâne doar ca rezervă.
const dropOnPointerColumn: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args);
  return underPointer.length > 0 ? underPointer : rectIntersection(args);
};

// ─── BoardView ───────────────────────────────────────────────────────────────
export interface BoardViewProps {
  tasks: Task[];
  onToggleDone: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onMoveTask: (taskId: string, targetCol: BoardColumn) => void;
  onQuickAdd?: (col: BoardColumn) => void;
  onBulkDone?: (ids: string[]) => void;
  /** Inițialele userului, afișate pe avatarul cardurilor. */
  userInitials?: string;
  /** Pe panoul general (lângă widgeturi) coloanele se strâng la 2×2 până la 2xl. */
  compact?: boolean;
}

export default function BoardView({
  tasks,
  onToggleDone,
  onDelete,
  onEdit,
  onMoveTask,
  onQuickAdd,
  onBulkDone,
  userInitials = "TC",
  compact = false,
}: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );
  const groups = groupByColumn(tasks);
  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !isBoardColumn(over.id)) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task || (task.board_column ?? "todo") === over.id) return;
    onMoveTask(String(active.id), over.id);
  };

  const gridCls = compact
    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
    : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4";

  return (
    <DndContext sensors={sensors} collisionDetection={dropOnPointerColumn} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={gridCls}>
        {BOARD_COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            col={col}
            tasks={groups[col.id]}
            initials={userInitials}
            activeId={activeId}
            onToggleDone={onToggleDone}
            onDelete={onDelete}
            onEdit={onEdit}
            onQuickAdd={onQuickAdd}
            onBulkDone={onBulkDone}
            compact={compact}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeTask ? <CardPreview task={activeTask} initials={userInitials} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
