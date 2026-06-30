import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { parseTasks } from '@/lib/llm'
import { sendNewTasksEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  const { text } = await request.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Text lipsă' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tasks = await parseTasks(text)
  if (tasks.length === 0) return NextResponse.json({ tasks: [] })

  const rows = tasks.map((t) => {
    // Build scheduled_* from AI-extracted start_time/end_time + deadline date
    const dateStr = t.deadline ?? new Date().toISOString().substring(0, 10)
    const scheduled_date = (t.start_time || t.end_time) ? dateStr : null
    const scheduled_start = t.start_time ? `${dateStr}T${t.start_time}:00` : null
    const scheduled_end = t.end_time ? `${dateStr}T${t.end_time}:00` : null

    return {
      user_id: user.id,
      title: t.title,
      deadline: t.deadline,
      priority: t.priority,
      category: t.category,
      status: 'pending' as const,
      raw_input: text,
      scheduled_date,
      scheduled_start,
      scheduled_end,
    }
  })

  if (rows.length === 0) return NextResponse.json({ tasks: [] })

  const { data, error } = await supabase.from('tasks').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (user.email && data) {
    sendNewTasksEmail(user.email, data as never).catch(() => {})
  }

  return NextResponse.json({ tasks: data })
}
