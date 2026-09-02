import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { isMissingColumnError } from '@/lib/supabase/optional-columns'

const BulkSchema = z.object({
  action: z.enum(['done', 'pending', 'delete']),
  ids: z.array(z.string().uuid()).min(1).max(200),
})

// POST /api/tasks/bulk — acțiuni în masă (marchează done/pending, șterge).
// RLS + `.eq('user_id')` garantează că se ating doar propriile task-uri.
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corp JSON invalid' }, { status: 400 })
  }

  const parsed = BulkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Date invalide' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('write', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const { action, ids } = parsed.data

  if (action === 'delete') {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user.id)
      .in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: ids.length })
  }

  const completedAt = action === 'done' ? new Date().toISOString() : null
  let { data, error } = await supabase
    .from('tasks')
    .update({ status: action, completed_at: completedAt })
    .eq('user_id', user.id)
    .in('id', ids)
    .select('id')
  // Migrația 011 nerulată → actualizăm doar statusul.
  if (error && isMissingColumnError(error)) {
    ;({ data, error } = await supabase
      .from('tasks')
      .update({ status: action })
      .eq('user_id', user.id)
      .in('id', ids)
      .select('id'))
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: data?.length ?? 0 })
}
