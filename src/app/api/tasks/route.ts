import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ParsedTaskSchema } from '@/lib/schemas'
import { buildTaskRow } from '@/lib/task-rows'
import { sendNewTasksEmail } from '@/lib/resend'
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

export async function GET() {
  const supabase = await getSupabase()

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

  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('write', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const rawInput = parsed.data.raw_input ?? ''
  const rows = parsed.data.tasks.map((t) => buildTaskRow(t, user.id, rawInput))

  const { data, error } = await supabase.from('tasks').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (user.email && data && data.length > 0) {
    sendNewTasksEmail(user.email, data as Task[]).catch((e) =>
      console.error('[tasks POST] email error:', e)
    )
  }

  return NextResponse.json({ tasks: data }, { status: 201 })
}
