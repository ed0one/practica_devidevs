# TaskCapture

Aplicație web care transformă text natural în task-uri acționabile folosind AI.

**Live:** [www.taskcapture.xyz](https://www.taskcapture.xyz)

---

## Ce face

Scrii în limbaj natural ce ai de făcut ("trebuie să sun la doctor mâine și să trimit raportul până vineri") — AI-ul extrage automat task-urile, le atribuie prioritate, deadline și categorie, și le salvează în dashboard-ul tău personal.

## Funcționalități

- **Input text natural** — extragere task-uri via NVIDIA NIM (Llama 3.1)
- **Dashboard calendar** — vizualizare săptămânală, zilnică și listă cu sort/filtru
- **Programare task-uri** — atribuie oră de start/end în calendar
- **Mark as done / Ștergere** — gestionare task-uri direct din dashboard
- **Email la task-uri noi** — confirmare automată după fiecare adăugare
- **Email reminder zilnic** — notificare la 08:00 cu task-urile scadente azi
- **Autentificare completă** — email/parolă + OAuth GitHub + Google

## Stack

| Componentă | Tehnologie |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Stilizare | Tailwind CSS v4 + shadcn/ui |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| AI | NVIDIA NIM — `meta/llama-3.1-8b-instruct` |
| Email | Resend — domeniu `taskcapture.xyz` |
| Deploy | Vercel + Cron Jobs |
| Animații | Framer Motion |

## Structură

```
src/
├── app/
│   ├── page.tsx                  # Redirect /dashboard sau /login
│   ├── login/                    # Auth email + OAuth
│   ├── register/                 # Înregistrare
│   ├── input/                    # Pagina de input text natural
│   ├── dashboard/                # Dashboard principal
│   └── api/
│       ├── parse-tasks/          # POST: text → NIM → Supabase
│       ├── tasks/[id]/           # PATCH / DELETE task
│       └── send-reminder/        # POST: email reminder (Vercel Cron)
├── components/
│   ├── CalendarView.tsx          # Calendar săptămânal/zilnic
│   ├── TaskCard.tsx              # Card task cu toggle/delete/schedule
│   ├── TaskList.tsx              # Listă cu sort și filtru
│   ├── StatsHeader.tsx           # Statistici (total, finalizate, urgente, scadente)
│   └── ScheduleModal.tsx         # Modal programare oră
├── lib/
│   ├── llm.ts                    # Wrapper NVIDIA NIM
│   ├── schemas.ts                # Zod schemas pentru output LLM
│   ├── resend.ts                 # Email reminder + confirmare
│   └── supabase/                 # Clienți browser / server / admin
└── middleware.ts                 # Protecție rute (redirect dacă neautentificat)
```

## Setup local

```bash
git clone https://github.com/ed0one/practica_devidevs
cd practica_devidevs
npm install
cp .env.example .env.local
# completează variabilele din .env.local
npm run dev
```

### Variabile de mediu necesare

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NVIDIA_NIM_API_KEY=
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_MODEL=meta/llama-3.1-8b-instruct
RESEND_API_KEY=
RESEND_FROM_EMAIL=TaskCapture <noreply@taskcapture.xyz>
REMINDER_CRON_SECRET=
```

### Migrații Supabase

Rulează în ordine în Supabase SQL Editor:

```
supabase/migrations/001_tasks.sql
supabase/migrations/002_tasks_scheduling.sql
supabase/migrations/003_rls_authenticated.sql
```

## Echipă

Proiect de practică UTCB — Web + AI, Grupa A.

| Membru | Contribuții |
|---|---|
| Iliescu | Lead, LLM integration, Resend email, Vercel deploy, auth OAuth, dashboard UI, input page |
| Dincov | Calendar components, scheduling, Jira CLI sync |
| Cîrlea | Login/register pages, middleware auth |
| Dinu | Backend API routes (tasks CRUD) |

## `feat/dincov-dashboard-calendar` — Dashboard & Calendar (Munca Mea)

### Funcționalități Finalizate (WEB-25 până la WEB-28)

| Issue | Funcționalitate | Descriere |
|-------|-----------------|-----------|
| **WEB-25** | Panou Worklog | Adaugă/șterge worklog-uri pe TaskCard (iconiță timer) |
| **WEB-26** | Drag-and-Drop Calendar | Programează task-uri tragând pe săptămână/zi cu `@dnd-kit` |
| **WEB-28** | Sumar Săptămânal | Statistici + grafice CSS (bare, donut) în tab "Sumar" |
| **WEB-27** | Scurtături Tastatură | 9 scurtături globale, apasă `?` pentru ajutor |

### Componente Detinute

```
src/components/
├── CalendarView.tsx      # 4 vizualizări (săptămână/zi/listă/sumar) + drag-drop
├── TaskCard.tsx          # Afișare task + integrare panou worklog
├── WeeklySummary.tsx     # Statistici, grafice bare/donut (CSS pur)
├── ShortcutsHelp.tsx     # Modal scurtături (tasta `?`)
├── WorklogPanel.tsx      # Adaugă/șterge worklog-uri inline
├── ScheduleModal.tsx     # Picker dată + oră pentru programare
├── StatsHeader.tsx       # Carduri statistici dashboard + bară progres
├── TaskList.tsx          # Componentă vizualizare listă
└── JiraSyncStatus.tsx    # (eliminat - mutat în CLI agent)
```

### Fișiere Noi Adăugate

- `src/hooks/useKeyboardShortcuts.ts` — Hook global tastatură
- `src/components/ShortcutsHelp.tsx` — Modal ajutor scurtături
- `src/components/WeeklySummary.tsx` — Statistici săptămânale cu grafice animate
- `src/app/api/worklogs/route.ts` — CRUD worklog-uri
- `supabase/migrations/002_worklogs.sql` — Migrare tabel worklogs
- `src/types/task.ts` — Adăugat `sumar` la ViewMode, câmpuri worklogs

### Detalii UI/UX

- **Limba:** Română exclusiv
- **Animații:** Framer Motion fizică spring, intrare staggered
- **Design:** Glassmorphism, gradient indigo→violet, `rounded-xl`
- **Iconițe:** doar `lucide-react`
- **Calendar:** Lun-Dum, grilă 06:00–21:00, zone drop cu feedback vizual

### Scurtături Tastatură (apasă `?`)

| Tastă | Acțiune |
|-------|---------|
| `⌘/Ctrl+N` | Task nou → `/input` |
| `⌘/Ctrl+K` | Cautare (stub) |
| `?` | Afișează scurtăturile |
| `←/→` | Navighează calendar |
| `Enter` | Comută / programează |
| `Space` | Comută finalizat |
| `D` | Marchează finalizat |
| `S` | Programează |
| `R` | Reîmprospatează |

### Testare (Fără Backend)

```bash
cd taskcapture-testing
npm run dev   # http://localhost:3001
```
- `TESTING_MODE=true` evită autentificarea Supabase
- 6 task-uri mock preîncărcate (WEB-25 până la WEB-28)
- Toate funcționalitățile funcționale: drag-drop, worklog-uri, sumar, scurtături

### Sincronizare Jira (CLI Manual)

```bash
cd ~/.jira-agent
npx tsx src/cli.ts status           # afișează issue-uri asignate
npx tsx src/cli.ts complete WEB-25  # mută în Done
npx tsx src/cli.ts log-work WEB-25 2h "Descriere lucru"
```

---

## Start Rapid (Producție)

```bash
cd taskcapture
npm install
cp .env.example .env.local  # adaugă chei Supabase, NVIDIA, Resend
npm run dev                 # http://localhost:3000
```

**Variabile env necesare:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_NIM_API_KEY`, `RESEND_API_KEY`, `REMINDER_CRON_SECRET`

---

## Tehnologii

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS v4** (`@import "tailwindcss"`)
- **Framer Motion** pentru animații
- **Supabase** auth + bază de date
- **NVIDIA NIM** pentru LLM
- **Resend** pentru email
- **date-fns** (locale ro) pentru calendar
- **@dnd-kit** pentru drag-and-drop