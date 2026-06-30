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
