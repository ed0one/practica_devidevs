import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { TaskUpdateSchema } from '@/lib/schemas'
import { nextOccurrence } from '@/lib/recurrence'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import type { Task } from '@/types/task'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('write', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corp JSON invalid' }, { status: 400 })
  }

  const parsed = TaskUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Date invalide' },
      { status: 400 }
    )
  }
  const updates = parsed.data
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Niciun câmp de actualizat' }, { status: 400 })
  }

  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('write', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })
  }

  const updated = data[0] as Task

  // La finalizarea unui task recurent, generăm automat următoarea apariție.
  // Best-effort: un eșec aici nu trebuie să pice update-ul principal.
  if (updates.status === 'done') {
    const next = nextOccurrence(updated)
    if (next) {
      const { error: spawnErr } = await supabase.from('tasks').insert(next)
      if (spawnErr) console.error('[tasks PATCH] recurrence spawn error:', spawnErr)
    }
  }

  return NextResponse.json(updated)
}
