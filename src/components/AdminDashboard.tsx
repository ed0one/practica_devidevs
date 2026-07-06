"use client";

import { useMemo, useState } from "react";
import { isDisposableEmail } from "@/lib/email-domains";
import type { TaskStats } from "@/lib/stats";

export interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  taskCount: number;
  doneCount: number;
}

export interface AdminTask {
  id: string;
  user_id: string;
  title: string;
  status: "pending" | "done";
  priority: "low" | "medium" | "high";
  deadline: string | null;
  created_at: string;
  category: string | null;
}

type SortKey = "created" | "tasks" | "done";

const ORANGE = "#ff6a3d";
const TEAL = "#3dd4a7";

// Ultimele N zile ca șiruri YYYY-MM-DD (cronologic).
function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return out;
}

export default function AdminDashboard({
  users: initialUsers,
  tasks,
  stats,
}: {
  users: AdminUser[];
  tasks: AdminTask[];
  stats: TaskStats;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("created");
  const [onlyDisposable, setOnlyDisposable] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const disposableCount = useMemo(
    () => users.filter((u) => u.email && isDisposableEmail(u.email)).length,
    [users]
  );

  const tasksByUser = useMemo(() => {
    const m = new Map<string, AdminTask[]>();
    for (const t of tasks) {
      const arr = m.get(t.user_id) ?? [];
      arr.push(t);
      m.set(t.user_id, arr);
    }
    return m;
  }, [tasks]);

  const visible = useMemo(() => {
    let list = users;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((u) => (u.email ?? "").toLowerCase().includes(q));
    if (onlyDisposable)
      list = list.filter((u) => u.email && isDisposableEmail(u.email));
    const sorted = [...list].sort((a, b) => {
      if (sort === "created") return b.created_at.localeCompare(a.created_at);
      if (sort === "tasks") return b.taskCount - a.taskCount;
      return b.doneCount - a.doneCount;
    });
    return sorted;
  }, [users, query, onlyDisposable, sort]);

  // Serii pentru grafice: înscrieri/zi și task-uri create/zi, ultimele 14 zile.
  const days = useMemo(() => lastDays(14), []);
  const signupsPerDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of users) {
      const d = u.created_at.substring(0, 10);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return days.map((d) => counts.get(d) ?? 0);
  }, [users, days]);
  const tasksPerDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      const d = t.created_at.substring(0, 10);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return days.map((d) => counts.get(d) ?? 0);
  }, [tasks, days]);

  const topCategories = useMemo(
    () =>
      Object.entries(stats.byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [stats.byCategory]
  );

  const handleDelete = async (u: AdminUser) => {
    if (
      !window.confirm(
        `Ștergi userul ${u.email ?? u.id} și toate task-urile lui? Ireversibil.`
      )
    )
      return;
    setDeleting(u.id);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Eroare");
      }
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      if (expanded === u.id) setExpanded(null);
    } catch (e) {
      window.alert(`Nu s-a putut șterge: ${(e as Error).message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Admin — dev</h1>
        <p className="text-sm text-muted-foreground">
          Vizibilă doar în mod dezvoltare. Date globale (bypass RLS).
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Utilizatori" value={users.length} />
        <Stat label="Task-uri" value={stats.total} />
        <Stat label="Finalizate" value={stats.byStatus.done} />
        <Stat
          label="Emailuri suspecte"
          value={disposableCount}
          highlight={disposableCount > 0}
        />
      </section>

      {/* Grafice */}
      <section className="grid gap-4 sm:grid-cols-2">
        <BarChart title="Înscrieri / zi (14 zile)" days={days} values={signupsPerDay} color={ORANGE} />
        <BarChart title="Task-uri create / zi (14 zile)" days={days} values={tasksPerDay} color={TEAL} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card title="După prioritate">
          <Row label="High" value={stats.byPriority.high} />
          <Row label="Medium" value={stats.byPriority.medium} />
          <Row label="Low" value={stats.byPriority.low} />
        </Card>
        <Card title="Top categorii">
          {topCategories.length === 0 && (
            <span className="text-sm text-muted-foreground">Nicio categorie.</span>
          )}
          {topCategories.map(([cat, n]) => (
            <Row key={cat} label={cat} value={n} />
          ))}
        </Card>
      </section>

      {/* Controale utilizatori */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold mr-auto">Utilizatori</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 caută email..."
            className="h-9 rounded-lg border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#ff6a3d]/30"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-lg border px-2 text-sm bg-background"
          >
            <option value="created">Sortare: Creat</option>
            <option value="tasks">Sortare: Task-uri</option>
            <option value="done">Sortare: Finalizate</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyDisposable}
              onChange={(e) => setOnlyDisposable(e.target.checked)}
            />
            Doar suspecte
          </label>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Creat</th>
                <th className="px-3 py-2 text-right">Task-uri</th>
                <th className="px-3 py-2 text-right">Finalizate</th>
                <th className="px-3 py-2 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => {
                const suspect = u.email ? isDisposableEmail(u.email) : false;
                const isOpen = expanded === u.id;
                const userTasks = tasksByUser.get(u.id) ?? [];
                return (
                  <FragmentRow
                    key={u.id}
                    user={u}
                    suspect={suspect}
                    isOpen={isOpen}
                    userTasks={userTasks}
                    deleting={deleting === u.id}
                    onToggle={() => setExpanded(isOpen ? null : u.id)}
                    onDelete={() => handleDelete(u)}
                  />
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                    Niciun utilizator.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function FragmentRow({
  user,
  suspect,
  isOpen,
  userTasks,
  deleting,
  onToggle,
  onDelete,
}: {
  user: AdminUser;
  suspect: boolean;
  isOpen: boolean;
  userTasks: AdminTask[];
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr className={`border-t ${suspect ? "bg-red-50 dark:bg-red-500/5" : ""}`}>
        <td className="px-3 py-2">
          <button onClick={onToggle} className="inline-flex items-center gap-1.5 hover:underline">
            <span className="text-muted-foreground">{isOpen ? "▾" : "▸"}</span>
            {user.email ?? "—"}
          </button>
          {suspect && (
            <span className="ml-2 rounded bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
              ⚠️ temp-mail
            </span>
          )}
        </td>
        <td className="px-3 py-2">{user.created_at.substring(0, 10)}</td>
        <td className="px-3 py-2 text-right">{user.taskCount}</td>
        <td className="px-3 py-2 text-right">{user.doneCount}</td>
        <td className="px-3 py-2 text-right">
          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 dark:border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40"
          >
            {deleting ? "Se șterge..." : "Șterge"}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-t bg-muted/30">
          <td colSpan={5} className="px-3 py-3">
            {userTasks.length === 0 ? (
              <span className="text-sm text-muted-foreground">Niciun task.</span>
            ) : (
              <ul className="space-y-1">
                {userTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className={t.status === "done" ? "text-emerald-600" : "text-muted-foreground"}>
                      {t.status === "done" ? "✓" : "○"}
                    </span>
                    <span className="flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-muted-foreground uppercase">{t.priority}</span>
                    {t.deadline && (
                      <span className="text-xs text-muted-foreground">{t.deadline.substring(0, 10)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function BarChart({
  title,
  days,
  values,
  color,
}: {
  title: string;
  days: string[];
  values: number[];
  color: string;
}) {
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">{total} total</span>
      </div>
      <div className="flex h-24 items-end gap-1">
        {values.map((v, i) => (
          <div
            key={days[i]}
            className="flex-1 rounded-t"
            style={{
              height: `${(v / max) * 100}%`,
              minHeight: v > 0 ? "3px" : "0",
              backgroundColor: color,
            }}
            title={`${days[i]}: ${v}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{days[0].substring(5)}</span>
        <span>{days[days.length - 1].substring(5)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? "border-red-300 dark:border-red-500/40" : ""}`}>
      <div className={`text-2xl font-bold ${highlight ? "text-red-600 dark:text-red-400" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-2 font-medium">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
