-- Preferințe de notificare per user + reminder per task

create table if not exists public.user_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Europe/Bucharest',
  reminder_hour int not null default 9 check (reminder_hour between 0 and 23),
  email_daily boolean not null default true,
  email_new_tasks boolean not null default true,
  last_daily_sent_on date,
  updated_at timestamptz not null default now()
);

alter table public.user_prefs enable row level security;

create policy "users manage own prefs"
  on public.user_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reminder per task: cu câte minute înainte de scheduled_start (sau deadline)
-- se trimite emailul. null = fără reminder individual.
alter table public.tasks
  add column if not exists reminder_offset_min int
    check (reminder_offset_min is null or (reminder_offset_min >= 0 and reminder_offset_min <= 10080));

alter table public.tasks
  add column if not exists reminder_sent_at timestamptz;

create index if not exists idx_tasks_reminder
  on public.tasks (reminder_offset_min)
  where reminder_offset_min is not null and reminder_sent_at is null;
