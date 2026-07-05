"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Type, Tag, Calendar, Flag, Repeat, Bell, Clock, AlignLeft, MapPin, Palette, ListChecks, Plus, Trash2, Sun } from "lucide-react";
import { Task, Priority, Recurrence, Subtask } from "@/types/task";
import { useTimeFormat, formatClock } from "@/lib/time-format";

export type EditableTaskFields = Partial<
  Pick<
    Task,
    | "title"
    | "priority"
    | "deadline"
    | "category"
    | "recurrence"
    | "reminder_offset_min"
    | "scheduled_start"
    | "scheduled_end"
    | "description"
    | "all_day"
    | "location"
    | "color"
    | "subtasks"
  >
>;

interface EditTaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, updates: EditableTaskFields) => Promise<void>;
}

// Paletă de culori pentru evenimente, în stil Google/iOS Calendar.
const COLOR_OPTIONS = [
  { value: "#ff6a3d", label: "Persimmon" },
  { value: "#3dd4a7", label: "Mint" },
  { value: "#4c8dff", label: "Albastru" },
  { value: "#a855f7", label: "Mov" },
  { value: "#f59e0b", label: "Chihlimbar" },
  { value: "#ef4444", label: "Roșu" },
];

// id scurt pentru subtask-uri noi (nu avem nevoie de crypto puternic aici).
function newSubtaskId(): string {
  return Math.random().toString(36).slice(2, 10);
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
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [allDay, setAllDay] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeFmt = useTimeFormat();

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
      setScheduledStart(task.scheduled_start ? task.scheduled_start.substring(11, 16) : "");
      setScheduledEnd(task.scheduled_end ? task.scheduled_end.substring(11, 16) : "");
      setDescription(task.description ?? "");
      setLocation(task.location ?? "");
      setColor(task.color ?? null);
      setAllDay(task.all_day ?? false);
      setSubtasks(task.subtasks ?? []);
      setNewSubtask("");
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
      const baseDate = deadline || new Date().toISOString().substring(0, 10);
      // Un eveniment „toată ziua" nu are ore programate — le golim explicit.
      const start = allDay || !scheduledStart ? null : `${baseDate}T${scheduledStart}:00`;
      const end = allDay || !scheduledEnd ? null : `${baseDate}T${scheduledEnd}:00`;
      await onSave(task.id, {
        title: title.trim(),
        priority,
        deadline: deadline || null,
        category: category.trim() || null,
        recurrence,
        reminder_offset_min: reminderOffset,
        scheduled_start: start,
        scheduled_end: end,
        description: description.trim() || null,
        location: location.trim() || null,
        color,
        all_day: allDay,
        subtasks,
      });
      onClose();
    } catch {
      setError("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const addSubtask = () => {
    const t = newSubtask.trim();
    if (!t) return;
    setSubtasks((s) => [...s, { id: newSubtaskId(), title: t.slice(0, 300), done: false }]);
    setNewSubtask("");
  };
  const toggleSubtask = (id: string) =>
    setSubtasks((s) => s.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const removeSubtask = (id: string) =>
    setSubtasks((s) => s.filter((x) => x.id !== id));

  const doneCount = subtasks.filter((s) => s.done).length;

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
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]" aria-label="Închide">
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
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white resize-none transition-all"
                />
              </div>

              {/* Description / notițe */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Notițe
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detalii, link-uri, context..."
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white resize-none transition-all"
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
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white dark:focus:bg-white/10 transition-all"
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
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white dark:focus:bg-white/10 transition-all"
                />
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Locație
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="ex: Birou, Sala 204, online..."
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white dark:focus:bg-white/10 transition-all"
                />
              </div>

              {/* Color */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <Palette className="w-3.5 h-3.5" /> Culoare
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setColor(null)}
                    aria-pressed={color === null}
                    aria-label="Fără culoare"
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-gray-400 ${color === null ? "border-[#ff6a3d]" : "border-gray-200 dark:border-white/10"}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      aria-pressed={color === c.value}
                      aria-label={c.label}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-105 ${color === c.value ? "border-gray-900 dark:border-white" : "border-transparent"}`}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              </div>

              {/* All-day */}
              <button
                type="button"
                onClick={() => setAllDay((v) => !v)}
                aria-pressed={allDay}
                className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5"
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <Sun className="w-4 h-4 text-[#f59e0b]" /> Toată ziua
                </span>
                <span className={`relative w-10 h-6 rounded-full transition-colors ${allDay ? "bg-[#ff6a3d]" : "bg-gray-300 dark:bg-white/20"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${allDay ? "translate-x-4" : ""}`} />
                </span>
              </button>

              {/* Subtasks / checklist */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  <ListChecks className="w-3.5 h-3.5" /> Subtask-uri
                  {subtasks.length > 0 && (
                    <span className="ml-auto text-[11px] font-medium text-gray-400 normal-case tracking-normal">
                      {doneCount}/{subtasks.length}
                    </span>
                  )}
                </label>
                <div className="space-y-1.5">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-white/5 px-2.5 py-1.5">
                      <input
                        type="checkbox"
                        checked={st.done}
                        onChange={() => toggleSubtask(st.id)}
                        className="w-4 h-4 rounded accent-[#ff6a3d] shrink-0"
                      />
                      <span className={`flex-1 text-sm ${st.done ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-200"}`}>
                        {st.title}
                      </span>
                      <button type="button" onClick={() => removeSubtask(st.id)} className="text-gray-400 hover:text-red-500 shrink-0" aria-label="Șterge subtask">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-1.5">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                    placeholder="Adaugă un pas..."
                    className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white dark:focus:bg-white/10 transition-all"
                  />
                  <button type="button" onClick={addSubtask} disabled={!newSubtask.trim()} className="w-9 h-9 shrink-0 rounded-xl bg-[#ff6a3d] text-white flex items-center justify-center disabled:opacity-40" aria-label="Adaugă subtask">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
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
                          ? "border-[#ff6a3d] bg-[#ff6a3d] text-white shadow-md"
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
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white dark:focus:bg-white/10 transition-all"
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

            {/* Programare */}
            <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#d24d1f]" /> Programare
              </h3>
              {allDay ? (
                <p className="text-[11px] text-gray-400">
                  Eveniment pe toată ziua — orele sunt dezactivate.
                </p>
              ) : (
              <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    <Clock className="w-3.5 h-3.5" /> Începe la
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={scheduledStart}
                      onChange={(e) => setScheduledStart(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white dark:focus:bg-white/10 transition-all"
                    />
                    {scheduledStart && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatClock(scheduledStart, timeFmt)}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    <Clock className="w-3.5 h-3.5" /> Se termină la
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={scheduledEnd}
                      onChange={(e) => setScheduledEnd(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/20 focus:border-[#ff8a63] focus:bg-white dark:focus:bg-white/10 transition-all"
                    />
                    {scheduledEnd && (
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatClock(scheduledEnd, timeFmt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400">
                Lăsați gol pentru a șterge programarea. Data se ia din Deadline.
              </p>
              </>
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
                className="flex-1 h-10 rounded-xl bg-gradient-to-r from-[#ff6a3d] to-[#3dd4a7] text-sm font-semibold text-white disabled:opacity-50 hover:from-[#ff6a3d] hover:to-[#3dd4a7] transition-all"
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
