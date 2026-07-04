"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import ThemeToggle from "@/components/ThemeToggle";
import CommandPalette from "@/components/CommandPalette";
import { Plus, Sparkles, Search, Download, X, Tag, Command } from "lucide-react";
import { Priority } from "@/types/task";
import { tasksToCsv } from "@/lib/csv";

function exportCSV(tasks: Task[]) {
  const blob = new Blob(["﻿" + tasksToCsv(tasks)], { type: "text/csv;charset=utf-8" });
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
  const [filter, setFilter] = useState<string>("all");

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
    // Fetch inițial la mount — setState-ul se întâmplă în callback async, nu
    // sincron în corpul effect-ului (fals pozitiv al regulii).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
    createClient().auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, [fetchTasks]);

  // Curăță ștergerile în așteptare la demontare (evită setState după unmount).
  useEffect(() => {
    const map = pendingDeletes.current;
    return () => {
      map.forEach((tm) => clearTimeout(tm));
      map.clear();
    };
  }, []);

  // Ștergeri în așteptare: id → timeout. DELETE-ul real se execută după 5s,
  // lăsând timp pentru "Anulează".
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Reinserează un task șters la poziția lui originală (dacă nu e deja prezent).
  const restoreTask = useCallback((task: Task, index: number) => {
    setTasks((t) => {
      if (t.some((x) => x.id === task.id)) return t;
      const copy = [...t];
      copy.splice(Math.min(index, copy.length), 0, task);
      return copy;
    });
  }, []);

  const handleDelete = (id: string) => {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    const removed = tasks[index];

    setTasks((t) => t.filter((task) => task.id !== id));

    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(id);
      try {
        const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
      } catch {
        restoreTask(removed, index);
        toast.error("Nu s-a putut șterge task-ul.");
      }
    }, 5000);
    pendingDeletes.current.set(id, timer);

    toast("Task șters.", {
      action: {
        label: "Anulează",
        onClick: () => {
          const tm = pendingDeletes.current.get(id);
          if (tm) clearTimeout(tm);
          pendingDeletes.current.delete(id);
          restoreTask(removed, index);
        },
      },
      duration: 5000,
    });
  };

  const handleToggleDone = async (id: string, newStatus: Status) => {
    const prev = tasks;
    const target = tasks.find((t) => t.id === id);
    const isRecurring = newStatus === "done" && target?.recurrence && target.recurrence !== "none";
    setTasks((t) => t.map((task) => task.id === id ? { ...task, status: newStatus } : task));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      // Task recurent finalizat → serverul a creat următoarea apariție; o aducem.
      if (isRecurring) fetchTasks();
    } catch { setTasks(prev); }
  };

  const handleEdit = async (
    id: string,
    updates: Partial<Pick<Task, "title" | "priority" | "deadline" | "category" | "recurrence" | "reminder_offset_min" | "scheduled_start" | "scheduled_end">>
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

  const handleMoveTask = async (taskId: string, targetCol: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updates: { status?: Status; priority?: Priority } = {};
    if (targetCol === "done") {
      if (task.status === "done") return;
      updates.status = "done";
    } else {
      updates.priority = targetCol as Priority;
      if (task.status === "done") updates.status = "pending";
    }

    const prev = tasks;
    setTasks((t) => t.map((task) => task.id === taskId ? { ...task, ...updates } : task));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      if (updates.status === "done" && task.recurrence && task.recurrence !== "none") fetchTasks();
    } catch {
      setTasks(prev);
      toast.error("Nu s-a putut muta task-ul.");
    }
  };

  const handleBulkDone = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const prev = tasks;
    setTasks((t) => t.map((task) => (idSet.has(task.id) ? { ...task, status: "done" as Status } : task)));
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "done" }),
          })
        )
      );
      if (results.some((r) => !r.ok)) throw new Error();
      toast.success(`${ids.length} task-uri marcate ca finalizate.`);
    } catch {
      setTasks(prev);
      toast.error("Nu s-au putut actualiza task-urile.");
    }
  };

  const handleBulkDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const removed = tasks
      .map((t, index) => ({ task: t, index }))
      .filter((x) => idSet.has(x.task.id));

    setTasks((t) => t.filter((task) => !idSet.has(task.id)));

    const timer = setTimeout(async () => {
      ids.forEach((id) => pendingDeletes.current.delete(id));
      try {
        const results = await Promise.all(
          ids.map((id) => fetch(`/api/tasks/${id}`, { method: "DELETE" }))
        );
        if (results.some((r) => !r.ok)) throw new Error();
      } catch {
        [...removed].sort((a, b) => a.index - b.index).forEach(({ task, index }) => restoreTask(task, index));
        toast.error("Unele task-uri nu au putut fi șterse.");
      }
    }, 5000);
    ids.forEach((id) => pendingDeletes.current.set(id, timer));

    toast(`${ids.length} task-uri șterse.`, {
      action: {
        label: "Anulează",
        onClick: () => {
          clearTimeout(timer);
          ids.forEach((id) => pendingDeletes.current.delete(id));
          [...removed].sort((a, b) => a.index - b.index).forEach(({ task, index }) => restoreTask(task, index));
        },
      },
      duration: 5000,
    });
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

  // Categorii distincte pentru chips (max 6, alfabetic)
  const categories = useMemo(
    () =>
      [...new Set(tasks.map((t) => t.category).filter((c): c is string => !!c))]
        .sort((a, b) => a.localeCompare(b, "ro"))
        .slice(0, 6),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // filtru rapid
    if (filter === "active") result = result.filter((t) => t.status === "pending");
    else if (filter === "done") result = result.filter((t) => t.status === "done");
    else if (filter === "urgent") result = result.filter((t) => t.status === "pending" && t.priority === "high");
    else if (filter.startsWith("cat:")) {
      const cat = filter.slice(4);
      result = result.filter((t) => t.category === cat);
    }

    // căutare text
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.category ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [tasks, search, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0f] flex">
        <Sidebar userEmail={null} />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 max-w-5xl w-full mx-auto animate-pulse">
            {/* Greeting skeleton */}
            <div className="mb-6 space-y-2">
              <div className="h-7 w-64 bg-gray-200/60 dark:bg-white/5 rounded-xl" />
              <div className="h-4 w-40 bg-gray-200/60 dark:bg-white/5 rounded-xl" />
            </div>
            {/* Stat cards skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200/60 dark:bg-white/5 rounded-2xl" />
              ))}
            </div>
            {/* Wide cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="h-28 bg-gray-200/60 dark:bg-white/5 rounded-2xl" />
              <div className="h-28 bg-gray-200/60 dark:bg-white/5 rounded-2xl" />
            </div>
            {/* Toolbar skeleton */}
            <div className="h-10 w-full max-w-sm bg-gray-200/60 dark:bg-white/5 rounded-xl mb-4" />
            {/* Task list skeleton */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200/60 dark:bg-white/5 rounded-2xl" />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] dark:bg-[#0a0a0f] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-100 dark:border-red-500/20 bg-white dark:bg-[#16161f] p-6 text-center shadow-xl">
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
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0a0a0f] flex">
      <Sidebar userEmail={userEmail} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#0c0c14]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff6a3d] to-[#3dd4a7] flex items-center justify-center shadow-md shadow-[#ff6a3d]/20">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">TaskCapture</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="sidebar" className="w-8 h-8" />
            <a href="/input" className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-[#ff6a3d] to-[#3dd4a7] text-white text-xs font-semibold shadow-md shadow-[#ff6a3d]/20">
              <Plus className="w-3.5 h-3.5" /> Adaugă
            </a>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              {greeting()}{userEmail ? `, ${userEmail.split("@")[0]}` : ""}
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
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-100 to-[#3dd4a7]/20 flex items-center justify-center mb-5"
              >
                <Sparkles className="w-10 h-10 text-[#ff8a63]" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Nu ai task-uri încă</h3>
              <p className="text-gray-400 text-sm max-w-xs mb-6">
                Scrie ce ai de făcut în limbaj natural și AI-ul extrage task-urile automat.
              </p>
              <motion.a
                href="/input"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-[#ff6a3d] to-[#3dd4a7] text-white text-sm font-semibold shadow-lg shadow-orange-200"
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
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Caută task-uri"
                    placeholder="Caută task-uri..."
                    className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161f] shadow-sm text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/15 focus:border-[#ff6a3d] transition-all"
                  />
                  <AnimatePresence>
                    {search && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSearch("")}
                        aria-label="Șterge căutarea"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a3d]"
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
                  onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                  className="ml-auto hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161f] text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  title="Paletă de comenzi (⌘K)"
                >
                  <Command className="w-3.5 h-3.5" />
                  <kbd className="text-[10px] font-bold">K</kbd>
                </button>

                <button
                  onClick={() => { exportCSV(tasks); toast.success("CSV descărcat!"); }}
                  className="ml-auto sm:ml-0 flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16161f] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  title="Exportă CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </motion.div>

              {/* Filtre rapide */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 mb-4"
              >
                {(
                  [
                    ["all", "Toate"],
                    ["active", "Active"],
                    ["done", "Finalizate"],
                    ["urgent", "Urgente"],
                  ] as [string, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={`shrink-0 h-8 px-3.5 rounded-lg text-xs font-semibold transition-all ${
                      filter === value
                        ? "bg-[#ff6a3d] text-white shadow-sm"
                        : "bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#ff8a63] hover:text-[#d24d1f]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {categories.map((cat) => {
                  const value = `cat:${cat}`;
                  return (
                    <button
                      key={value}
                      onClick={() => setFilter(filter === value ? "all" : value)}
                      aria-pressed={filter === value}
                      className={`shrink-0 h-8 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        filter === value
                          ? "bg-[#ff6a3d] text-white shadow-sm"
                          : "bg-white dark:bg-[#16161f] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#ff8a63] hover:text-[#d24d1f]"
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      {cat}
                    </button>
                  );
                })}
              </motion.div>

              <motion.div id="calendar-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <CalendarView
                  tasks={filteredTasks}
                  onToggleDone={handleToggleDone}
                  onDelete={handleDelete}
                  onSchedule={handleSchedule}
                  onEdit={setEditingTask}
                  onMoveTask={handleMoveTask}
                  onBulkDone={handleBulkDone}
                  onBulkDelete={handleBulkDelete}
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

      <CommandPalette
        tasks={tasks}
        onEditTask={setEditingTask}
        onExportCSV={() => { exportCSV(tasks); toast.success("CSV descărcat!"); }}
      />
    </div>
  );
}
