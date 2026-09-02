import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TaskUpdateSchema } from '@/lib/schemas'
import { nextOccurrence } from '@/lib/recurrence'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { sendTaskUpdatedEmail } from '@/lib/resend'
import {
  isMissingColumnError,
  stripOptionalColumns,
  hasOptionalColumns,
  MIGRATION_011_MESSAGE,
} from '@/lib/supabase/optional-columns'
import type { Task } from '@/types/task'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('write', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  // completed_at e gestionat de server: setat la finalizare, golit la reactivare.
  const payload: Record<string, unknown> = { ...updates }
  if (updates.status === 'done') payload.completed_at = new Date().toISOString()
  else if (updates.status === 'pending') payload.completed_at = null

  let { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  // Migrația 011 nerulată → reîncercăm fără coloanele opționale. Dacă nu mai
  // rămâne nimic de actualizat (ex: doar board_column), spunem clar ce lipsește.
  if (error && isMissingColumnError(error) && hasOptionalColumns(payload)) {
    const fallback = stripOptionalColumns(payload)
    if (Object.keys(fallback).length === 0) {
      return NextResponse.json(
        { error: MIGRATION_011_MESSAGE, code: 'MIGRATION_011_REQUIRED' },
        { status: 409 }
      )
    }
    ;({ data, error } = await supabase
      .from('tasks')
      .update(fallback)
      .eq('id', id)
      .eq('user_id', user.id)
      .select())
  }

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

  // Trimitem email de confirmare actualizare (best-effort)
  try {
    const { data: prefs } = await supabase
      .from('user_prefs')
      .select('email_task_updates')
      .eq('user_id', user.id)
      .maybeSingle()
    if (prefs?.email_task_updates) {
      await sendTaskUpdatedEmail(user.email!, updated)
    }
  } catch (emailErr) {
    console.error('[tasks PATCH] email send error:', emailErr)
  }

  return NextResponse.json(updated)
}
