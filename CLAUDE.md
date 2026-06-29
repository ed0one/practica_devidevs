# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # dev server on localhost:3000
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # type check without building
```

No test suite is configured yet.

## Architecture

**Request flow for task creation:**
1. User submits text → `POST /api/parse-tasks`
2. `src/lib/llm.ts` calls NVIDIA NIM via the OpenAI-compatible SDK (`openai` package, custom `baseURL`)
3. Response is regex-extracted then validated with Zod schemas in `src/lib/schemas.ts`
4. Validated tasks are inserted into Supabase `public.tasks`

**Two Supabase clients — use the right one:**
- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`), for Client Components
- `src/lib/supabase/server.ts` — async server client (`createServerClient` + cookies), for Server Components and Route Handlers
- `src/lib/supabase/admin.ts` — service role client, bypasses RLS; only used in `POST /api/send-reminder`

**Email reminder flow:**
- `POST /api/send-reminder` is called by Vercel Cron (configured in `vercel.json`, schedule `0 6 * * *` UTC)
- Protected by `Authorization: Bearer REMINDER_CRON_SECRET`
- Uses admin client to read all users' tasks due today, then `src/lib/resend.ts` to send per-user emails

**Key version constraints:**
- Next.js **16.2.9** — APIs may differ from training data; read `node_modules/next/dist/docs/` before using unfamiliar APIs
- React **19.2.4**
- Zod **v4** (`zod@^4`) — breaking changes from v3
- `openai` **v6** SDK
- `resend` **v6** — use `resend.emails.send()`; types in `node_modules/resend/dist/index.d.mts`
- Tailwind **v4** (PostCSS plugin, no `tailwind.config.js`)
- shadcn/ui components in `src/components/ui/` (Base UI variant)

## Environment

Copy `.env.example` to `.env.local`. Required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_NIM_API_KEY`, `RESEND_API_KEY`, `REMINDER_CRON_SECRET`.

DB migration: run `supabase/migrations/001_tasks.sql` in Supabase SQL Editor. Enables RLS — every user sees only their own tasks.
