import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { computeStats } from '@/lib/stats'
import type { Task } from '@/types/task'

// GET /api/stats — agregări peste task-urile userului curent (RLS-scoped).
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

  return NextResponse.json({ stats: computeStats((tasks ?? []) as Task[]) })
}
