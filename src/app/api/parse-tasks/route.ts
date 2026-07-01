import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { parseTasks } from '@/lib/llm'

const MAX_INPUT_LENGTH = 5000

// Extrage task-urile din text și le RETURNEAZĂ pentru preview — NU le salvează.
// Inserarea se face separat prin POST /api/tasks după confirmarea userului.
export async function POST(request: NextRequest) {
  let text: unknown
  try {
    ({ text } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Corp JSON invalid' }, { status: 400 })
  }

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Text lipsă' }, { status: 400 })
  }
  if (text.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `Textul depășește ${MAX_INPUT_LENGTH} de caractere` },
      { status: 413 }
    )
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

  try {
    const tasks = await parseTasks(text)
    return NextResponse.json({ tasks })
  } catch (err) {
    console.error('[parse-tasks] LLM error:', err)
    return NextResponse.json(
      { error: 'Nu am putut procesa textul. Încearcă din nou.' },
      { status: 502 }
    )
  }
}
