'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

// ─── Redirect Loop Protection ───────────────────────────────────────────
// Prevents the dashboard↔login ping-pong that happens when Zustand persist
// restores stale `isAuthenticated: true` but the actual session is invalid.

const LOOP_WINDOW_MS = 10_000 // 10-second window
const LOOP_MAX_REDIRECTS = 4   // Max 4 redirects in 10 seconds before blocking
const LOOP_KEY = 'diamond-solar-redirect-log'

// ─── Global Navigation Lock ─────────────────────────────────────────────
// Prevents multiple simultaneous redirects from different components/hooks.
// When one redirect is in progress, all others are blocked.

const NAV_LOCK_KEY = 'diamond-solar-nav-lock'
const NAV_LOCK_TTL_MS = 3000 // Lock expires after 3 seconds (safety net)

function acquireNavLock(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const now = Date.now()
    const existing = sessionStorage.getItem(NAV_LOCK_KEY)
    if (existing) {
      const lockTime = parseInt(existing, 10)
      if (now - lockTime < NAV_LOCK_TTL_MS) {
        return false // Lock is active — another redirect is in progress
      }
    }
    sessionStorage.setItem(NAV_LOCK_KEY, String(now))
    return true
  } catch {
    return false
  }
}

function releaseNavLock(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(NAV_LOCK_KEY)
  } catch {
    // ignore
  }
}

export function recordRedirect(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const now = Date.now()
    const raw = sessionStorage.getItem(LOOP_KEY)
    const timestamps: number[] = raw ? JSON.parse(raw) : []
    // Keep only timestamps within the window
    const recent = timestamps.filter((t: number) => now - t < LOOP_WINDOW_MS)
    if (recent.length >= LOOP_MAX_REDIRECTS) {
      return true // LOOP DETECTED — block this redirect
    }
    recent.push(now)
    sessionStorage.setItem(LOOP_KEY, JSON.stringify(recent))
    return false
  } catch {
    return false
  }
}

export function clearRedirectLog(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(LOOP_KEY)
    sessionStorage.removeItem(NAV_LOCK_KEY)
  } catch {
    // ignore
  }
}

// ─── useAuth ─────────────────────────────────────────────────────────────

export function useAuth(redirectTo = '/login') {
  const { user, isAuthenticated, isAdmin, _hydrated, logout, updateUser } = useAuthStore()
  const pathname = usePathname()
  const redirectInitiatedRef = useRef(false)
  const [hydrationStable, setHydrationStable] = useState(false)

  useEffect(() => {
    // Wait for hydration plus a stabilization delay to avoid
    // Zustand rehydration flicker (state briefly shows authenticated then flips)
    if (_hydrated && !hydrationStable) {
      const timer = setTimeout(() => {
        setHydrationStable(true)
      }, 600) // 600ms — enough for Zustand persist to settle
      return () => clearTimeout(timer)
    }
  }, [_hydrated, hydrationStable])

  useEffect(() => {
    // Guard: don't redirect if hydration isn't stable yet
    if (!hydrationStable) return
    // Guard: don't redirect if already on the target page (prevents loops)
    if (pathname === redirectTo || pathname.startsWith(redirectTo + '/')) return
    // Guard: don't redirect if a redirect has already been initiated
    if (redirectInitiatedRef.current) return

    if (!isAuthenticated) {
      redirectInitiatedRef.current = true

      // Delegate entirely to safeRedirect — it handles loop detection,
      // nav lock, and the actual navigation. Do NOT acquire the nav lock
      // here; safeRedirect does it internally, and double-acquiring would
      // always fail (the second acquireNavLock sees the lock we just set).
      safeRedirect(redirectTo)
    }
  }, [isAuthenticated, redirectTo, hydrationStable, pathname, logout])

  // Reset redirect guard when authentication state changes to true
  useEffect(() => {
    if (isAuthenticated) {
      redirectInitiatedRef.current = false
      clearRedirectLog()
    }
  }, [isAuthenticated])

  return {
    user,
    isAuthenticated,
    isAdmin,
    _hydrated,
    logout,
    updateUser,
    isLoading: !_hydrated || !hydrationStable,
  }
}

// ─── useAdminAuth ────────────────────────────────────────────────────────

export function useAdminAuth() {
  const { user, isAuthenticated, isAdmin, _hydrated, logout } = useAuthStore()
  const pathname = usePathname()
  const redirectInitiatedRef = useRef(false)
  const [hydrationStable, setHydrationStable] = useState(false)

  useEffect(() => {
    if (_hydrated && !hydrationStable) {
      const timer = setTimeout(() => {
        setHydrationStable(true)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [_hydrated, hydrationStable])

  useEffect(() => {
    if (!hydrationStable) return
    if (pathname === '/admin' || pathname.startsWith('/admin/')) return
    if (redirectInitiatedRef.current) return

    if (!isAuthenticated || !isAdmin) {
      redirectInitiatedRef.current = true

      // Delegate entirely to safeRedirect — it handles loop detection
      // and nav lock. Do NOT acquire the lock here; safeRedirect does it
      // internally, and double-acquiring would always fail.
      safeRedirect('/admin')
    }
  }, [isAuthenticated, isAdmin, hydrationStable, pathname, logout])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      redirectInitiatedRef.current = false
      clearRedirectLog()
    }
  }, [isAuthenticated, isAdmin])

  return {
    user,
    isAuthenticated,
    isAdmin,
    _hydrated,
    logout,
    isLoading: !_hydrated || !hydrationStable,
  }
}

// ─── safeRedirect ────────────────────────────────────────────────────────

/**
 * Safe redirect utility that works correctly inside iframes.
 * Uses full page reload (window.self.location.href) instead of
 * Next.js router.push to avoid RSC (?_rsc=) redirect loops.
 *
 * Features:
 * - Iframe-safe: uses window.self instead of window.top
 * - Redirect loop detection with auto-recovery
 * - Global navigation lock to prevent concurrent redirects
 */
export function safeRedirect(url: string) {
  if (typeof window === 'undefined') return

  // Check for redirect loop
  const loopDetected = recordRedirect()
  if (loopDetected) {
    console.warn('[safeRedirect] Redirect loop detected — breaking the cycle.')
    // Clear stale auth to break the cycle
    const { logout } = useAuthStore.getState()
    logout()
    clearRedirectLog()
    // Force navigate to login with full reload to reset ALL state
    try {
      window.self.location.href = '/login'
    } catch {
      // Last resort
    }
    return
  }

  // Acquire navigation lock
  if (!acquireNavLock()) {
    console.warn('[safeRedirect] Navigation lock active — skipping redirect to', url)
    return
  }

  try {
    window.self.location.href = url
  } catch {
    try {
      window.self.location.assign(url)
    } catch {
      // Last resort: no-op to prevent crashing
      releaseNavLock()
    }
  }
}
