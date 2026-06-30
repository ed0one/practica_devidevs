-- Tabela tasks + Row Level Security.
-- Rulează în Supabase SQL Editor.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  deadline timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category text,
  status text not null default 'pending' check (status in ('pending', 'done')),
  raw_input text,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

alter table public.tasks enable row level security;

-- Fiecare user vede / scrie doar task-urile lui.
create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);

create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);
