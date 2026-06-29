# TaskCapture — Ghid pentru Echipă

## Setup & Run
```bash
cd taskcapture
npm install
cp .env.example .env.local   # completează cu cheile reale
npm run dev                   # http://localhost:3000
```

## Comenzi
```bash
npm run dev       # dev server
npm run lint      # ESLint
npm run build     # build producție
```

**Order:** `lint` → `build` (typecheck e inclus în build)

## Env vars (.env.local — NICIODATĂ nu commitați)
Vezi `.env.example` pentru listă completă.

## Arhitectură
- Next.js 15 App Router + TypeScript + Tailwind CSS v4
- Framer Motion pentru animații, date-fns pentru calendar, lucide-react pentru iconițe
- Supabase pentru auth + DB, NVIDIA NIM pentru LLM, Resend pentru email
- API responses: `{ tasks: Task[] }` sau `{ error: string }`

## Tipuri (`src/types/task.ts`)
Task are 3 scheduling fields: `scheduled_date`, `scheduled_start`, `scheduled_end` (toate nullable).

## Convenții
- Tailwind CSS — fără librării UI extra
- `"use client"` pe componentele cu hooks / Framer Motion
- Limba UI: română
- Animații: spring physics (nu linear), staggered entrance, `AnimatePresence mode="wait"` la view switches
- Design: glassmorphism (`bg-white/80 backdrop-blur-sm`), indigo→violet gradient, `rounded-xl`
- Icons: doar `lucide-react`

## Calendar (Dincov)
- 3 view-uri: week / day / list
- Week starts Monday (`weekStartsOn: 1`), hour grid 06:00–21:00
- ScheduleModal: pick date + start/end time → PATCH task
- date-fns locale `ro` pentru formatările românești

## Owneri
- **Dincov** — Dashboard: CalendarView, TaskCard, TaskList, StatsHeader, ScheduleModal, globals.css
- **Dinu** — Backend: API routes (tasks, parse-tasks), Supabase client, llm.ts
- **Iliescu** — schemas.ts (Zod), resend.ts, send-reminder, Vercel deploy/cron
- **Cîrlea** — Auth: login/register, input page, InputForm, middleware

## Next.js 15 quirks
- Dynamic route `params` is a **Promise** — always `await params` first
- Tailwind v4: `@import "tailwindcss"` in globals.css (no `@tailwind` directives)
