import { Task } from "@/types/task";
import {
  createJiraIssue,
  updateJiraIssue,
  transitionJiraIssue,
  logWork,
} from "./client";

function getJiraKey(task: Task): string | null {
  return task.jira_issue_key ?? null;
}

function setJiraKey(task: Task, key: string) {
  task.jira_issue_key = key;
}

export async function syncTaskToJira(task: Task): Promise<string> {
  const existingKey = getJiraKey(task);
  if (existingKey) {
    await updateJiraIssue(existingKey, {
      summary: task.title,
      priority: {
        name:
          task.priority === "high"
            ? "High"
            : task.priority === "medium"
            ? "Medium"
            : "Low",
      },
    });
    return existingKey;
  }

  const newKey = await createJiraIssue(task);
  setJiraKey(task, newKey);
  return newKey;
}

export async function completeTaskInJira(task: Task) {
  const key = getJiraKey(task);
  if (!key) throw new Error("Task not synced to Jira yet");
  await transitionJiraIssue(key, "Done");
}

export async function reopenTaskInJira(task: Task) {
  const key = getJiraKey(task);
  if (!key) throw new Error("Task not synced to Jira yet");
  await transitionJiraIssue(key, "To Do");
}

export async function logWorkOnTask(
  task: Task,
  hours: number,
  minutes: number,
  comment: string
) {
  const key = getJiraKey(task);
  if (!key) throw new Error("Task not synced to Jira yet");

  const totalSeconds = hours * 3600 + minutes * 60;
  const started = new Date().toISOString();
  await logWork(key, totalSeconds, started, comment);
}

export function parseDuration(str: string): { hours: number; minutes: number } {
  const match = str.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
  if (!match) throw new Error("Invalid duration format (use 2h30m, 1h, 45m)");
  return {
    hours: parseInt(match[1] || "0"),
    minutes: parseInt(match[2] || "0"),
  };
}