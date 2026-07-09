# TaskCapture

Transformă text liber în task-uri structurate. Scrii „trebuie să sun la doctor săptămâna asta" și primești un task cu titlu, deadline, prioritate și categorie, salvat în contul tău.

**Live:** _[adaugă URL-ul de Vercel după deploy]_

<!-- TODO: 2-3 capturi de ecran sau un GIF scurt aici, după ce UI-ul e gata -->

## Cum funcționează

```
text liber → POST /api/parse-tasks → LLM (Llama 3.1 70B via NVIDIA NIM)
           → validare strictă cu Zod → insert în Supabase (Postgres + RLS)
```

Promptul injectează data curentă ca LLM-ul să rezolve deadline-uri relative („vineri", „mâine") în timestamp-uri ISO 8601. Dacă modelul întoarce o formă invalidă, Zod respinge răspunsul și API-ul întoarce 422 în loc să salveze date corupte.

## API

| Rută | Metodă | Ce face |
|---|---|---|
| `/api/parse-tasks` | POST | Primește text liber, extrage task-uri cu LLM, le salvează |
| `/api/tasks` | GET | Listează task-urile userului logat |
| `/api/tasks/[id]` | PATCH / DELETE | Marchează done/pending sau șterge un task |

Toate rutele cer autentificare (Supabase Auth) și au rate limiting per IP (Upstash Redis): 12 cereri/min pe ruta cu LLM, 60/min pe citire, 30/min pe scriere.

## Tech stack

- **Next.js 16** (App Router, Route Handlers)
- **Supabase** — auth + Postgres cu Row Level Security (fiecare user își vede doar task-urile lui)
- **NVIDIA NIM** — Llama 3.1 70B pentru extragerea structurată a task-urilor
- **Zod** — validare pe input-ul userului și pe răspunsul LLM-ului
- **Upstash Redis** — rate limiting pe toate rutele API
- **Tailwind CSS**

## Rulare locală

```bash
npm install
cp .env.example .env.local   # completează valorile (vezi mai jos)
npm run dev                   # http://localhost:3000
```

Baza de date: rulează `supabase/schema.sql` în Supabase SQL Editor (creează tabela `tasks` + politicile RLS).

### Variabile de mediu

Vezi [.env.example](.env.example). Ai nevoie de un proiect Supabase, o cheie NVIDIA NIM (build.nvidia.com) și o bază Upstash Redis — toate au free tier.

## Status

Proiect de practică DeviDevs (iunie–iulie 2026). Backend-ul (API + LLM + DB) e funcțional; UI-ul e în lucru.

**Construit de [George Dinu](https://github.com/GeorgeDinu22)** — API layer, integrare LLM, schema DB, rate limiting.
