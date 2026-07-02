import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { ParsedTaskSchema } from '@/lib/schemas'
import { buildTaskRow } from '@/lib/task-rows'
import { sendNewTasksEmail } from '@/lib/resend'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import type { Task } from '@/types/task'

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
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tasks })
}

const CreateTasksSchema = z.object({
  tasks: z.array(ParsedTaskSchema).min(1).max(50),
  raw_input: z.string().max(5000).optional(),
})

// Inserează task-uri confirmate de user (după preview). Fiecare task e
// re-validat cu ParsedTaskSchema — nu ne bazăm pe payload-ul clientului.
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corp JSON invalid' }, { status: 400 })
  }

  const parsed = CreateTasksSchema.safeParse(body)
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

  // Citim prefs o singură dată, ÎNAINTE de build: timezone-ul e folosit ca
  // „azi" al userului pentru task-urile fără deadline (evită off-by-one la
  // miezul nopții), iar email_new_tasks decide confirmarea pe email.
  const { data: prefs } = await supabase
    .from('user_prefs')
    .select('timezone, email_new_tasks')
    .eq('user_id', user.id)
    .maybeSingle()

  const rawInput = parsed.data.raw_input ?? ''
  const rows = parsed.data.tasks.map((t) =>
    buildTaskRow(t, user.id, rawInput, new Date(), prefs?.timezone)
  )

  const { data, error } = await supabase.from('tasks').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (user.email && data && data.length > 0 && prefs?.email_new_tasks !== false) {
    // respectă preferința userului (default: trimite)
    sendNewTasksEmail(user.email, data as Task[]).catch((e) =>
      console.error('[tasks POST] email error:', e)
    )
  }

  return NextResponse.json({ tasks: data }, { status: 201 })
}
