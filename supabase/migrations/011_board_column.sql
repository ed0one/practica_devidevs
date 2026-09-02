-- Kanban real: coloana în care stă task-ul nu se mai deduce din categorie/
-- prioritate, ci se salvează explicit. Plus momentul finalizării, pentru
-- graficul de velocitate (task-uri finalizate pe zi).
--
--   board_column  — todo | inprogress | review | blocked (default todo)
--   completed_at  — setat de API când status devine 'done', golit la 'pending'
--
-- Rulează în Supabase SQL Editor. Idempotent: poate fi rulat de mai multe ori.
-- Până e rulat, aplicația merge, dar mutarea pe coloane nu se salvează
-- (rutele reîncearcă fără aceste coloane și UI-ul afișează un avertisment).

alter table public.tasks
  add column if not exists board_column text not null default 'todo',
  add column if not exists completed_at timestamptz;

-- Postgres nu are ADD CONSTRAINT IF NOT EXISTS; verificăm în pg_constraint.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_board_column_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_board_column_check
      check (board_column in ('todo', 'inprogress', 'review', 'blocked'));
  end if;
end
$$;

-- Rândurile deja finalizate primesc data creării ca aproximare a finalizării,
-- ca să nu dispară din velocitate.
update public.tasks
set completed_at = created_at
where status = 'done' and completed_at is null;

-- Board-ul citește mereu per user și grupează pe coloană.
create index if not exists tasks_user_board_idx
  on public.tasks (user_id, board_column);

-- RLS e deja activ pe public.tasks (001/003); coloanele noi moștenesc
-- politicile existente (auth.uid() = user_id).
