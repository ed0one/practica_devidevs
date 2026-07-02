-- 006: Scheduler orar pentru remindere (Supabase pg_cron + pg_net)
--
-- PROBLEMA: Vercel Hobby permite doar cron ZILNIC. /api/send-reminder era apelat
-- o singură dată pe zi (06:00 UTC), deci:
--   - digestul ajungea DOAR la userii a căror oră locală == 06:00 UTC
--     (practic doar default-ul reminder_hour=9 în Europe/Bucharest vara);
--   - reminderele per-task (fereastră de 65 min) nu se declanșau aproape
--     niciodată — doar dacă task-ul nimerea în fereastra aia unică.
--
-- SOLUȚIA: rulăm scheduler-ul din Postgres, ORAR, independent de planul Vercel.
-- Endpoint-ul e idempotent (last_daily_sent_on, reminder_sent_at), deci apelurile
-- dese nu produc emailuri duble.
--
-- PREREQ (o singură dată): Dashboard → Database → Extensions, activează:
--   pg_cron, pg_net
-- (sau lasă `create extension` de mai jos să le activeze, dacă ai drepturi).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ⚠️ SECURITATE: secretul ajunge în plaintext în catalogul cron (cron.job).
--   - folosește ACELAȘI string ca env var CRON_SECRET din Vercel;
--   - nu comita valoarea reală (fișierul ăsta rămâne cu placeholder);
--   - rotește-l dacă dumpezi vreodată schema.
--
-- ÎNLOCUIEȘTE <CRON_SECRET> și, dacă e cazul, URL-ul, ÎNAINTE de a rula.

select cron.schedule(
  'taskcapture-reminders-hourly',
  '0 * * * *',
  $$
    select net.http_post(
      url     := 'https://www.taskcapture.xyz/api/send-reminder',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer <CRON_SECRET>'
      )
    );
  $$
);

-- După asta cronul zilnic din vercel.json e redundant; îl poți lăsa (backup,
-- idempotent) sau scoate. Cele două nu se bat cap în cap.
--
-- Utile:
--   select * from cron.job;                                           -- jobul programat
--   select * from cron.job_run_details order by start_time desc limit 20;  -- istoric rulări
--   select cron.unschedule('taskcapture-reminders-hourly');           -- dezactivare
