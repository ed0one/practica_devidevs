#!/usr/bin/env tsx
import { Task } from "@/types/task";
import {
  syncTaskToJira,
  completeTaskInJira,
  reopenTaskInJira,
  logWorkOnTask,
  parseDuration,
  searchMyIssues,
} from "@/lib/jira/sync";

const API_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", "") || "http://localhost:3000";

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/api/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();
  return data.tasks;
}

async function patchTask(id: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

async function cmdSyncAll() {
  console.log("🔄 Fetching tasks...");
  const tasks = await fetchTasks();
  const pending = tasks.filter((t) => t.status === "pending");
  console.log(`Found ${pending.length} pending tasks`);

  for (const task of pending) {
    try {
      const key = await syncTaskToJira(task);
      console.log(`  ✅ ${task.title} → ${key}`);
      await patchTask(task.id, { jira_issue_key: key });
    } catch (e) {
      console.error(`  ❌ ${task.title}: ${(e as Error).message}`);
    }
  }
}

async function cmdSyncOne(taskId: string) {
  const tasks = await fetchTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  const key = await syncTaskToJira(task);
  console.log(`✅ ${task.title} → ${key}`);
  await patchTask(task.id, { jira_issue_key: key });
}

async function cmdComplete(taskId: string) {
  const tasks = await fetchTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  await completeTaskInJira(task);
  await patchTask(task.id, { status: "done" });
  console.log(`✅ Completed ${task.title} in Jira & locally`);
}

async function cmdReopen(taskId: string) {
  const tasks = await fetchTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  await reopenTaskInJira(task);
  await patchTask(task.id, { status: "pending" });
  console.log(`✅ Reopened ${task.title} in Jira & locally`);
}

async function cmdLogWork(taskId: string, durationStr: string, comment: string) {
  const tasks = await fetchTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  const { hours, minutes } = parseDuration(durationStr);
  await logWorkOnTask(task, hours, minutes, comment);
  console.log(`✅ Logged ${hours}h ${minutes}m on ${task.title}`);
}

async function cmdPull() {
  console.log("🔄 Fetching your Jira issues...");
  const issues = await searchMyIssues();
  console.log(`Found ${issues.issues.length} issues assigned to you:`);
  for (const issue of issues.issues) {
    console.log(`  ${issue.key}: ${issue.fields.summary} [${issue.fields.status.name}]`);
  }
}

async function cmdStatus() {
  const tasks = await fetchTasks();
  console.log("📋 Task Status:");
  for (const task of tasks) {
    const key = (task as any).jira_issue_key;
    const synced = key ? `→ ${key}` : "❌ not synced";
    console.log(`  [${task.status}] ${task.title} ${synced}`);
  }
}

const commands: Record<string, () => Promise<void>> = {
  "sync-all": cmdSyncAll,
  "sync-one": () => cmdSyncOne(process.argv[3]!),
  complete: () => cmdComplete(process.argv[3]!),
  reopen: () => cmdReopen(process.argv[3]!),
  "log-work": () =>
    cmdLogWork(process.argv[3]!, process.argv[4]!, process.argv.slice(5).join(" ")),
  pull: cmdPull,
  status: cmdStatus,
};

const cmd = process.argv[2];
if (!cmd || !commands[cmd]) {
  console.log(`
Usage: npx tsx src/scripts/jira-sync.ts <command>

Commands:
  sync-all              Create Jira issues for all pending tasks
  sync-one <task-id>    Create Jira issue for one task
  complete <task-id>    Mark done in Jira + locally
  reopen <task-id>      Reopen in Jira + locally
  log-work <task-id> <duration> <comment>
                        Log work (e.g. 2h30m "Fixed bug")
  pull                  List your assigned Jira issues
  status                Show sync status of all tasks
`);
  process.exit(1);
}

try {
  await commands[cmd]();
} catch (e) {
  console.error("❌", (e as Error).message);
  process.exit(1);
}