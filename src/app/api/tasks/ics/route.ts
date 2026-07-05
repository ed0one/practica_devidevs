import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { tasksToIcs } from '@/lib/ics'
import type { Task } from '@/types/task'

// GET /api/tasks/ics — feed iCalendar (RFC 5545) al task-urilor userului,
// abonabil în Google/iOS Calendar.
//
// Două moduri de autorizare:
//  • ?token=<uuid>  → feed public, citit anonim de aplicația de calendar.
//    Autorizat prin token (nu prin cookie): aplicațiile de calendar fetch-uiesc
//    URL-ul periodic fără sesiune. Folosește admin client filtrat manual pe
//    user_id — cazul legit fără sesiune. Vezi migrarea 009.
//  • fără token     → sesiune curentă (download manual din browser).
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  let userId: string
  let db: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>
  // Fusul userului: orele de perete ale task-urilor se ancorează în el la
  // conversia în UTC, ca evenimentele să apară la ora corectă în calendar.
  let tz = 'Europe/Bucharest'

  if (token) {
    const admin = createAdminClient()
    const { data: pref } = await admin
      .from('user_prefs')
      .select('user_id, timezone')
      .eq('ics_token', token)
      .maybeSingle()

    if (!pref) return NextResponse.json({ error: 'Token invalid' }, { status: 401 })
    userId = pref.user_id as string
    if (pref.timezone) tz = pref.timezone as string
    db = admin
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
    const { data: pref } = await supabase
      .from('user_prefs')
      .select('timezone')
      .eq('user_id', userId)
      .maybeSingle()
    if (pref?.timezone) tz = pref.timezone as string
    db = supabase
  }

  const rl = await checkRateLimit('read', userId)
  if (!rl.success) return rateLimitResponse(rl)

  const { data: tasks, error } = await db
    .from('tasks')
    .select('*')
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ics = tasksToIcs((tasks ?? []) as Task[], new Date(), tz)
  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      // Fără `attachment`: feed abonabil în calendar, nu forțat la download.
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
