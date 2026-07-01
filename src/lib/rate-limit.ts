import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

// Lazy init — la build env vars pot lipsi; fără ele rate limiting-ul e dezactivat
// (fail-open) ca să nu blocheze dev-ul local sau build-ul.
let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

type LimiterKind = 'read' | 'write' | 'llm'

const LIMITS: Record<LimiterKind, { requests: number; window: `${number} s` }> = {
  read: { requests: 60, window: '60 s' },
  write: { requests: 30, window: '60 s' },
  llm: { requests: 12, window: '60 s' },
}

function getLimiter(kind: LimiterKind): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  let limiter = limiters.get(kind)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(LIMITS[kind].requests, LIMITS[kind].window),
      analytics: false,
      prefix: `taskcapture_${kind}`,
    })
    limiters.set(kind, limiter)
  }
  return limiter
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number // epoch ms când se resetează fereastra
}

// Verifică rate limit-ul pentru un request. identifier = user id sau IP.
// Dacă Upstash nu e configurat sau dă eroare, permite request-ul (fail-open).
export async function checkRateLimit(
  kind: LimiterKind,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(kind)
  if (!limiter) return { success: true, remaining: -1, reset: 0 }
  try {
    const { success, remaining, reset } = await limiter.limit(identifier)
    return { success, remaining, reset }
  } catch (err) {
    console.error('[rate-limit] Upstash error:', err)
    return { success: true, remaining: -1, reset: 0 }
  }
}

export function rateLimitResponse(result: RateLimitResult) {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
  return new Response(
    JSON.stringify({ error: 'Prea multe cereri. Încearcă din nou în câteva secunde.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  )
}
