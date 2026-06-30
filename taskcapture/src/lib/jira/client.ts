import { Version3Client } from "jira.js";

const baseUrl = process.env.JIRA_BASE_URL!;
const email = process.env.JIRA_EMAIL!;
const apiToken = process.env.JIRA_API_TOKEN!;
const projectKey = process.env.JIRA_PROJECT_KEY || "TC";

if (!baseUrl || !email || !apiToken) {
  throw new Error("JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN env vars required");
}

export const jiraClient = new Version3Client({
  host: `https://${baseUrl}`,
  authentication: {
    basic: {
      email,
      apiToken,
    },
  },
});

export { projectKey };
