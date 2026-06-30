# Practica DeviDevs

Team project for summer practice 2026.

## Branches

| Branch | Owner | Scope |
|--------|-------|-------|
| `feat/dincov-dashboard-calendar` | **Dincov** | Dashboard UI, Calendar, TaskCard, Worklog, Weekly Summary, Keyboard Shortcuts |
| `GeorgeDinu22` | **Dinu** | Backend API, Supabase, LLM integration, parse-tasks |
| `proiect-calin` | **Cîrlea** | Auth (login/register), middleware, input page |
| `main` | — | Base repo |

---

## `feat/dincov-dashboard-calendar` — Dashboard & Calendar (My Work)

### Features Completed (WEB-25 through WEB-28)

| Issue | Feature | Description |
|-------|---------|-------------|
| **WEB-25** | Worklog Panel | Add/delete worklog entries on TaskCard with timer icon |
| **WEB-26** | Drag-and-Drop Calendar | Schedule tasks by dragging onto week/day slots using `@dnd-kit` |
| **WEB-28** | Weekly Summary | Stats + CSS charts (bar, donut) in "Sumar" tab |
| **WEB-27** | Keyboard Shortcuts | 9 global shortcuts, press `?` for help modal |

### Components Owned

```
src/components/
├── CalendarView.tsx      # 4 views (week/day/list/sumar) + drag-drop
├── TaskCard.tsx          # Task display + worklog panel integration
├── WeeklySummary.tsx     # Stats, bar/donut charts (pure CSS)
├── ShortcutsHelp.tsx     # Shortcuts modal (? key)
├── WorklogPanel.tsx      # Add/delete worklogs inline
├── ScheduleModal.tsx     # Date + time picker for scheduling
├── StatsHeader.tsx       # Dashboard stats cards + progress bar
├── TaskList.tsx          # List view component
└── JiraSyncStatus.tsx    # (removed - moved to CLI agent)
```

### New Files Added

- `src/hooks/useKeyboardShortcuts.ts` — Global keyboard hook
- `src/components/ShortcutsHelp.tsx` — Shortcuts help modal
- `src/components/WeeklySummary.tsx` — Weekly stats with animated charts
- `src/app/api/worklogs/route.ts` — CRUD for worklogs
- `supabase/migrations/002_worklogs.sql` — Worklogs table migration
- `src/types/task.ts` — Added `sumar` to ViewMode, worklogs fields

### UI/UX Details

- **Language:** Romanian only
- **Animations:** Framer Motion spring physics, staggered entrance
- **Design:** Glassmorphism, indigo→violet gradients, `rounded-xl`
- **Icons:** `lucide-react` only
- **Calendar:** Mon-Sun, 06:00–21:00 grid, drop zones with visual feedback

### Keyboard Shortcuts (press `?`)

| Key | Action |
|-----|--------|
| `⌘/Ctrl+N` | New task → `/input` |
| `⌘/Ctrl+K` | Search (stub) |
| `?` | Show shortcuts |
| `←/→` | Navigate calendar |
| `Enter` | Toggle / schedule |
| `Space` | Toggle done |
| `D` | Mark done |
| `S` | Schedule |
| `R` | Refresh |

### Testing (No Backend Required)

```bash
cd taskcapture-testing
npm run dev   # http://localhost:3001
```
- `TESTING_MODE=true` bypasses Supabase auth
- 6 mock tasks pre-loaded (WEB-25 through WEB-28)
- All features functional: drag-drop, worklogs, summary, shortcuts

### Jira Sync (Manual CLI)

```bash
cd ~/.jira-agent
npx tsx src/cli.ts status           # show assigned issues
npx tsx src/cli.ts complete WEB-25  # move to Done
npx tsx src/cli.ts log-work WEB-25 2h "Work description"
```

---

## Quick Start (Production)

```bash
cd taskcapture
npm install
cp .env.example .env.local  # add Supabase, NVIDIA, Resend keys
npm run dev                 # http://localhost:3000
```

**Required env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_NIM_API_KEY`, `RESEND_API_KEY`, `REMINDER_CRON_SECRET`

---

## Tech Stack

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS v4** (`@import "tailwindcss"`)
- **Framer Motion** for animations
- **Supabase** auth + database
- **NVIDIA NIM** for LLM
- **Resend** for email
- **date-fns** (ro locale) for calendar
- **@dnd-kit** for drag-and-drop