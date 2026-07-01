"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Tag, Calendar, Flag, Repeat, Bell } from "lucide-react";
import { Task, Priority, Recurrence } from "@/types/task";

interface EditTaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Pick<Task, "title" | "priority" | "deadline" | "category" | "recurrence" | "reminder_offset_min">>) => Promise<void>;
}

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Niciodată" },
  { value: "daily", label: "Zilnic" },
  { value: "weekly", label: "Săptămânal" },
];

const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Fără reminder" },
  { value: 0, label: "La ora programată" },
  { value: 10, label: "Cu 10 min înainte" },
  { value: 30, label: "Cu 30 min înainte" },
  { value: 60, label: "Cu 1 oră înainte" },
  { value: 1440, label: "Cu o zi înainte" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "Ridicată", color: "bg-red-500" },
  { value: "medium", label: "Medie", color: "bg-amber-400" },
  { value: "low", label: "Scăzută", color: "bg-emerald-500" },
];

export default function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [reminderOffset, setReminderOffset] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sincronizăm câmpurile formularului când se deschide alt task.
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(task.title);
      setPriority(task.priority);
      setDeadline(task.deadline ? task.deadline.substring(0, 10) : "");
      setCategory(task.category ?? "");
      setRecurrence(task.recurrence ?? "none");
      setReminderOffset(task.reminder_offset_min ?? null);
      setError(null);
    }
  }, [task]);

  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, onClose]);

  const handleSave = async () => {
    if (!task || !title.trim()) {
      setError("Titlul nu poate fi gol");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(task.id, {
        title: title.trim(),
        priority,
        deadline: deadline || null,
        category: category.trim() || null,
        recurrence,
        reminder_offset_min: reminderOffset,
      });
      onClose();
    } catch {
      setError("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Editează task"
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#16161f] shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">Editează task</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label="Închide">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Type className="w-3.5 h-3.5" /> Titlu
                </label>
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white resize-none transition-all"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Flag className="w-3.5 h-3.5" /> Prioritate
                </label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPriority(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold border transition-all ${
                        priority === opt.value
                          ? "border-transparent text-white shadow-md"
                          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 bg-white dark:bg-white/5"
                      }`}
                      style={priority === opt.value ? { background: opt.color === "bg-red-500" ? "#ef4444" : opt.color === "bg-amber-400" ? "#f59e0b" : "#10b981" } : {}}
                    >
                      <span className={`w-2 h-2 rounded-full ${priority !== opt.value ? opt.color : "bg-white"}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Tag className="w-3.5 h-3.5" /> Categorie
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="ex: muncă, personal, sănătate..."
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                />
              </div>

              {/* Recurrence */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Repeat className="w-3.5 h-3.5" /> Recurență
                </label>
                <div className="flex gap-2">
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRecurrence(opt.value)}
                      aria-pressed={recurrence === opt.value}
                      className={`flex-1 h-9 rounded-xl text-xs font-semibold border transition-all ${
                        recurrence === opt.value
                          ? "border-indigo-500 bg-indigo-500 text-white shadow-md"
                          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300 bg-white dark:bg-white/5"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {recurrence !== "none" && (
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    La finalizare, se creează automat următorul task {recurrence === "daily" ? "peste o zi" : "peste o săptămână"}.
                  </p>
                )}
              </div>

              {/* Reminder */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Bell className="w-3.5 h-3.5" /> Reminder pe email
                </label>
                <select
                  value={reminderOffset === null ? "" : String(reminderOffset)}
                  onChange={(e) => setReminderOffset(e.target.value === "" ? null : Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white dark:focus:bg-white/10 transition-all"
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={String(opt.value)} value={opt.value === null ? "" : String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Relativ la ora programată; fără oră, se folosește deadline-ul la 09:00.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex gap-3 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white disabled:opacity-50 hover:from-indigo-500 hover:to-violet-500 transition-all"
              >
                {saving ? "Se salvează..." : "Salvează"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
