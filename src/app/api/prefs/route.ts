import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserPrefsSchema } from '@/lib/schemas'

const DEFAULTS = {
  timezone: 'Europe/Bucharest',
  reminder_hour: 9,
  email_daily: true,
  email_new_tasks: true,
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_prefs')
    .select('timezone, reminder_hour, email_daily, email_new_tasks')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ prefs: data ?? DEFAULTS })
}

export async function PUT(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corp JSON invalid' }, { status: 400 })
  }

  const parsed = UserPrefsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Date invalide' },
      { status: 400 }
    )
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Niciun câmp de actualizat' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_prefs')
    .upsert(
      { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select('timezone, reminder_hour, email_daily, email_new_tasks')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ prefs: data })
}
