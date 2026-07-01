"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Calendar, ArrowRight } from "lucide-react";
import { useTimeFormat, formatClock } from "@/lib/time-format";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    scheduled_date: string;
    scheduled_start: string;
    scheduled_end: string;
  }) => void;
  taskTitle?: string;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(min: number): string {
  const clamped = Math.max(0, Math.min(min, 23 * 60 + 59));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

function localTodayStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const START_PRESETS: { label: string; time: string }[] = [
  { label: "Dimineața", time: "09:00" },
  { label: "Prânz", time: "12:00" },
  { label: "După-amiaza", time: "14:00" },
  { label: "Seara", time: "19:00" },
];

const DURATION_PRESETS: { label: string; min: number }[] = [
  { label: "30 min", min: 30 },
  { label: "1 oră", min: 60 },
  { label: "2 ore", min: 120 },
  { label: "4 ore", min: 240 },
];

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  taskTitle,
}: ScheduleModalProps) {
  const timeFmt = useTimeFormat();
  const [date, setDate] = useState(localTodayStr());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const durationMin = toMin(endTime) - toMin(startTime);

  // schimbarea orei de start păstrează durata curentă
  const changeStart = (newStart: string) => {
    const dur = durationMin > 0 ? durationMin : 60;
    setStartTime(newStart);
    setEndTime(toHHMM(toMin(newStart) + dur));
    setError(null);
  };

  const applyDuration = (min: number) => {
    setEndTime(toHHMM(toMin(startTime) + min));
    setError(null);
  };

  const handleSave = () => {
    if (toMin(endTime) <= toMin(startTime)) {
      setError("Ora de sfârșit trebuie să fie după ora de început.");
      return;
    }
    onSave({
      scheduled_date: date,
      scheduled_start: `${date}T${startTime}:00`,
      scheduled_end: `${date}T${endTime}:00`,
    });
    setError(null);
    onClose();
  };

  const durationLabel =
    durationMin <= 0 ? null :
    durationMin < 60 ? `${durationMin} min` :
    durationMin % 60 === 0 ? `${durationMin / 60} ${durationMin === 60 ? "oră" : "ore"}` :
    `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`;

  const summaryDate = (() => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("ro-RO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  })();

  const today = localTodayStr();
  const tomorrow = localTodayStr(1);

  const inputCls =
    "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:bg-white dark:focus:bg-white/10 transition-all";
  const chipCls = (active: boolean) =>
    `px-3 h-8 rounded-lg text-xs font-semibold border transition-all ${
      active
        ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
        : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600"
    }`;

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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Programează task-ul"
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#16161f] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 dark:text-gray-100">Programează task-ul</h2>
                {taskTitle && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{taskTitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Închide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              {/* Data */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5" /> Data
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button type="button" onClick={() => { setDate(today); setError(null); }} className={chipCls(date === today)}>
                    Azi
                  </button>
                  <button type="button" onClick={() => { setDate(tomorrow); setError(null); }} className={chipCls(date === tomorrow)}>
                    Mâine
                  </button>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setError(null); }}
                  className={inputCls}
                />
              </div>

              {/* Ora de start */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" /> Începe la
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {START_PRESETS.map((p) => (
                    <button
                      key={p.time}
                      type="button"
                      onClick={() => changeStart(p.time)}
                      className={chipCls(startTime === p.time)}
                    >
                      {p.label} · {formatClock(p.time, timeFmt)}
                    </button>
                  ))}
                </div>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => changeStart(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Durata */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <ArrowRight className="w-3.5 h-3.5" /> Durata
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DURATION_PRESETS.map((p) => (
                    <button
                      key={p.min}
                      type="button"
                      onClick={() => applyDuration(p.min)}
                      className={chipCls(durationMin === p.min)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); setError(null); }}
                  className={inputCls}
                  aria-label="Ora de sfârșit"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg px-3 py-2">{error}</p>
              )}
            </div>

            {/* Sumar + acțiuni */}
            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03] shrink-0 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                <span className="font-semibold">{summaryDate}</span>
                {" · "}
                {formatClock(startTime, timeFmt)} – {formatClock(endTime, timeFmt)}
                {durationLabel && (
                  <span className="text-gray-400"> ({durationLabel})</span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200/40 dark:shadow-none hover:from-indigo-500 hover:to-violet-500 transition-all"
                >
                  Salvează
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
