import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// Neutralizează caracterele speciale ale PostgREST `.ilike` (`,`, `%`, `\`)
// ca inputul userului să nu spargă filtrul sau să scaneze tot.
function escapeIlike(s: string): string {
  return s.replace(/[\\%,()]/g, (c) => '\\' + c)
}

const PRIORITIES = new Set(['low', 'medium', 'high'])
const STATUSES = new Set(['pending', 'done'])

// GET /api/tasks/search — căutare + filtre peste task-urile userului.
// Query params: q, status, priority, category, from, to (deadline YYYY-MM-DD).
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('read', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const sp = request.nextUrl.searchParams
  let query = supabase.from('tasks').select('*').eq('user_id', user.id)

  const q = sp.get('q')?.trim()
  if (q) {
    const like = `%${escapeIlike(q.slice(0, 200))}%`
    query = query.or(`title.ilike.${like},description.ilike.${like},category.ilike.${like}`)
  }

  const status = sp.get('status')
  if (status && STATUSES.has(status)) query = query.eq('status', status)

  const priority = sp.get('priority')
  if (priority && PRIORITIES.has(priority)) query = query.eq('priority', priority)

  const category = sp.get('category')?.trim()
  if (category) query = query.eq('category', category.slice(0, 100))

  const from = sp.get('from')
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte('deadline', from)

  const to = sp.get('to')
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lte('deadline', to)

  const { data: tasks, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tasks })
}
