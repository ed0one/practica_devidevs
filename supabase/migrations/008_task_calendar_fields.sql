-- Câmpuri stil calendar (Google/iOS Calendar) pe task-uri:
--   description  — notițe libere (markdown ușor)
--   all_day      — eveniment pe toată ziua (fără ore)
--   location     — locație text liber
--   color        — culoare hex pentru afișare în calendar (ex: "#ff6a3d")
--   subtasks     — checklist: [{ "id": "...", "title": "...", "done": false }]
alter table public.tasks
  add column if not exists description text,
  add column if not exists all_day     boolean not null default false,
  add column if not exists location     text,
  add column if not exists color        text,
  add column if not exists subtasks     jsonb   not null default '[]'::jsonb;

-- RLS e deja activ pe public.tasks (migrațiile 001/003); coloanele noi moștenesc
-- automat politicile existente — nu e nevoie de policy-uri suplimentare.
