"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WorklogEntry } from "@/types/task";
import {
  Clock,
  ChevronDown,
  Plus,
  Trash2,
  Timer,
} from "lucide-react";

interface WorklogPanelProps {
  taskId: string;
  worklogs: WorklogEntry[];
  totalTimeSpent: number;
  onAddWorklog: (taskId: string, data: { time_spent: number; description: string; date: string }) => void;
  onDeleteWorklog?: (worklogId: string) => void;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDateRO(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
  });
}

export default function WorklogPanel({
  taskId,
  worklogs,
  totalTimeSpent,
  onAddWorklog,
  onDeleteWorklog,
}: WorklogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = () => {
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) return;

    onAddWorklog(taskId, {
      time_spent: totalMinutes,
      description,
      date,
    });

    setHours(1);
    setMinutes(0);
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setIsAdding(false);
  };

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[11px] text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
      >
        <Timer className="w-3 h-3" />
        <span>{formatMinutes(totalTimeSpent)}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-indigo-200">
              {worklogs.length === 0 && !isAdding && (
                <p className="text-[11px] text-gray-400 py-1">
                  Nicio oră înregistrată
                </p>
              )}

              {worklogs.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center justify-between gap-2 rounded-lg bg-gray-50/80 px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Clock className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-gray-700">
                      {formatMinutes(entry.time_spent)}
                    </span>
                    {entry.description && (
                      <span className="text-[11px] text-gray-500 truncate">
                        {entry.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-gray-400">
                      {formatDateRO(entry.date)}
                    </span>
                    {onDeleteWorklog && (
                      <button
                        onClick={() => onDeleteWorklog(entry.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {isAdding ? (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3 space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-gray-600 w-12">
                      Timp
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={hours}
                        onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-14 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-center focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                      />
                      <span className="text-[11px] text-gray-500">h</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        step={15}
                        value={minutes}
                        onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-14 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-center focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                      />
                      <span className="text-[11px] text-gray-500">m</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-gray-600 w-12">
                      Data
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-gray-600 w-12">
                      Detalii
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ce ai lucrat?"
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setIsAdding(false)}
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Anulează
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-1 text-[11px] font-semibold text-white"
                    >
                      Salvează
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/30 px-2.5 py-1.5 text-[11px] font-medium text-indigo-500 hover:bg-indigo-50/60 transition-colors w-full"
                >
                  <Plus className="w-3 h-3" />
                  Adaugă ore
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
