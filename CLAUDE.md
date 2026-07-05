# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # dev server on localhost:3000
npm run build      # production build
npm run lint       # eslint
npm test           # vitest run (all unit tests, node environment)
npm run test:watch # vitest watch mode
npx tsc --noEmit   # type check without building
```

Run a single test file or case:

```bash
npx vitest run src/lib/schemas.test.ts     # one file
npx vitest run -t "buildTaskRow"           # one test by name
```

Verification loop before committing non-trivial changes: `npx tsc --noEmit && npm run lint && npm test && npm run build`.

## Architecture

**Task-creation request flow:**
1. User submits free text → `POST /api/parse-tasks`
2. `src/lib/llm.ts` calls NVIDIA NIM via the OpenAI SDK (`openai` package, custom `baseURL`). Today's date is injected into the prompt so relative deadlines ("vineri") resolve.
3. LLM output is regex-extracted, then validated with Zod (`src/lib/schemas.ts`). Invalid fields are coerced to `null` rather than throwing — a malformed date still saves the task without a date.
4. Each parsed task → `src/lib/task-rows.ts` `buildTaskRow()` (pure, tested) → INSERT into Supabase `public.tasks`.
5. If the user's `email_new_tasks` pref is on, a confirmation email is sent via `src/lib/resend.ts`.

**Three Supabase clients — pick the right one:**
- `src/lib/supabase/client.ts` — browser (`createBrowserClient`), for Client Components
- `src/lib/supabase/server.ts` — async server (`createServerClient` + cookies), for Server Components and Route Handlers
- `src/lib/supabase/admin.ts` — service-role, **bypasses RLS**; used by `POST /api/send-reminder` (must read every user's tasks) and by `/admin` (dev-only page, `notFound()` in production so global data is never exposed on live)

RLS is on: outside the admin client, every query is automatically scoped to the authenticated user. Never reach for the admin client to "make a query work" — that's almost always a sign you're in the wrong client.

**Auth & routing:**
- `src/middleware.ts` gates `/dashboard`, `/input`, `/profile` (redirect to `/login` if signed out) and bounces signed-in users away from `/login`/`/register`. `/reset-password` is intentionally **not** matched so the recovery link is reachable.
- OAuth + password-recovery both round-trip through `src/app/auth/callback/route.ts` (PKCE `exchangeCodeForSession`). The `next` param is restricted to internal paths.

**Rate limiting** (`src/lib/rate-limit.ts`): Upstash Redis sliding-window, keyed by `user.id`. Kinds: `read` 60/60s, `write` 30/60s, `llm` 12/60s. **Fail-open** — if `UPSTASH_REDIS_REST_URL`/`TOKEN` are unset (local/CI), limiting is silently disabled so it never blocks dev or `next build`.

**Notifications** (`POST /api/send-reminder`, called by cron):
- Protected by `Authorization: Bearer` matching `CRON_SECRET`/`REMINDER_CRON_SECRET`.
- `runDailyDigest` — per-user prefs from `user_prefs` (timezone, `reminder_hour`, `email_daily`); fires when the user's **local** hour equals `reminder_hour`, computed via `Intl.DateTimeFormat(...).formatToParts`, deduped by `last_daily_sent_on`.
- `runTaskReminders` — per-task `reminder_offset_min` (e.g. 30 = "30 min before"); fires inside a `[now-65min, now]` window, marks `reminder_sent_at`.
- Both degrade gracefully if migration 005 hasn't been applied.
- **Driven by two cron sources** (endpoint is idempotent, so overlap is safe): Vercel daily (`vercel.json`, `0 6 * * *`) as a floor, and Supabase pg_cron **hourly** (migration 006) as the real per-timezone driver. See the Vercel-Hobby gotcha below.

**Jira sync is a CLI script, not wired into the app.** `src/scripts/jira-sync.ts` (`tsx`) hits the running app's `/api/tasks` and pushes to Jira via `src/lib/jira/`. Credentials come from `JIRA_*` env vars. The Jira API token must never be committed — it lives only in `~/.claude/jira-config.json`.

## Gotchas & constraints

- **Vercel Hobby allows only daily crons.** A schedule more frequent than daily (e.g. `0 * * * *`) makes Vercel reject *every* deployment, silently freezing production. `vercel.json` must stay at `0 6 * * *`. Per-timezone/per-task delivery is instead driven by **Supabase pg_cron hourly** (migration 006: `pg_cron` + `pg_net` POST to `/api/send-reminder`). The `<CRON_SECRET>` in 006 is a placeholder — never commit the real value; it lands in plaintext in `cron.job`, so rotate it if the schema is ever dumped.
- **This is not the Next.js you know** (16.2.9) — see the top of AGENTS.md. Also: React 19.2, **Zod v4** (breaking vs v3), `openai` v6, `resend` v6 (`resend.emails.send()`), Tailwind **v4** (PostCSS plugin, no `tailwind.config.js`).
- Scheduling timestamps are stored as local-datetime strings `"YYYY-MM-DDTHH:MM:SS"` (no UTC `Z`) and parsed by substring — do not run them through `new Date()` round-trips that would apply an offset.
- All singletons (`llm.ts`, `resend.ts`, `rate-limit.ts`) init lazily on first use, never at import, so a missing key doesn't break `next build`.
- User-facing copy is Romanian; keep it Romanian.

## Environment

Copy `.env.example` → `.env.local`. `.env.local` is gitignored and must never be committed. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_NIM_API_KEY`, `RESEND_API_KEY`, `REMINDER_CRON_SECRET`. Optional: `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (rate limiting), `NEXT_PUBLIC_APP_URL`, `JIRA_*` (CLI sync only). Env vars set locally must also be added in the Vercel Dashboard, or production runs without them.

DB: run `supabase/migrations/00{1..8}_*.sql` in order in the Supabase SQL Editor. 001 tasks + RLS, 002 scheduling + `jira_issue_key`, 003 RLS-authenticated, 004 recurrence, 005 `user_prefs` + reminder columns, 006 pg_cron hourly scheduler (needs `pg_cron`+`pg_net` extensions; edit `<CRON_SECRET>` first), 007 `email_task_updates` pref, 008 calendar fields (`description`, `all_day`, `location`, `color`, `subtasks`). Supabase Auth → Redirect URLs must include `<origin>/auth/callback`.
