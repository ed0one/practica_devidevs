<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# TaskCapture

Next.js (App Router, TypeScript, Tailwind v4) app that extracts actionable tasks from natural-language text via an LLM, schedules them on a calendar, and sends email reminders. Live: [www.taskcapture.xyz](https://www.taskcapture.xyz).

## Stack

| Concern | Tech |
|---|---|
| Auth + DB | Supabase (Postgres + RLS, `@supabase/ssr`) |
| LLM | NVIDIA NIM (`meta/llama-3.1-8b-instruct`) via `openai` SDK |
| Validation | Zod v4 |
| Email | Resend v6 (`taskcapture.xyz` domain) |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`, fail-open) |
| UI | shadcn/ui (Base UI variant) + Tailwind v4 + Framer Motion + dnd-kit |
| Deploy | Vercel (daily Cron → `/api/send-reminder`) |

## Data model (`public.tasks`)

`id`, `user_id` (FK `auth.users`), `title`, `deadline` (date), `priority` (`low|medium|high`), `category`, `status` (`pending|done`), `raw_input`, `created_at`, `scheduled_date`, `scheduled_start`/`scheduled_end` (local-datetime strings, no `Z`), `recurrence` (`none|daily|weekly`), `jira_issue_key`, `reminder_offset_min`, `reminder_sent_at`.

`public.user_prefs` (migration 005): `user_id`, `timezone`, `reminder_hour`, `email_daily`, `email_new_tasks`, `last_daily_sent_on`. Own-row RLS.

## API routes

- `POST /api/parse-tasks` — text → NIM → Zod → INSERT (llm rate limit)
- `GET /api/tasks` — current user's tasks (read limit)
- `POST /api/tasks` — create task; honors `email_new_tasks` (write limit)
- `PATCH`/`DELETE /api/tasks/[id]` — update/delete (write limit)
- `GET`/`PUT /api/prefs` — read/upsert `user_prefs`
- `POST /api/send-reminder` — Vercel Cron; daily digest + per-task reminders (Bearer `CRON_SECRET`)

## Where things live

```
src/
  app/            login, register, input, dashboard, profile, reset-password
                  auth/callback (PKCE), api/* (routes above)
  components/     CalendarView (week/day timeline), BoardView, TaskCard/List,
                  Schedule/EditTask modals, CommandPalette (⌘K), Sidebar, MobileNav
  lib/            llm, schemas (+ .test), task-rows (+ .test), recurrence (+ .test),
                  rate-limit, resend, csv (+ .test), time-format, utils
  lib/supabase/   client (browser) · server (SSR) · admin (service-role)
  lib/jira/       client + sync (used only by src/scripts/jira-sync.ts CLI)
  types/task.ts
supabase/migrations/  001..005 — run in order in the SQL Editor
```

See CLAUDE.md for request-flow architecture, the three-Supabase-clients rule, notification logic, and the Vercel-Hobby daily-cron constraint.

## Team

UTCB practice project (Web + AI, Grupa A). Iliescu (lead: LLM, email, auth/OAuth, dashboard UI, deploy), Dincov (calendar, scheduling, Jira CLI), Cîrlea (auth pages, middleware), Dinu (tasks CRUD API).
