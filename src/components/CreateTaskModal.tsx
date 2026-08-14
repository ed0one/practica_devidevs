"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Type, AlignLeft, Calendar, Flag, Tag, Plus, Loader2 } from "lucide-react";
import { Priority, Task } from "@/types/task";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (taskData: {
    title: string;
    description?: string;
    priority: Priority;
    category?: string;
    deadline?: string;
  }) => Promise<void>;
  defaultCategory?: string;
  defaultPriority?: Priority;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "Ridicată / Urgent", color: "bg-red-500 text-white" },
  { value: "medium", label: "Medie", color: "bg-amber-500 text-white" },
  { value: "low", label: "Scăzută", color: "bg-emerald-500 text-white" },
];

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreate,
  defaultCategory = "",
  defaultPriority = "medium",
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [category, setCategory] = useState(defaultCategory);
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setPriority(defaultPriority);
      setCategory(defaultCategory);
      setDeadline(new Date().toISOString().substring(0, 10));
      setError(null);
    }
  }, [isOpen, defaultCategory, defaultPriority]);

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
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

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
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-md">
                  <Plus className="w-4 h-4 text-white stroke-[3]" />
                </div>
                <h2 className="font-bold text-white text-base">Creează task nou</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:bg-white/10 transition-colors"
                aria-label="Închide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {/* Titlu */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                  <Type className="w-3.5 h-3.5" /> Titlu task *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Implementează modulul de autentificare..."
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-[#161a26] px-3.5 py-2.5 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Notițe / Descriere */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Descriere / Notițe
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalii suplimentare sau cerințe..."
                  className="w-full rounded-xl border border-white/10 bg-[#161a26] px-3.5 py-2.5 text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none transition-all"
                />
              </div>

              {/* Prioritate */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                  <Flag className="w-3.5 h-3.5" /> Prioritate
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
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

              {/* Categorie & Deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                    <Tag className="w-3.5 h-3.5" /> Categorie
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="ex: Mobile App Dev"
                    className="w-full rounded-xl border border-white/10 bg-[#161a26] px-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#161a26] px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                  {error}
                </p>
              )}

              {/* Footer CTA */}
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Se creează...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Creează Task
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
