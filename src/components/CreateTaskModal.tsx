"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Type, AlignLeft, Calendar, Flag, Tag, Plus, Loader2, Columns3 } from "lucide-react";
import type { Priority, BoardColumn } from "@/types/task";
import { BOARD_COLUMNS } from "@/lib/board";
import { localDateStr } from "@/lib/dates";

export interface NewTaskData {
  title: string;
  description?: string;
  priority: Priority;
  category?: string;
  deadline?: string;
  board_column: BoardColumn;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (taskData: NewTaskData) => Promise<void>;
  defaultCategory?: string;
  defaultPriority?: Priority;
  /** Coloana Kanban preselectată (ex: „Adaugă task" din josul unei coloane). */
  defaultBoardColumn?: BoardColumn;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "Urgent", color: "bg-red-500 text-white" },
  { value: "medium", label: "Mediu", color: "bg-amber-500 text-white" },
  { value: "low", label: "Scăzut", color: "bg-emerald-500 text-white" },
];

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreate,
  defaultCategory = "",
  defaultPriority = "medium",
  defaultBoardColumn = "todo",
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [category, setCategory] = useState(defaultCategory);
  const [deadline, setDeadline] = useState("");
  const [column, setColumn] = useState<BoardColumn>(defaultBoardColumn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetăm formularul la fiecare deschidere. Se face în timpul randării
  // (pattern-ul „adjust state when a prop changes"), nu într-un effect.
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTitle("");
      setDescription("");
      setPriority(defaultPriority);
      setCategory(defaultCategory);
      setDeadline(localDateStr());
      setColumn(defaultBoardColumn);
      setError(null);
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Titlul este obligatoriu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category.trim() || undefined,
        deadline: deadline || undefined,
        board_column: column,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-[#161a26] px-3.5 py-2.5 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all";
  const labelCls = "flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Creează task nou"
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-[#141722] border border-white/10 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col text-white"
          >
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-md">
                  <Plus className="w-4 h-4 text-white stroke-[3]" />
                </div>
                <h2 className="font-bold text-white text-base">Creează task nou</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:bg-white/10 transition-colors"
                aria-label="Închide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label htmlFor="ct-title" className={labelCls}>
                  <Type className="w-3.5 h-3.5" /> Titlu task *
                </label>
                <input
                  id="ct-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Implementează modulul de autentificare"
                  autoFocus
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="ct-desc" className={labelCls}>
                  <AlignLeft className="w-3.5 h-3.5" /> Descriere / notițe
                </label>
                <textarea
                  id="ct-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalii suplimentare sau cerințe"
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <span className={labelCls}>
                  <Columns3 className="w-3.5 h-3.5" /> Coloană Kanban
                </span>
                <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Coloană Kanban">
                  {BOARD_COLUMNS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      role="radio"
                      aria-checked={column === col.id}
                      onClick={() => setColumn(col.id)}
                      className={`h-9 rounded-xl text-[11px] font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        column === col.id
                          ? "border-orange-500/50 bg-orange-500/15 text-orange-300 shadow-md"
                          : "border-white/10 bg-white/5 text-[#94a3b8] hover:text-white"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={labelCls}>
                  <Flag className="w-3.5 h-3.5" /> Prioritate
                </span>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Prioritate">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={priority === opt.value}
                      onClick={() => setPriority(opt.value)}
                      className={`h-9 rounded-xl text-xs font-semibold border transition-all ${
                        priority === opt.value
                          ? `${opt.color} border-transparent shadow-md`
                          : "border-white/10 bg-white/5 text-[#94a3b8] hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ct-cat" className={labelCls}>
                    <Tag className="w-3.5 h-3.5" /> Categorie
                  </label>
                  <input
                    id="ct-cat"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="ex: muncă, personal"
                    className={`${inputCls} px-3 py-2 text-xs`}
                  />
                </div>
                <div>
                  <label htmlFor="ct-deadline" className={labelCls}>
                    <Calendar className="w-3.5 h-3.5" /> Deadline
                  </label>
                  <input
                    id="ct-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`${inputCls} px-3 py-2 text-xs`}
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                  {error}
                </p>
              )}

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-xs font-bold text-white shadow-lg shadow-orange-500/25 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Se creează
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Creează task
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
