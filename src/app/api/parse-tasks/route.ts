import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { parseTasks } from '@/lib/llm'
import { ParsedTasksResponseSchema } from '@/lib/schemas'

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

  const raw = await parseTasks(text)
  const parsed = ParsedTasksResponseSchema.parse(raw)

  const rows = parsed.tasks.map((t) => ({
    user_id: user.id,
    title: t.title,
    deadline: t.deadline,
    priority: t.priority,
    category: t.category,
    status: 'pending' as const,
    raw_input: text,
    scheduled_date: null,
    scheduled_start: null,
    scheduled_end: null,
  }))

  const { data, error } = await supabase.from('tasks').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tasks: data })
}
