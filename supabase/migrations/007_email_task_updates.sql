-- Adaugă preferința pentru email la editare task

alter table public.user_prefs
  add column if not exists email_task_updates boolean not null default true;