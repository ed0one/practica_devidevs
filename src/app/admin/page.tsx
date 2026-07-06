import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeStats } from "@/lib/stats";
import type { Task } from "@/types/task";
import AdminDashboard, { type AdminTask, type AdminUser } from "@/components/AdminDashboard";

// Pagina de admin e strict pentru dev. În producție nu există (404), deci
// nu expune date globale (folosește service-role = bypass RLS) pe live.
export const dynamic = "force-dynamic";

function isDev() {
  return process.env.NODE_ENV !== "production";
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

  const userRows: AdminUser[] = users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    taskCount: byUser.get(u.id)?.total ?? 0,
    doneCount: byUser.get(u.id)?.done ?? 0,
  }));

  // Doar câmpurile necesare drill-down-ului (nu trimitem tot rândul la client).
  const taskRows: AdminTask[] = tasks.map((t) => ({
    id: t.id,
    user_id: t.user_id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    deadline: t.deadline,
    created_at: t.created_at,
    category: t.category,
  }));

  return <AdminDashboard users={userRows} tasks={taskRows} stats={stats} />;
}
