-- Blochează serverside signup-urile cu email temporar (temp-mail).
-- Enforcement real, nebypassabil din client: un „Before User Created" auth hook
-- (Postgres) inspectează emailul și respinge crearea userului dacă domeniul e
-- disposable. Pandant al blocklist-ului din src/lib/email-domains.ts (acela e
-- doar UX-hint în pagina de register).
--
-- ⚠️ DUPĂ ce rulezi acest fișier trebuie să ACTIVEZI hook-ul din dashboard:
--   Authentication → Hooks → „Before User Created" → Postgres →
--   selectează funcția public.hook_reject_disposable_email.
-- Fără pasul ăsta funcția există dar nu e apelată de Auth.

-- Tabel cu domeniile interzise (extensibil fără redeploy).
create table if not exists public.disposable_email_domains (
  domain text primary key,
  reason text default null,
  created_at timestamptz not null default now()
);

-- Doar auth admin-ul citește tabelul; nu-l expunem clienților.
grant select on table public.disposable_email_domains to supabase_auth_admin;
revoke all on table public.disposable_email_domains from authenticated, anon, public;

insert into public.disposable_email_domains (domain, reason) values
  ('dristor.com', 'temp-mail'),
  ('divahd.com', 'temp-mail'),
  ('mailinator.com', 'temp-mail'),
  ('guerrillamail.com', 'temp-mail'),
  ('guerrillamail.info', 'temp-mail'),
  ('sharklasers.com', 'temp-mail'),
  ('10minutemail.com', 'temp-mail'),
  ('tempmail.com', 'temp-mail'),
  ('temp-mail.org', 'temp-mail'),
  ('yopmail.com', 'temp-mail'),
  ('throwawaymail.com', 'temp-mail'),
  ('trashmail.com', 'temp-mail'),
  ('getnada.com', 'temp-mail'),
  ('maildrop.cc', 'temp-mail'),
  ('mohmal.com', 'temp-mail'),
  ('fakeinbox.com', 'temp-mail'),
  ('dispostable.com', 'temp-mail'),
  ('mailnesia.com', 'temp-mail'),
  ('mintemail.com', 'temp-mail'),
  ('tempinbox.com', 'temp-mail'),
  ('emailondeck.com', 'temp-mail'),
  ('moakt.com', 'temp-mail'),
  ('tempr.email', 'temp-mail'),
  ('discard.email', 'temp-mail'),
  ('inboxkitten.com', 'temp-mail'),
  ('mailcatch.com', 'temp-mail'),
  ('nada.email', 'temp-mail')
on conflict (domain) do nothing;

-- Hook-ul: primește event jsonb, întoarce {} ca să permită, sau {error:{...}}
-- ca să respingă. Contract Supabase „before-user-created".
create or replace function public.hook_reject_disposable_email(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text;
  email_domain text;
  hit int;
begin
  email := event->'user'->>'email';
  -- Fără email (ex. signup pe telefon) → nu ne băgăm.
  if email is null or email = '' then
    return '{}'::jsonb;
  end if;

  email_domain := lower(split_part(email, '@', 2));

  select count(*) into hit
  from public.disposable_email_domains d
  where lower(d.domain) = email_domain;

  if hit > 0 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', 'Folosește un email real, nu unul temporar.',
        'http_code', 400
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

-- Doar Auth-ul poate executa hook-ul.
grant execute on function public.hook_reject_disposable_email to supabase_auth_admin;
revoke execute on function public.hook_reject_disposable_email from authenticated, anon, public;
