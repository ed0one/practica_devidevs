-- Tabelul principal al aplicației
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  deadline    timestamptz,
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category    text,
  status      text not null default 'pending' check (status in ('pending', 'done')),
  raw_input   text,
  created_at  timestamptz not null default now()
);

-- Fiecare user vede doar task-urile lui (Row Level Security)
alter table public.tasks enable row level security;

create policy "Users see own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Index pentru query-ul cel mai frecvent: task-urile unui user sortate după deadline
create index tasks_user_deadline_idx on public.tasks(user_id, deadline asc nulls last);
