<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Proiect: TaskCapture

Aplicație Next.js (App Router, TypeScript, Tailwind) care extrage task-uri din text natural via LLM.

## Stack
- **Auth + DB:** Supabase
- **LLM:** NVIDIA NIM
- **Validare:** Zod
- **Email reminders:** Resend
- **Deploy:** Vercel (Cron Job zilnic 08:00 → `/api/send-reminder`)

## Schema DB
```sql
public.tasks: id, user_id (FK auth.users), title, deadline (timestamptz),
              priority ('low'|'medium'|'high'), category, status ('pending'),
              raw_input, created_at
```

## API Routes
- `POST /api/parse-tasks` — text → NVIDIA NIM → Zod → INSERT Supabase
- `GET  /api/tasks` — task-urile userului autentificat
- `PATCH /api/tasks/[id]` — update status
- `POST /api/send-reminder` — email Resend cu task-urile scadente azi

## Structura foldere
```
src/
  app/login/ register/ input/ dashboard/
  app/api/parse-tasks/ tasks/[id]/ send-reminder/
  components/TaskCard.tsx TaskList.tsx InputForm.tsx
  lib/supabase/client.ts supabase/server.ts llm.ts schemas.ts resend.ts
  types/task.ts
supabase/migrations/001_tasks.sql
```

## Owneri
- **Dinu** — D1 SQL migration, D2 `lib/llm.ts`, D3 POST parse-tasks, D4 GET tasks, D5 PATCH tasks
- **Iliescu** — I1 ✅ Zod schemas, I2 ✅ prompt engineering, I3 ✅ Resend + send-reminder, I4 ⬜ Vercel deploy, I5 ⬜ Vercel Cron
- **Dincov** — DC1-DC5 dashboard (fetch, sortare, Mark as Done, badge culori, loading/empty state)
- **Cîrlea** — C1-C5 auth (login/register, middleware redirect, /input form, conectare API, logout)

## Variabile de mediu (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NVIDIA_NIM_API_KEY=
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
RESEND_API_KEY=
REMINDER_CRON_SECRET=
```

## Variabile de mediu (.env.local — status)
```
NEXT_PUBLIC_SUPABASE_URL=✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅
SUPABASE_SERVICE_ROLE_KEY=✅
NVIDIA_NIM_API_KEY=✅
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_MODEL=meta/llama-3.1-8b-instruct
RESEND_API_KEY=✅
RESEND_FROM_EMAIL=TaskCapture <onboarding@resend.dev>
REMINDER_CRON_SECRET=✅
```

## Fișiere implementate pe branch `ed0one`
- `src/lib/schemas.ts` — Zod schemas
- `src/types/task.ts` — tipuri TypeScript
- `src/lib/llm.ts` — wrapper NVIDIA NIM + prompt engineering
- `src/lib/resend.ts` — email HTML cu tabel task-uri
- `src/lib/supabase/admin.ts` — client service role (bypass RLS)
- `src/app/api/send-reminder/route.ts` — POST cron handler
- `supabase/migrations/001_tasks.sql` — CREATE TABLE + RLS + index

## Urmează
- **I4** — deploy pe Vercel + variabile de mediu în Vercel Dashboard
- **I5** — Vercel Cron Job zilnic (vercel.json deja configurat, ora e `0 6 * * *` UTC = 09:00 RO)
- **Jira sync** — bidirecțional la fiecare task nou. Instanță: `practica-devidevs-utcb-grupa-a-1.atlassian.net`. Lipsesc: API token Jira, Project Key, email Atlassian. Direcția Jira → TaskCapture necesită URL public (doar după deploy Vercel).

## Riscuri tehnice
- LLM poate returna JSON invalid → fallback regex în llm.ts
- Deadline-uri relative ("vineri") → data curentă injectată în prompt
- Vercel Cron Free limitat → alternativă: Supabase Edge Functions + pg_cron
- Jira webhook necesită URL public → nu merge pe localhost
