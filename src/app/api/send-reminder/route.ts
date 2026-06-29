import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReminderEmail } from '@/lib/resend'
import type { Task } from '@/types/task'

export async function POST(request: NextRequest) {
  const secret = process.env.REMINDER_CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Selectează task-urile cu deadline azi (orice oră), neprelucrate încă
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
      results.push({ userId, status: 'error', reason: (err as Error).message })
    }
  }

  const sentCount = results.filter((r) => r.status === 'sent').length

  return Response.json({ sent: sentCount, total: Object.keys(byUser).length, results })
}
