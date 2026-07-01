import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReminderEmail, sendTaskReminderEmail } from '@/lib/resend'
import type { Task } from '@/types/task'

// Vercel Cron injectează automat `Authorization: Bearer ${CRON_SECRET}` folosind
// variabila numită exact CRON_SECRET. Acceptăm și REMINDER_CRON_SECRET ca
// fallback pentru trigger manual (curl) și compatibilitate.
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const secrets = [process.env.CRON_SECRET, process.env.REMINDER_CRON_SECRET].filter(Boolean)
  if (secrets.length === 0) return false
  return secrets.some((s) => authHeader === `Bearer ${s}`)
}

interface PrefsRow {
  user_id: string
  timezone: string
  reminder_hour: number
  email_daily: boolean
  last_daily_sent_on: string | null
}

const DEFAULT_TZ = 'Europe/Bucharest'
const DEFAULT_HOUR = 9

// Ora și data locală într-un timezone IANA, fără librării externe.
function localNow(tz: string): { hour: number; dateStr: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date())
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
    return {
      hour: parseInt(get('hour'), 10) % 24,
      dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    }
  } catch {
    return localNow(DEFAULT_TZ)
  }
}

// ─── Digest zilnic la ora locală a fiecărui user ─────────────────────────────
async function runDailyDigest(supabase: ReturnType<typeof createAdminClient>) {
  const { data: prefsRows, error } = await supabase
    .from('user_prefs')
    .select('user_id, timezone, reminder_hour, email_daily, last_daily_sent_on')

  if (error) {
    // Tabela user_prefs poate lipsi dacă migration 005 nu e rulată — degradăm
    console.error('[send-reminder] prefs query error:', error.message)
    return { sent: 0, error: error.message }
  }

  const prefsByUser = new Map<string, PrefsRow>(
    ((prefsRows ?? []) as PrefsRow[]).map((p) => [p.user_id, p])
  )

  // Toate task-urile pending cu deadline — filtrăm pe data locală per user
  const { data: allTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'pending')
    .not('deadline', 'is', null)

  if (tasksError) {
    console.error('[send-reminder] tasks query error:', tasksError.message)
    return { sent: 0, error: tasksError.message }
  }

  const byUser = ((allTasks ?? []) as Task[]).reduce<Record<string, Task[]>>((acc, t) => {
    ;(acc[t.user_id] ??= []).push(t)
    return acc
  }, {})

  let sent = 0
  for (const [userId, userTasks] of Object.entries(byUser)) {
    const prefs = prefsByUser.get(userId)
    const tz = prefs?.timezone ?? DEFAULT_TZ
    const hour = prefs?.reminder_hour ?? DEFAULT_HOUR
    const emailDaily = prefs?.email_daily ?? true

    if (!emailDaily) continue

    const { hour: nowHour, dateStr: localToday } = localNow(tz)
    if (nowHour !== hour) continue // nu e încă ora userului
    if (prefs?.last_daily_sent_on === localToday) continue // deja trimis azi

    // task-urile cu deadline AZI în timezone-ul userului
    const dueToday = userTasks.filter((t) => t.deadline?.substring(0, 10) === localToday)
    if (dueToday.length === 0) continue

    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    if (!userData.user?.email) continue

    try {
      await sendReminderEmail(userData.user.email, dueToday)
      await supabase
        .from('user_prefs')
        .upsert(
          { user_id: userId, last_daily_sent_on: localToday },
          { onConflict: 'user_id' }
        )
      sent++
    } catch (err) {
      console.error(`[send-reminder] digest error pentru ${userId}:`, err)
    }
  }
  return { sent }
}

// ─── Remindere per-task ("cu 30 min înainte" etc.) ───────────────────────────
async function runTaskReminders(supabase: ReturnType<typeof createAdminClient>) {
  const { data: rows, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'pending')
    .not('reminder_offset_min', 'is', null)
    .is('reminder_sent_at', null)

  if (error) {
    // coloana poate lipsi fără migration 005
    console.error('[send-reminder] reminder query error:', error.message)
    return { sent: 0, error: error.message }
  }

  const now = Date.now()
  let sent = 0

  for (const task of (rows ?? []) as Task[]) {
    // Momentul țintă: scheduled_start, altfel deadline la 09:00 local naive
    const anchor = task.scheduled_start ?? (task.deadline ? `${task.deadline.substring(0, 10)}T09:00:00` : null)
    if (!anchor) continue

    // string local naive → epoch aproximat în UTC; comparăm cu fereastra cron
    const dueMs = new Date(anchor).getTime()
    if (Number.isNaN(dueMs)) continue

    const fireAt = dueMs - (task.reminder_offset_min ?? 0) * 60_000
    // fereastră de 65 min în urmă (cron orar) + nu trimite dacă a trecut deja de start
    if (fireAt > now || fireAt < now - 65 * 60_000) continue

    const { data: userData } = await supabase.auth.admin.getUserById(task.user_id)
    if (!userData.user?.email) continue

    try {
      await sendTaskReminderEmail(userData.user.email, task, task.reminder_offset_min ?? 0)
      await supabase
        .from('tasks')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', task.id)
      sent++
    } catch (err) {
      console.error(`[send-reminder] task reminder error pentru ${task.id}:`, err)
    }
  }
  return { sent }
}

async function runReminder() {
  const supabase = createAdminClient()
  const [digest, perTask] = await Promise.all([
    runDailyDigest(supabase),
    runTaskReminders(supabase),
  ])
  console.log(`[send-reminder] digest: ${digest.sent}, per-task: ${perTask.sent}`)
  return Response.json({ digest, perTask })
}

// Vercel Cron invocă endpoint-ul cu GET.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runReminder()
}

// Păstrat pentru trigger manual (ex: test cu curl -X POST).
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runReminder()
}
