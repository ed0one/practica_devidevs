import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseTasks } from '@/lib/llm'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

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

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('llm', user.id ?? getClientIp(request))
  if (!rl.success) return rateLimitResponse(rl)

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
