-- Task-uri recurente: none (implicit), daily sau weekly.
-- Când un task recurent e marcat done, aplicația creează automat următoarea
-- apariție (deadline/programare deplasate cu 1 zi / 7 zile).
alter table public.tasks
  add column if not exists recurrence text not null default 'none'
    check (recurrence in ('none', 'daily', 'weekly'));
