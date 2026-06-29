alter table public.tasks
  add column if not exists scheduled_date  date,
  add column if not exists scheduled_start timestamptz,
  add column if not exists scheduled_end   timestamptz,
  add column if not exists jira_issue_key  text;
