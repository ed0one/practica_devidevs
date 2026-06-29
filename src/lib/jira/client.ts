import { Task } from "@/types/task";

const JIRA_BASE = process.env.JIRA_BASE_URL || "";
const JIRA_EMAIL = process.env.JIRA_EMAIL || "";
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || "";
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || "TC";

function authHeader(): string {
  const creds = `${JIRA_EMAIL}:${JIRA_API_TOKEN}`;
  return `Basic ${Buffer.from(creds).toString("base64")}`;
}

async function jiraFetch(path: string, options: RequestInit = {}) {
  if (!JIRA_BASE || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error("JIRA credentials not configured in env");
  }
  const res = await fetch(`${JIRA_BASE}/rest/api/3${path}`, {
    ...options,
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`JIRA ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function createJiraIssue(task: Task): Promise<string> {
  const payload = {
    fields: {
      project: { key: JIRA_PROJECT_KEY },
      summary: task.title,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: task.raw_input || "—" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: `Prioritate: ${task.priority}` }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: `Categorie: ${task.category || "—"}` }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `Deadline: ${
                  task.deadline
                    ? new Date(task.deadline).toLocaleDateString("ro-RO")
                    : "—"
                }`,
              },
            ],
          },
        ],
      },
      issuetype: { name: "Task" },
      priority: {
        name:
          task.priority === "high"
            ? "High"
            : task.priority === "medium"
            ? "Medium"
            : "Low",
      },
    },
  };

  const result = await jiraFetch("/issue", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.key;
}

export async function updateJiraIssue(
  issueKey: string,
  fields: Record<string, unknown>
) {
  await jiraFetch(`/issue/${issueKey}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
}

export async function transitionJiraIssue(
  issueKey: string,
  transitionName: "Done" | "To Do"
) {
  const transitions = await jiraFetch(`/issue/${issueKey}/transitions`);
  const t = transitions.transitions.find(
    (tr: any) => tr.name.toLowerCase() === transitionName.toLowerCase()
  );
  if (!t) throw new Error(`Transition "${transitionName}" not found`);
  await jiraFetch(`/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: t.id } }),
  });
}

export async function logWork(
  issueKey: string,
  timeSpentSeconds: number,
  started: string,
  comment?: string
) {
  await jiraFetch(`/issue/${issueKey}/worklog`, {
    method: "POST",
    body: JSON.stringify({
      timeSpentSeconds,
      started,
      comment: comment
        ? { type: "doc", version: 1, content: [{ type: "paragraph", content: [{ type: "text", text: comment }] }] }
        : undefined,
    }),
  });
}

export async function searchMyIssues() {
  return jiraFetch(
    `/search?jql=${encodeURIComponent(
      `assignee = currentUser() AND project = ${JIRA_PROJECT_KEY}`
    )}&fields=summary,status,priority,updated`
  );
}

export { JIRA_PROJECT_KEY };