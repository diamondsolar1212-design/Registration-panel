import { useAuthStore } from '@/store/auth-store'

// Request deduplication: prevents multiple identical in-flight requests
const pendingRequests = new Map<string, Promise<Response>>()

/**
 * Authenticated fetch wrapper — automatically attaches the
 * Authorization Bearer token (from Supabase Auth) or the
 * fallback user-id header (for API-only auth sessions).
 * 
 * Features:
 * - Auto-includes auth headers
 * - Retry with exponential backoff on 429 (Too Many Requests)
 * - Request deduplication for GET requests (prevents duplicate API calls)
 * 
 * Usage: same as fetch(), but auto-includes auth headers.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { accessToken, user } = useAuthStore.getState()

  const headers = new Headers(options.headers || {})

  // Prefer Supabase Auth Bearer token
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  // Fallback: user-id header (for API-only auth without Supabase session)
  else if (user?.id) {
    headers.set('user-id', user.id)
  }

  // Set Content-Type for JSON bodies if not already set and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const method = (options.method || 'GET').toUpperCase()

  // Deduplicate GET requests — if an identical request is already in-flight,
  // return the same Promise instead of firing a new one
  if (method === 'GET') {
    const cacheKey = `${method}:${url}`
    const existing = pendingRequests.get(cacheKey)
    if (existing) {
      return existing.then((res) => res.clone())
    }

    const fetchPromise = _fetchWithRetry(url, { ...options, headers })
    pendingRequests.set(cacheKey, fetchPromise)

    try {
      const result = await fetchPromise
      return result
    } finally {
      pendingRequests.delete(cacheKey)
    }
  }

  return _fetchWithRetry(url, { ...options, headers })
}

/**
 * Internal fetch with automatic retry on 429 (Too Many Requests).
 * Uses exponential backoff: 1s, 2s, 4s (max 3 retries).
 */
async function _fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If we get a 429, retry with exponential backoff
      if (response.status === 429 && attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000) // 1s, 2s, 4s max
        console.warn(`[authFetch] 429 received for ${url}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
        continue
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      // Only retry on network errors, not on application errors
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000)
        console.warn(`[authFetch] Network error for ${url}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, backoffMs))
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`)
}
