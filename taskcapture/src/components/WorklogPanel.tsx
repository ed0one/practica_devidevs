"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types/task";
import { Clock, Play, Pause, Check, X, Plus, Trash2 } from "lucide-react";

interface WorklogEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description: string;
}

export default function WorklogPanel({ task }: { task: Task }) {
  const [worklogs, setWorklogs] = useState<WorklogEntry[]>(() => {
    const saved = localStorage.getItem(`worklogs_${task.id}`);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((w: any) => ({
        ...w,
        startTime: new Date(w.startTime),
        endTime: w.endTime ? new Date(w.endTime) : undefined,
      }));
    } catch {
      return [];
    }
  });
  const [activeLog, setActiveLog] = useState<WorklogEntry | null>(null);
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);

  const formatDuration = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const startTimer = () => {
    const newLog: WorklogEntry = {
      id: crypto.randomUUID(),
      taskId: task.id,
      startTime: new Date(),
      duration: 0,
      description,
    };
    setActiveLog(newLog);
    setShowForm(false);
  };

  const stopTimer = () => {
    if (!activeLog) return;
    const endTime = new Date();
    const duration = endTime.getTime() - activeLog.startTime.getTime();
    const completed = { ...activeLog, endTime, duration };
    setWorklogs((prev) => [completed, ...prev]);
    setActiveLog(null);
    localStorage.setItem(`worklogs_${task.id}`, JSON.stringify([completed, ...worklogs]));
  };

  const addManualLog = (hours: number, minutes: number, desc: string) => {
    const now = new Date();
    const start = new Date(now.getTime() - (hours * 3600000 + minutes * 60000));
    const newLog: WorklogEntry = {
      id: crypto.randomUUID(),
      taskId: task.id,
      startTime: start,
      endTime: now,
      duration: hours * 3600000 + minutes * 60000,
      description: desc,
    };
    setWorklogs((prev) => [newLog, ...prev]);
    localStorage.setItem(`worklogs_${task.id}`, JSON.stringify([newLog, ...worklogs]));
  };

  const deleteLog = (id: string) => {
    const updated = worklogs.filter((w) => w.id !== id);
    setWorklogs(updated);
    localStorage.setItem(`worklogs_${task.id}`, JSON.stringify(updated));
  };

  const totalTime = worklogs.reduce((sum, w) => sum + w.duration, 0) +
    (activeLog ? Date.now() - activeLog.startTime.getTime() : 0);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-4 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          Timp Lucrat
        </h3>
        <span className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          {formatDuration(totalTime)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {activeLog && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">
                {description || "Înregistrez..."}
              </span>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-2xl font-mono text-indigo-600"
              >
                {((Date.now() - activeLog.startTime.getTime()) / 1000).toFixed(0)}s
              </motion.div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={stopTimer}
                className="flex-1 rounded-lg bg-red-500 text-white py-2 font-medium flex items-center justify-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                Oprește
              </motion.button>
            </div>
          </motion.div>
        )}

        {!activeLog && (
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/50"
            >
              <Play className="w-4 h-4" />
              Pornește Timer
            </motion.button>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="Ore"
                      value={manualHours}
                      onChange={(e) => setManualHours(parseInt(e.target.value) || 0)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Minute"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Pe ce ai lucrat?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        addManualLog(manualHours, manualMinutes, description);
                        setManualHours(0);
                        setManualMinutes(0);
                        setDescription("");
                        setShowForm(false);
                      }}
                      className="flex-1 rounded-lg bg-indigo-600 text-white py-2 font-medium"
                    >
                      Adaugă
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowForm(false);
                        setManualHours(0);
                        setManualMinutes(0);
                        setDescription("");
                      }}
                      className="flex-1 rounded-lg border border-gray-300 bg-white text-gray-700 py-2 font-medium"
                    >
                      Anulează
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {worklogs.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Recent Entries
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {worklogs.slice(0, 10).map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  layout
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {log.description || "Work session"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(log.duration)} •{" "}
                      {log.startTime.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                      –{" "}
                      {log.endTime?.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }) || "now"}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteLog(log.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}