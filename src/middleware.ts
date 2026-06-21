import { NextRequest, NextResponse } from 'next/server'

/**
 * Lightweight rate limiter for API routes only.
 * In preview/proxy environments all requests appear from one IP,
 * so we use a very generous limit to avoid false positives.
 * The primary 429 defense is server-side query optimization + caching,
 * not client-blocking rate limiting.
 */

const WINDOW_MS = 60_000 // 1-minute window
const MAX_REQUESTS_PER_WINDOW = 200 // 200 req/min — generous for proxy environments
const MAX_MAP_SIZE = 1000 // Prevent memory leaks

// Lazy-initialize on the global to survive HMR / Edge re-instantiation
const g = globalThis as unknown as { __rateLimitMap?: Map<string, { count: number; resetTime: number }> }
if (!g.__rateLimitMap) g.__rateLimitMap = new Map()
const rateLimitMap = g.__rateLimitMap

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()

  // Evict expired entries + cap map size to prevent unbounded growth
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) rateLimitMap.delete(key)
    }
    // If still too large, clear entirely (safe — just resets all counters)
    if (rateLimitMap.size > MAX_MAP_SIZE) rateLimitMap.clear()
  }

  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > MAX_REQUESTS_PER_WINDOW
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request)

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const entry = rateLimitMap.get(ip)
    const response = NextResponse.next()
    if (entry) {
      response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW))
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count)))
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}
