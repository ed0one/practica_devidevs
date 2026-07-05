import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// Gestionează token-ul de abonare la feed-ul ICS (vezi ../route.ts).
// POST   → generează/rotește token-ul (invalidează abonamentele vechi)
// DELETE → revocă token-ul (oprește sincronizarea)

// POST /api/tasks/ics/token — creează sau rotește token-ul.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('write', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const token = randomUUID()
  const { error } = await supabase
    .from('user_prefs')
    .upsert(
      { user_id: user.id, ics_token: token, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ics_token: token })
}

// DELETE /api/tasks/ics/token — revocă token-ul.
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit('write', user.id)
  if (!rl.success) return rateLimitResponse(rl)

  const { error } = await supabase
    .from('user_prefs')
    .update({ ics_token: null, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ics_token: null })
}
