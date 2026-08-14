"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Task, Status, Priority } from "@/types/task";
import CalendarView from "@/components/CalendarView";
import ScheduleModal from "@/components/ScheduleModal";
import EditTaskModal, { type EditableTaskFields } from "@/components/EditTaskModal";
import StatsHeader from "@/components/StatsHeader";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import CommandPalette from "@/components/CommandPalette";
import {
  Plus,
  Sparkles,
  Search,
  Download,
  X,
  Tag,
  Command,
  ChevronDown,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
  FolderGit2,
} from "lucide-react";
import { tasksToCsv } from "@/lib/csv";

function exportCSV(tasks: Task[]) {
  const blob = new Blob(["\uFEFF" + tasksToCsv(tasks)], { type: "text/csv;charset=utf-8" });
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
  const [projectTitle, setProjectTitle] = useState("Project Alpha");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
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
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, [fetchTasks]);

  // Clean pending deletions on unmount
  useEffect(() => {
    const map = pendingDeletes.current;
    return () => {
      map.forEach((tm) => clearTimeout(tm));
      map.clear();
    };
  }, []);

  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, status: newStatus } : task)));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      if (isRecurring) fetchTasks();
    } catch {
      setTasks(prev);
    }
  };

  const handleEdit = async (id: string, updates: EditableTaskFields) => {
    const prev = tasks;
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, ...updates } : task)));
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

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const copy = await res.json();
      setTasks((t) => [copy as Task, ...t]);
      toast.success("Task duplicat.");
    } catch {
      toast.error("Nu s-a putut duplica task-ul.");
    }
  };

  const handleSnooze = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const base = task.deadline?.substring(0, 10) ?? new Date().toISOString().substring(0, 10);
    const d = new Date(`${base}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().substring(0, 10);

    const prev = tasks;
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, deadline: next } : x)));
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: next }),
      });
      if (!res.ok) throw new Error();
      toast.success("Amânat cu o zi.");
    } catch {
      setTasks(prev);
      toast.error("Nu s-a putut amâna task-ul.");
    }
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
    setTasks((t) => t.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));
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
    const removed = tasks.map((t, index) => ({ task: t, index })).filter((x) => idSet.has(x.task.id));

    setTasks((t) => t.filter((task) => !idSet.has(task.id)));

    const timer = setTimeout(async () => {
      ids.forEach((id) => pendingDeletes.current.delete(id));
      try {
        const results = await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, { method: "DELETE" })));
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
    setTasks((t) => t.map((task) => (task.id === schedulingTaskId ? { ...task, ...data } : task)));
    try {
      const res = await fetch(`/api/tasks/${schedulingTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prev);
    }
    setSchedulingTaskId(null);
  };

  const categories = useMemo(
    () =>
      [...new Set(tasks.map((t) => t.category).filter((c): c is string => !!c))]
        .sort((a, b) => a.localeCompare(b, "ro"))
        .slice(0, 6),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filter === "active") result = result.filter((t) => t.status === "pending");
    else if (filter === "done") result = result.filter((t) => t.status === "done");
    else if (filter === "urgent") result = result.filter((t) => t.status === "pending" && t.priority === "high");
    else if (filter.startsWith("cat:")) {
      const cat = filter.slice(4);
      result = result.filter((t) => t.category === cat);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.category ?? "").toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [tasks, search, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1117] flex">
        <Sidebar userEmail={null} />
        <div className="flex-1 flex flex-col min-w-0 p-6 lg:p-8 animate-pulse">
          <div className="h-10 w-48 bg-white/5 rounded-xl mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="h-28 bg-white/5 rounded-2xl" />
            <div className="h-28 bg-white/5 rounded-2xl" />
            <div className="h-28 bg-white/5 rounded-2xl" />
          </div>
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e1117] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#161824] p-6 text-center shadow-2xl">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <p className="text-red-400 font-semibold text-sm">{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-4 w-full h-10 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            Reîncearcă
          </button>
        </div>
      </div>
    );
  }

  const schedulingTask = tasks.find((t) => t.id === schedulingTaskId);

  return (
    <div className="min-h-screen bg-[#0e1117] text-[#f8fafc] flex selection:bg-orange-500 selection:text-white">
      <Sidebar userEmail={userEmail} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#0c0e14]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">TaskCapture</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="sidebar" className="w-8 h-8" />
            <a
              href="/input"
              className="flex items-center gap-1 h-8 px-3 rounded-xl bg-[#f97316] text-white text-xs font-semibold shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Adaugă
            </a>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Project Bar (Matching Mockup Header) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Project Alpha Title + Jira Pill */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-6 h-6 text-orange-400" />
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {projectTitle}
                </h1>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                <span>Jira Sync Status Pill</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </div>
            </div>

            {/* Right: + Create Task, Filter, Search, ⌘K */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href="/input"
                className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white text-xs font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Task</span>
              </a>

              {/* Filter button dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-white transition-colors"
                >
                  <Filter className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>Filter</span>
                  <ChevronDown className="w-3 h-3 text-[#64748b]" />
                </button>

                {filterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#161a26] border border-white/10 shadow-2xl p-1.5 z-30 space-y-1"
                  >
                    {[
                      ["all", "Toate task-urile"],
                      ["active", "Active / Pending"],
                      ["done", "Finalizate"],
                      ["urgent", "Urgente"],
                    ].map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => {
                          setFilter(val);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          filter === val ? "bg-orange-500/20 text-orange-400 font-bold" : "text-[#cbd5e1] hover:bg-white/5"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Search Pill */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b] pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="h-9 pl-8 pr-7 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 w-32 sm:w-44 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                className="hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Paletă de comenzi (⌘K)"
              >
                <Command className="w-3.5 h-3.5 text-orange-400" />
                <kbd className="text-[10px] font-mono">⌘K</kbd>
              </button>

              <button
                onClick={() => {
                  exportCSV(tasks);
                  toast.success("CSV exportat!");
                }}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3-Widget Analytics Trio (Top Right in Mockup) */}
          <StatsHeader tasks={tasks} />

          {/* Main Views Area: Kanban Board & Project Timeline */}
          <div id="calendar-section" className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-[#10b981] font-semibold">
                  Jira Synced: 2 min ago
                </span>
              </div>

              {/* Category Quick Chips */}
              <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(filter === `cat:${cat}` ? "all" : `cat:${cat}`)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      filter === `cat:${cat}`
                        ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                        : "bg-white/[0.03] text-[#94a3b8] border-white/[0.06] hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <CalendarView
              tasks={filteredTasks}
              onToggleDone={handleToggleDone}
              onDelete={handleDelete}
              onSchedule={handleSchedule}
              onEdit={setEditingTask}
              onDuplicate={handleDuplicate}
              onSnooze={handleSnooze}
              onMoveTask={handleMoveTask}
              onBulkDone={handleBulkDone}
              onBulkDelete={handleBulkDelete}
              initialViewMode="board"
            />
          </div>
        </main>
      </div>

      <MobileNav />

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSchedulingTaskId(null);
        }}
        onSave={handleScheduleSave}
        taskTitle={schedulingTask?.title}
      />

      <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleEdit} />

      <CommandPalette
        tasks={tasks}
        onEditTask={setEditingTask}
        onExportCSV={() => {
          exportCSV(tasks);
          toast.success("CSV descărcat!");
        }}
      />
    </div>
  );
}
