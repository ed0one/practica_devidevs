# Practica DeviDevs — Agent Instructions

## Repo Structure
```
D:\Code\practica 2026\
├── taskcapture/           # Main Next.js 15 app (production)
├── taskcapture-testing/   # Copy for UI testing (no auth/backend needed)
├── .agents/skills/        # BMAD skills (agents, workflows)
└── README.md
```

## Key Commands (run from `taskcapture/`)

```bash
cd taskcapture
npm install                # install deps
cp .env.example .env.local # add real keys
npm run dev                # http://localhost:3000

npm run lint               # ESLint
npm run build              # production build (includes typecheck)
```

**Order:** `lint` → `build` (typecheck included)

## Testing Folder (No Auth Required)

```bash
cd taskcapture-testing
npm run dev                # http://localhost:3001
```
- `TESTING_MODE=true` in middleware + dashboard bypasses Supabase auth
- 6 mock tasks loaded (WEB-25 through WEB-28 + extras)
- All features work: drag-drop, worklogs, weekly summary, keyboard shortcuts

## Environment Variables (`.env.local` — never commit)

Required for full backend:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NVIDIA_NIM_API_KEY=
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
RESEND_API_KEY=
REMINDER_CRON_SECRET=
```

Optional Jira sync (in `~/.jira-agent/.env`):
```
JIRA_BASE_URL=https://practica-devidevs-utcb-grupa-a-1.atlassian.net
JIRA_EMAIL=racovelcristian8@gmail.com
JIRA_API_TOKEN=...
JIRA_PROJECT_KEY=TC
```

## Architecture Notes

- **Next.js 15 App Router** + TypeScript + Tailwind v4 (`@import "tailwindcss"` in globals.css)
- **Framer Motion** for animations (spring physics, staggered, `AnimatePresence mode="wait"`)
- **Supabase** auth + DB, **NVIDIA NIM** for LLM, **Resend** for email
- API responses: `{ tasks: Task[] }` or `{ error: string }`
- **Romanian UI** only; icons: `lucide-react` only

## Task Type (`src/types/task.ts`)
```ts
type Priority = "low" | "medium" | "high";
type Status = "pending" | "done";
type ViewMode = "week" | "day" | "list" | "sumar";

Task {
  id, user_id, title, deadline, priority, category, status,
  raw_input, created_at,
  scheduled_date, scheduled_start, scheduled_end,
  worklogs?: WorklogEntry[],
  total_time_spent?: number
}
```

## Calendar (Dincov)
- 4 views: week / day / list / **sumar** (new)
- Week starts Monday (`weekStartsOn: 1`), hour grid 06:00–21:00
- Drag-and-drop via `@dnd-kit`:
  - Week: drop on day column → schedules 09:00–10:00
  - Day: drop on hour slot → precise time
  - List: reorder
  - Unscheduled panel: drag to schedule
- ScheduleModal: date + start/end time → PATCH `/api/tasks/[id]`

## Keyboard Shortcuts (press `?` for help)
| Key | Action |
|-----|--------|
| `⌘/Ctrl+N` | New task → `/input` |
| `⌘/Ctrl+K` | Search (stub) |
| `?` | Show shortcuts modal |
| `←/→` | Navigate calendar week/day |
| `Enter` | Toggle task / open schedule |
| `Space` | Toggle done/pending |
| `D` | Mark selected done |
| `S` | Schedule selected |
| `R` | Refresh |

## Owner Areas
- **Dincov** — Dashboard: CalendarView, TaskCard, TaskList, StatsHeader, ScheduleModal, WeeklySummary, ShortcutsHelp, WorklogPanel, globals.css
- **Dinu** — Backend: API routes (tasks, parse-tasks), Supabase client, llm.ts
- **Iliescu** — schemas.ts (Zod), resend.ts, send-reminder, Vercel deploy/cron
- **Cîrlea** — Auth: login/register, input page, InputForm, middleware

## Next.js 15 Quirks
- Dynamic route `params` is a **Promise** — always `await params` first
- Tailwind v4: `@import "tailwindcss"` in globals.css (no `@tailwind` directives)

## Jira Sync (Manual CLI)
```bash
cd ~/.jira-agent
npx tsx src/cli.ts status          # show assigned issues
npx tsx src/cli.ts complete WEB-25  # move to Done
npx tsx src/cli.ts log-work WEB-25 2h "Work description"
```

## Common Issues
- Port 3000 in use → Next.js auto-switches to 3001
- Supabase auth errors → check `.env.local` keys, run migrations in `supabase/migrations/`
- Type errors in build → run `npm run build` to see full output