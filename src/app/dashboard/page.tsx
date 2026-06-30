"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Task, Status } from "@/types/task";
import CalendarView from "@/components/CalendarView";
import ScheduleModal from "@/components/ScheduleModal";
import EditTaskModal from "@/components/EditTaskModal";
import StatsHeader from "@/components/StatsHeader";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Plus, Sparkles, LogOut, Search, Download, X } from "lucide-react";

function exportCSV(tasks: Task[]) {
  const header = ["Titlu", "Prioritate", "Status", "Deadline", "Categorie", "Creat la"];
  const rows = tasks.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.priority,
    t.status,
    t.deadline ? t.deadline.substring(0, 10) : "",
    t.category ?? "",
    t.created_at.substring(0, 10),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskcapture-${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error("Eroare la încărcarea task-urilor");
      const data = await res.json();
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    createClient().auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, [fetchTasks]);

  const handleDelete = async (id: string) => {
    const prev = tasks;
    setTasks((t) => t.filter((task) => task.id !== id));
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) { setTasks(prev); toast.error("Nu s-a putut șterge task-ul."); }
    else toast.success("Task șters.");
  };

  const handleToggleDone = async (id: string, newStatus: Status) => {
    const prev = tasks;
    setTasks((t) => t.map((task) => task.id === id ? { ...task, status: newStatus } : task));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch { setTasks(prev); }
  };

  const handleEdit = async (
    id: string,
    updates: Partial<Pick<Task, "title" | "priority" | "deadline" | "category">>
  ) => {
    const prev = tasks;
    setTasks((t) => t.map((task) => task.id === id ? { ...task, ...updates } : task));
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      setTasks(prev);
      throw new Error("Eroare la salvare");
    }
    toast.success("Task actualizat.");
  };

  const handleSchedule = (id: string) => {
    setSchedulingTaskId(id);
    setScheduleModalOpen(true);
  };

  const handleScheduleSave = async (data: {
    scheduled_date: string;
    scheduled_start: string;
    scheduled_end: string;
  }) => {
    if (!schedulingTaskId) return;
    const prev = tasks;
    setTasks((t) => t.map((task) => task.id === schedulingTaskId ? { ...task, ...data } : task));
    try {
      const res = await fetch(`/api/tasks/${schedulingTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
    } catch { setTasks(prev); }
    setSchedulingTaskId(null);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bună dimineața";
    if (h < 18) return "Bună ziua";
    return "Bună seara";
  };

  const todayStr = new Date().toLocaleDateString("ro-RO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const filteredTasks = search.trim()
    ? tasks.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.category ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : tasks;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8fb]">
        <div className="text-center">
          <div className="relative mx-auto w-14 h-14 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent"
            />
          </div>
          <p className="text-sm text-gray-400 font-medium">Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8fb] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-100 bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">⚠️</div>
          <p className="text-red-600 font-semibold text-sm">{error}</p>
          <button onClick={fetchTasks} className="mt-4 w-full h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
            Reîncearcă
          </button>
        </div>
      </div>
    );
  }

  const schedulingTask = tasks.find((t) => t.id === schedulingTaskId);

  return (
    <div className="min-h-screen bg-[#f8f8fb] flex">
      <Sidebar userEmail={userEmail} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">TaskCapture</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/input" className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> Adaugă
            </a>
            <button
              onClick={async () => { const s = createClient(); await s.auth.signOut(); window.location.href = "/"; }}
              className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {greeting()}{userEmail ? `, ${userEmail.split("@")[0]}` : ""}! 👋
            </h2>
            <p className="text-sm text-gray-400 mt-0.5 capitalize">{todayStr}</p>
          </motion.div>

          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-5"
              >
                <Sparkles className="w-10 h-10 text-indigo-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nu ai task-uri încă</h3>
              <p className="text-gray-400 text-sm max-w-xs mb-6">
                Scrie ce ai de făcut în limbaj natural și AI-ul extrage task-urile automat.
              </p>
              <motion.a
                href="/input"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-200"
              >
                <Plus className="w-4 h-4" /> Adaugă primul task
              </motion.a>
            </motion.div>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
                <StatsHeader tasks={tasks} />
              </motion.div>

              {/* Search + export toolbar */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Caută task-uri..."
                    className="w-full h-9 pl-9 pr-8 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 transition-all"
                  />
                  <AnimatePresence>
                    {search && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {search && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-400"
                  >
                    {filteredTasks.length} rezultate
                  </motion.span>
                )}

                <button
                  onClick={() => { exportCSV(tasks); toast.success("CSV descărcat!"); }}
                  className="ml-auto flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Exportă CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <CalendarView
                  tasks={filteredTasks}
                  onToggleDone={handleToggleDone}
                  onDelete={handleDelete}
                  onSchedule={handleSchedule}
                  onEdit={setEditingTask}
                />
              </motion.div>
            </>
          )}
        </main>
      </div>

      <MobileNav />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => { setScheduleModalOpen(false); setSchedulingTaskId(null); }}
        onSave={handleScheduleSave}
        taskTitle={schedulingTask?.title}
      />

      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEdit}
      />
    </div>
  );
}
