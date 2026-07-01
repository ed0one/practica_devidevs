import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReminderEmail } from '@/lib/resend'
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

async function runReminder() {
  const supabase = createAdminClient()

  // Task-urile cu deadline azi (orice oră), încă nefinalizate
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'pending')
    .gte('deadline', todayStart.toISOString())
    .lte('deadline', todayEnd.toISOString())

  if (tasksError) {
    console.error('[send-reminder] query error:', tasksError.message)
    return Response.json({ error: tasksError.message }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return Response.json({ sent: 0, message: 'Nicio task scadentă azi' })
  }

  // Grupează task-urile pe user_id
  const byUser = (tasks as Task[]).reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.user_id]) acc[task.user_id] = []
    acc[task.user_id].push(task)
    return acc
  }, {})

  const results: { userId: string; status: 'sent' | 'error'; reason?: string }[] = []

  for (const [userId, userTasks] of Object.entries(byUser)) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !userData.user?.email) {
      results.push({ userId, status: 'error', reason: userError?.message ?? 'email lipsă' })
      continue
    }

    try {
      await sendReminderEmail(userData.user.email, userTasks)
      results.push({ userId, status: 'sent' })
    } catch (err) {
      console.error(`[send-reminder] email error pentru ${userId}:`, err)
      results.push({ userId, status: 'error', reason: (err as Error).message })
    }
  }

  const sentCount = results.filter((r) => r.status === 'sent').length
  console.log(`[send-reminder] trimise ${sentCount}/${Object.keys(byUser).length}`)

  return Response.json({ sent: sentCount, total: Object.keys(byUser).length, results })
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
