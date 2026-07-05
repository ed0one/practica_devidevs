import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { tasksToIcs } from '@/lib/ics'
import type { Task } from '@/types/task'

// GET /api/tasks/ics — feed iCalendar (RFC 5545) al task-urilor userului,
// abonabil în Google/iOS Calendar. RLS-scoped la userul curent.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('read', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ics = tasksToIcs((tasks ?? []) as Task[])
  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="taskcapture.ics"',
    },
  })
}
