"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Status } from "@/types/task";
import CalendarView from "@/components/CalendarView";
import ScheduleModal from "@/components/ScheduleModal";
import StatsHeader from "@/components/StatsHeader";
import { Plus, Sparkles, LogOut, CheckCircle2, HelpCircle } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
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
  }, [fetchTasks]);

  const handleToggleDone = async (id: string, newStatus: Status) => {
    const prev = tasks;
    setTasks((t) =>
      t.map((task) => (task.id === id ? { ...task, status: newStatus } : task))
    );

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Eroare la actualizare");
    } catch {
      setTasks(prev);
    }
  };

  const handleAddWorklog = async (
    taskId: string,
    data: { time_spent: number; description: string; date: string }
  ) => {
    try {
      const res = await fetch("/api/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, ...data }),
      });
      if (!res.ok) throw new Error("Eroare la salvarea worklog-ului");
      const { worklog } = await res.json();

      setTasks((t) =>
        t.map((task) => {
          if (task.id !== taskId) return task;
          const newWorklogs = [...(task.worklogs || []), worklog];
          const totalTime = newWorklogs.reduce((sum, w) => sum + w.time_spent, 0);
          return { ...task, worklogs: newWorklogs, total_time_spent: totalTime };
        })
      );
    } catch (err) {
      console.error("Failed to add worklog:", err);
    }
  };

  const handleDeleteWorklog = async (worklogId: string) => {
    try {
      const res = await fetch(`/api/worklogs?id=${worklogId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Eroare la ștergerea worklog-ului");

      setTasks((t) =>
        t.map((task) => {
          const newWorklogs = (task.worklogs || []).filter((w) => w.id !== worklogId);
          const totalTime = newWorklogs.reduce((sum, w) => sum + w.time_spent, 0);
          return { ...task, worklogs: newWorklogs, total_time_spent: totalTime };
        })
      );
    } catch (err) {
      console.error("Failed to delete worklog:", err);
    }
  };

  const handleCompleteAll = async () => {
    const pendingTasks = tasks.filter((t) => t.status === "pending");
    if (pendingTasks.length === 0) return;

    const prev = tasks;
    setTasks((t) =>
      t.map((task) => (task.status === "pending" ? { ...task, status: "done" as Status } : task))
    );

    try {
      await Promise.all(
        pendingTasks.map((task) =>
          fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "done" }),
          })
        )
      );
    } catch {
      setTasks(prev);
    }
  };

  const handleSchedule = (id: string) => {
    const isNewTask = id.startsWith("new-");
    if (isNewTask) {
      const tempTask: Task = {
        id,
        user_id: "mock",
        title: "Task nou",
        deadline: null,
        priority: "medium",
        category: null,
        status: "pending",
        raw_input: null,
        created_at: new Date().toISOString(),
        scheduled_date: null,
        scheduled_start: null,
        scheduled_end: null,
      };
      setTasks((t) => [...t, tempTask]);
    }
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
    setTasks((t) =>
      t.map((task) =>
        task.id === schedulingTaskId ? { ...task, ...data } : task
      )
    );

    try {
      const res = await fetch(`/api/tasks/${schedulingTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Eroare la planificare");
    } catch {
      setTasks(prev);
    }

    setSchedulingTaskId(null);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: () => (window.location.href = "/input"),
    onSearch: () => console.log("Search triggered"),
    onToggleHelp: () => setHelpOpen(!helpOpen),
    onNavigateWeek: (direction) => {
      // The CalendarView handles this internally via its own state
    },
    onNavigateDay: (direction) => {
      // The CalendarView handles this internally via its own state
    },
    onScheduleSelected: () => {
      // Could open schedule modal for selected task
    },
    onToggleSelected: () => {
      const firstPending = tasks.find((t) => t.status === "pending");
      if (firstPending) handleToggleDone(firstPending.id, "done");
    },
    onCompleteSelected: () => {
      const firstPending = tasks.find((t) => t.status === "pending");
      if (firstPending) handleToggleDone(firstPending.id, "done");
    },
    onRefresh: fetchTasks,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto w-16 h-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-gray-200"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent"
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-sm text-gray-500 font-medium"
          >
            Se încarcă task-urile...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50/30 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm p-6 text-center shadow-xl"
        >
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 font-semibold">{error}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchTasks}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200/50"
          >
            Reîncearcă
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900">
            Nu ai task-uri încă
          </h2>
          <p className="mt-2 text-gray-500 max-w-sm">
            Mergi la{" "}
            <a
              href="/input"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Input
            </a>{" "}
            și scrie ce ai de făcut — AI-ul va crea task-uri pentru tine
          </p>
          <motion.a
            href="/input"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50"
          >
            <Plus className="w-4 h-4" />
            Adaugă primul task
          </motion.a>
        </motion.div>
      </div>
    );
  }

  const schedulingTask = tasks.find((t) => t.id === schedulingTaskId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 15 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                TaskCapture
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.a
              href="/input"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50"
            >
              <Plus className="w-4 h-4" />
              Adaugă
            </motion.a>
            {tasks.some((t) => t.status === "pending") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCompleteAll}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalizează toate
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setHelpOpen(true)}
              className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              title="Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              title="Deconectare"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatsHeader tasks={tasks} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <CalendarView
            tasks={tasks}
            onToggleDone={handleToggleDone}
            onSchedule={handleSchedule}
            onAddWorklog={handleAddWorklog}
            onDeleteWorklog={handleDeleteWorklog}
          />
        </motion.div>
      </div>

      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSchedulingTaskId(null);
        }}
        onSave={handleScheduleSave}
        taskTitle={schedulingTask?.title}
      />

      <ShortcutsHelp isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
