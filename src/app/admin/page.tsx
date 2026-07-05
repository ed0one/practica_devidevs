import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeStats } from "@/lib/stats";
import type { Task } from "@/types/task";

// Pagina de admin e strict pentru dev. În producție nu există (404), deci
// nu expune date globale (folosește service-role = bypass RLS) pe live.
export const dynamic = "force-dynamic";

function isDev() {
  return process.env.NODE_ENV !== "production";
}

interface UserRow {
  id: string;
  email: string | null;
  created_at: string;
  taskCount: number;
  doneCount: number;
}

export default async function AdminPage() {
  if (!isDev()) notFound();

  const admin = createAdminClient();

  // Toate task-urile (service-role bypass RLS — permis DOAR aici, în dev).
  const { data: taskData } = await admin
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  const tasks = (taskData ?? []) as Task[];

  const { data: userList } = await admin.auth.admin.listUsers();
  const users = userList?.users ?? [];

  const stats = computeStats(tasks);

  const byUser = new Map<string, { total: number; done: number }>();
  for (const t of tasks) {
    const e = byUser.get(t.user_id) ?? { total: 0, done: 0 };
    e.total += 1;
    if (t.status === "done") e.done += 1;
    byUser.set(t.user_id, e);
  }

  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    taskCount: byUser.get(u.id)?.total ?? 0,
    doneCount: byUser.get(u.id)?.done ?? 0,
  }));

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
        <Stat label="Restante (overdue)" value={stats.overdue} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card title="După prioritate">
          <Row label="High" value={stats.byPriority.high} />
          <Row label="Medium" value={stats.byPriority.medium} />
          <Row label="Low" value={stats.byPriority.low} />
        </Card>
        <Card title="După status">
          <Row label="Pending" value={stats.byStatus.pending} />
          <Row label="Done" value={stats.byStatus.done} />
          <Row
            label="Rată finalizare"
            value={`${Math.round(stats.completionRate * 100)}%`}
          />
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Utilizatori</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Creat</th>
                <th className="px-3 py-2 text-right">Task-uri</th>
                <th className="px-3 py-2 text-right">Finalizate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.email ?? "—"}</td>
                  <td className="px-3 py-2">{u.created_at.substring(0, 10)}</td>
                  <td className="px-3 py-2 text-right">{u.taskCount}</td>
                  <td className="px-3 py-2 text-right">{u.doneCount}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-2xl font-bold">{value}</div>
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
