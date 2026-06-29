---
name: dincov-jira-sync
description: Personal Jira sync agent for TaskCapture. Use when you want to sync your local tasks with Jira, log work hours, or manage Jira issues from the CLI. Run with your Jira API credentials.
---

# Dincov Jira Sync Agent

Personal CLI agent to sync TaskCapture ↔ Jira. You run this manually when you want to push/pull.

## Setup (one time)

```bash
# 1. Get Jira API token: https://id.atlassian.com/manage-profile/security/api-tokens
# 2. Add to your shell config (~/.zshrc, ~/.bashrc, or Windows env):
export JIRA_BASE_URL="https://YOUR-DOMAIN.atlassian.net"
export JIRA_EMAIL="your@email.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT_KEY="TC"
```

## Install deps (in taskcapture/)
```bash
cd taskcapture
npm install jira.js
```

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/jira/client.ts` | Low-level Jira REST API wrapper |
| `src/lib/jira/sync.ts` | High-level sync: create issue, transition, update |
| `src/scripts/jira-sync.ts` | **CLI script you run** |

## Usage

```bash
# From taskcapture/ folder:

# Sync ALL pending tasks → create Jira issues
npx tsx src/scripts/jira-sync.ts sync-all

# Sync ONE task by ID
npx tsx src/scripts/jira-sync.ts sync-one <task-id>

# Log work on a task (creates Jira worklog)
npx tsx src/scripts/jira-sync.ts log-work <task-id> 2h30m "Code review"

# Mark task done in both places
npx tsx src/scripts/jira-sync.ts complete <task-id>

# Pull your assigned Jira issues into local
npx tsx src/scripts/jira-sync.ts pull

# Show status of all tasks
npx tsx src/scripts/jira-sync.ts status
```

## Workflow Example

```bash
# 1. You finish a task in TaskCapture dashboard
# 2. Mark it done locally (click "Gata")
# 3. Sync to Jira:
npx tsx src/scripts/jira-sync.ts complete task-uuid-here

# 4. Or log hours without completing:
npx tsx src/scripts/jira-sync.ts log-work task-uuid-here 1h30m "Fixed login bug"
```

## What Gets Synced

| TaskCapture → Jira | Jira → TaskCapture |
|--------------------|-------------------|
| Title → Summary | Issue key → stored on task |
| raw_input → Description | Status → local status |
| Priority → Priority | Worklogs → (future) |
| Category → Labels | |
| Deadline → Due date | |
| Scheduled time → (future) | |

## Required Env Vars
```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-token
JIRA_PROJECT_KEY=TC
```

## Run the Agent

In opencode, just say:
> "Use the dincov-jira-sync agent to sync my completed tasks to Jira"

The agent will run the CLI commands for you.