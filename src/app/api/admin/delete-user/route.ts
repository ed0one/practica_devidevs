import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/admin/delete-user — șterge un user (și task-urile lui prin cascade).
// STRICT dev: 404 în producție, la fel ca pagina /admin, ca să nu expunem
// niciodată o acțiune destructivă cu service-role pe live.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { userId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corp JSON invalid' }, { status: 400 })
  }
  if (!body.userId) {
    return NextResponse.json({ error: 'userId lipsă' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(body.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
