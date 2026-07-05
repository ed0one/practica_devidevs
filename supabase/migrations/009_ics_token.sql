-- Token per user pentru abonarea calendarului (feed ICS public, fără cookie).
-- Aplicațiile Google/iOS Calendar fetch-uiesc URL-ul anonim și periodic, deci
-- feed-ul nu poate depinde de sesiune — se autorizează prin acest token.

alter table public.user_prefs
  add column if not exists ics_token uuid;

-- Căutarea în /api/tasks/ics?token=... se face după token; unic și indexat.
create unique index if not exists idx_user_prefs_ics_token
  on public.user_prefs (ics_token)
  where ics_token is not null;
