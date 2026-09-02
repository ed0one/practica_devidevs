import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import type { Task } from '@/types/task'
import { isMissingColumnError, stripOptionalColumns } from '@/lib/supabase/optional-columns'

// POST /api/tasks/[id]/duplicate — creează o copie a task-ului curent.
// Copia pornește ca `pending`, fără reminder trimis, cu subtask-urile
// re-bifate ca nefinalizate. RLS garantează că se poate copia doar propriul task.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('write', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const { data: original, error: fetchErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  if (!original) return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })

  const src = original as Task
  const subtasks = (src.subtasks ?? []).map((s) => ({ ...s, done: false }))

  // Copiem doar câmpurile de conținut; id/created_at/reminder_sent_at le lasă DB-ul.
  const copy = {
    user_id: user.id,
    title: `${src.title} (copie)`.slice(0, 500),
    deadline: src.deadline,
    priority: src.priority,
    category: src.category,
    status: 'pending' as const,
    raw_input: src.raw_input,
    scheduled_date: src.scheduled_date,
    scheduled_start: src.scheduled_start,
    scheduled_end: src.scheduled_end,
    recurrence: src.recurrence,
    reminder_offset_min: src.reminder_offset_min ?? null,
    description: src.description ?? null,
    all_day: src.all_day ?? false,
    location: src.location ?? null,
    color: src.color ?? null,
    subtasks,
    board_column: src.board_column ?? 'todo',
  }

  let { data, error } = await supabase.from('tasks').insert(copy).select().single()
  // Migrația 011 nerulată → copiem fără coloana Kanban.
  if (error && isMissingColumnError(error)) {
    ;({ data, error } = await supabase.from('tasks').insert(stripOptionalColumns(copy)).select().single())
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
