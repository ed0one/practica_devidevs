"use client";

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Task, Status, ViewMode, BoardColumn } from "@/types/task";
import BoardView from "@/components/BoardView";
import GanttView from "@/components/GanttView";
import CalendarView from "@/components/CalendarView";
import TaskList from "@/components/TaskList";
import ReportsView from "@/components/ReportsView";
import ViewSwitcher, { isViewMode } from "@/components/ViewSwitcher";
import ScheduleModal from "@/components/ScheduleModal";
import EditTaskModal, { type EditableTaskFields } from "@/components/EditTaskModal";
import CreateTaskModal, { type NewTaskData } from "@/components/CreateTaskModal";
import StatsHeader from "@/components/StatsHeader";
import MobileNav from "@/components/MobileNav";
import Sidebar, { initialsOf, nameFromEmail } from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import {
  Plus,
  Sparkles,
  Search,
  Download,
  X,
  Command,
  ChevronDown,
  Filter,
  FolderGit2,
  Link2,
  Terminal,
} from "lucide-react";
import { tasksToCsv } from "@/lib/csv";
import { addDaysStr, localDateStr } from "@/lib/dates";
import { boardColumnLabel } from "@/lib/board";

function exportCSV(tasks: Task[]) {
  const blob = new Blob(["﻿" + tasksToCsv(tasks)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskcapture-${localDateStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const FILTERS: [string, string][] = [
  ["all", "Toate task-urile"],
  ["active", "Active"],
  ["done", "Finalizate"],
  ["urgent", "Urgente"],
];

// Pastila Jira arată ce e real: task-urile care au deja o cheie Jira.
// Sincronizarea propriu-zisă rulează din CLI (src/scripts/jira-sync.ts).
function JiraPill({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const linked = tasks.filter((t) => t.jira_issue_key);
  const label = linked.length > 0 ? `Jira · ${linked.length} legate` : "Jira · nelegat";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium font-mono transition-colors ${
          linked.length > 0
            ? "bg-[#38bdf8]/15 border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8]/25"
            : "bg-white/[0.04] border-white/10 text-[#94a3b8] hover:text-white"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${linked.length > 0 ? "bg-[#38bdf8] animate-pulse" : "bg-[#64748b]"}`} />
        <span>{label}</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-[#161a26] border border-white/10 shadow-2xl p-3 z-30 space-y-2">
            {linked.length > 0 ? (
              <ul className="space-y-1">
                {linked.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-xs text-[#cbd5e1] min-w-0">
                    <Link2 className="w-3 h-3 text-[#38bdf8] shrink-0" />
                    <span className="font-mono text-[#38bdf8] shrink-0">{t.jira_issue_key}</span>
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
                {linked.length > 5 && <li className="text-[11px] text-[#64748b]">+ încă {linked.length - 5}</li>}
              </ul>
            ) : (
              <p className="text-xs text-[#cbd5e1]">Niciun task nu are încă o cheie Jira.</p>
            )}
            <p className="text-[11px] text-[#64748b] flex items-start gap-1.5 pt-2 border-t border-white/[0.06]">
              <Terminal className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                Sincronizarea rulează din CLI: <code className="font-mono text-[#94a3b8]">npx tsx src/scripts/jira-sync.ts</code>
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0e1117] flex">
      <Sidebar loading />
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

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const viewMode: ViewMode = isViewMode(viewParam) ? viewParam : "overview";
  const setViewMode = useCallback(
    (mode: ViewMode) => router.replace(mode === "overview" ? "/dashboard" : `/dashboard?view=${mode}`, { scroll: false }),
    [router]
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState<{ open: boolean; column: BoardColumn }>({ open: false, column: "todo" });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

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
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch inițial la mount — setState-ul se întâmplă după await, nu sincron
    // în corpul effect-ului (fals pozitiv al regulii).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const u = data.user;
        if (!u) return;
        const email = u.email ?? "";
        const meta = (u.user_metadata?.full_name as string | undefined)?.trim();
        setUser({ email, name: meta || nameFromEmail(email) });
      });
  }, [fetchTasks]);

  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const map = pendingDeletes.current;
    return () => {
      map.forEach((tm) => clearTimeout(tm));
      map.clear();
    };
  }, []);

  const restoreTask = useCallback((task: Task, index: number) => {
    setTasks((t) => {
      if (t.some((x) => x.id === task.id)) return t;
      const copy = [...t];
      copy.splice(Math.min(index, copy.length), 0, task);
      return copy;
    });
  }, []);

  const patchTask = useCallback(async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let message = "Eroare la salvare";
      try {
        const d = await res.json();
        if (typeof d.error === "string") message = d.error;
      } catch {
        /* corp gol */
      }
      throw new Error(message);
    }
    return (await res.json()) as Task;
  }, []);

  const handleCreateTask = async (data: NewTaskData) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: data }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || "Eroare la creare task");
    }
    const d = await res.json();
    const created: Task[] = d.tasks ?? [];
    setTasks((prev) => [...created, ...prev]);
    toast.success(`Task creat în „${boardColumnLabel(data.board_column)}".`);
  };

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
    setTasks((t) =>
      t.map((task) =>
        task.id === id
          ? { ...task, status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null }
          : task
      )
    );
    try {
      const updated = await patchTask(id, { status: newStatus });
      setTasks((t) => t.map((task) => (task.id === id ? { ...task, ...updated } : task)));
      if (isRecurring) fetchTasks();
    } catch (err) {
      setTasks(prev);
      toast.error(err instanceof Error ? err.message : "Nu s-a putut actualiza task-ul.");
    }
  };

  const handleEdit = async (id: string, updates: EditableTaskFields) => {
    const prev = tasks;
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, ...updates } : task)));
    try {
      const updated = await patchTask(id, updates);
      setTasks((t) => t.map((task) => (task.id === id ? { ...task, ...updated } : task)));
      toast.success("Task actualizat.");
    } catch (err) {
      setTasks(prev);
      throw err;
    }
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

  // Amână deadline-ul cu o zi, în data locală (fără round-trip UTC).
  const handleSnooze = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const base = task.deadline?.substring(0, 10) ?? localDateStr();
    const next = addDaysStr(base, 1);
    const prev = tasks;
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, deadline: next } : x)));
    try {
      await patchTask(id, { deadline: next });
      toast.success("Amânat cu o zi.");
    } catch {
      setTasks(prev);
      toast.error("Nu s-a putut amâna task-ul.");
    }
  };

  // Drag & drop pe Kanban: se schimbă DOAR coloana, nu categoria/prioritatea.
  const handleMoveTask = async (taskId: string, targetCol: BoardColumn) => {
    const prev = tasks;
    setTasks((t) => t.map((x) => (x.id === taskId ? { ...x, board_column: targetCol } : x)));
    try {
      await patchTask(taskId, { board_column: targetCol });
    } catch (err) {
      setTasks(prev);
      toast.error(err instanceof Error ? err.message : "Nu s-a putut muta task-ul.");
    }
  };

  const handleBulkDone = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const prev = tasks;
    const stamp = new Date().toISOString();
    setTasks((t) => t.map((task) => (idSet.has(task.id) ? { ...task, status: "done" as Status, completed_at: stamp } : task)));
    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "done", ids }),
      });
      if (!res.ok) throw new Error();
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
        const res = await fetch("/api/tasks/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", ids }),
        });
        if (!res.ok) throw new Error();
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

  const handleScheduleSave = async (data: { scheduled_date: string; scheduled_start: string; scheduled_end: string }) => {
    if (!schedulingTaskId) return;
    const id = schedulingTaskId;
    const prev = tasks;
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, ...data } : task)));
    try {
      await patchTask(id, data);
      toast.success("Task programat.");
    } catch {
      setTasks(prev);
      toast.error("Nu s-a putut programa task-ul.");
    }
    setSchedulingTaskId(null);
  };

  const openCreate = useCallback((column: BoardColumn = "todo") => setCreateModal({ open: true, column }), []);
  const doExport = useCallback(() => {
    exportCSV(tasks);
    toast.success("CSV exportat.");
  }, [tasks]);

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

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e1117] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#161824] p-6 text-center shadow-2xl">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">⚠️</div>
          <p className="text-red-400 font-semibold text-sm">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchTasks();
            }}
            className="mt-4 w-full h-10 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            Reîncearcă
          </button>
        </div>
      </div>
    );
  }

  const schedulingTask = tasks.find((t) => t.id === schedulingTaskId);
  const initials = user ? initialsOf(user.name) : "TC";
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const doneCount = tasks.length - pendingCount;
  const activeCategory = filter.startsWith("cat:") ? filter.slice(4) : null;
  const title = activeCategory ?? "Toate task-urile";
  const activeFilterLabel = FILTERS.find(([v]) => v === filter)?.[1];

  const statusLine = (
    <div className="flex items-center gap-2 text-[11px] font-mono text-[#94a3b8]">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span>
        <span className="text-[#10b981] font-semibold">{pendingCount} active</span> · {doneCount} finalizate
      </span>
      {filteredTasks.length !== tasks.length && <span className="text-[#64748b]">· {filteredTasks.length} afișate</span>}
    </div>
  );

  const boardProps = {
    tasks: filteredTasks,
    onToggleDone: handleToggleDone,
    onDelete: handleDelete,
    onEdit: setEditingTask,
    onMoveTask: handleMoveTask,
    onQuickAdd: openCreate,
    onBulkDone: handleBulkDone,
    userInitials: initials,
  };

  return (
    <div className="min-h-screen bg-[#0e1117] text-[#f8fafc] flex selection:bg-orange-500 selection:text-white">
      <Sidebar userEmail={user?.email} displayName={user?.name} activeView={viewMode} loading={!user} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-[#0c0e14]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">TaskCapture</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCreate()}
              className="flex items-center gap-1 h-8 px-3 rounded-xl bg-[#f97316] text-white text-xs font-semibold shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Task
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 w-full max-w-[1800px] mx-auto space-y-5">
          {/* Bara de titlu (ca în mockup): titlu + pastilă Jira | Creează, Filtru, Caută, ⌘K, export */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <FolderGit2 className="w-6 h-6 text-orange-400 shrink-0" />
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">{title}</h1>
              </div>
              <JiraPill tasks={tasks} />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => openCreate()}
                className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white text-xs font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Creează task</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen((o) => !o)}
                  aria-expanded={filterDropdownOpen}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                    filter !== "all"
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-300"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filter === "all" ? "Filtru" : activeFilterLabel ?? activeCategory}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
                {filterDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setFilterDropdownOpen(false)} aria-hidden />
                    <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-[#161a26] border border-white/10 shadow-2xl p-1.5 z-30 space-y-1">
                      {FILTERS.map(([val, lbl]) => (
                        <button
                          type="button"
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
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b] pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Caută"
                  aria-label="Caută task-uri"
                  className="h-9 pl-8 pr-7 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 w-32 sm:w-44 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white"
                    aria-label="Șterge căutarea"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                className="hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Paletă de comenzi (⌘K)"
              >
                <Command className="w-3.5 h-3.5 text-orange-400" />
                <kbd className="text-[10px] font-mono">⌘K</kbd>
              </button>

              <button
                type="button"
                onClick={doExport}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Export CSV"
                aria-label="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Vederi + categorii */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
            <div className="flex items-center gap-3 flex-wrap">
              {categories.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar" aria-label="Categorii">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setFilter(filter === `cat:${cat}` ? "all" : `cat:${cat}`)}
                      aria-pressed={filter === `cat:${cat}`}
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
              )}
              {viewMode !== "overview" && statusLine}
            </div>
          </div>

          {viewMode === "overview" ? (
            // Panoul general, ca în mockup: Kanban în stânga, widgeturi + cronologie în dreapta.
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-5">
              <section className="min-w-0" aria-label="Kanban">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="font-display text-lg font-bold text-white tracking-tight">Kanban</h2>
                  {statusLine}
                </div>
                <BoardView {...boardProps} compact />
              </section>
              <aside className="min-w-0 space-y-5" aria-label="Statistici și cronologie">
                <StatsHeader tasks={tasks} layout="column" />
                <GanttView tasks={filteredTasks} onEdit={setEditingTask} userInitials={initials} compact />
              </aside>
            </div>
          ) : (
            <>
              {viewMode !== "reports" && <StatsHeader tasks={tasks} />}
              {viewMode === "board" && <BoardView {...boardProps} />}
              {viewMode === "timeline" && <GanttView tasks={filteredTasks} onEdit={setEditingTask} userInitials={initials} />}
              {(viewMode === "week" || viewMode === "day") && (
                <CalendarView
                  tasks={filteredTasks}
                  mode={viewMode}
                  currentDate={calendarDate}
                  onDateChange={setCalendarDate}
                  onToggleDone={handleToggleDone}
                  onDelete={handleDelete}
                  onSchedule={handleSchedule}
                  onEdit={setEditingTask}
                />
              )}
              {viewMode === "list" && (
                <TaskList
                  tasks={filteredTasks}
                  onToggleDone={handleToggleDone}
                  onDelete={handleDelete}
                  onSchedule={handleSchedule}
                  onEdit={setEditingTask}
                  onDuplicate={handleDuplicate}
                  onSnooze={handleSnooze}
                  onBulkDone={handleBulkDone}
                  onBulkDelete={handleBulkDelete}
                />
              )}
              {viewMode === "reports" && <ReportsView tasks={tasks} onExportCSV={doExport} />}
            </>
          )}
        </main>
      </div>

      <MobileNav activeView={viewMode} />

      <CreateTaskModal
        isOpen={createModal.open}
        onClose={() => setCreateModal((m) => ({ ...m, open: false }))}
        onCreate={handleCreateTask}
        defaultBoardColumn={createModal.column}
        defaultCategory={activeCategory ?? ""}
      />

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

      <CommandPalette tasks={tasks} onEditTask={setEditingTask} onExportCSV={doExport} onCreateTask={() => openCreate()} />
    </div>
  );
}

export default function DashboardPage() {
  // useSearchParams cere un Suspense boundary la prerender.
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}
