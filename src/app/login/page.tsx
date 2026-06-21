'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Sun, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { safeRedirect, clearRedirectLog } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const { login, isAuthenticated, _hydrated } = useAuthStore()
  const hasRedirectedRef = useRef(false)
  const [verifying, setVerifying] = useState(false)

  // Redirect already-authenticated users away from login page
  // BUT only after verifying the auth is actually valid (not stale Zustand state)
  useEffect(() => {
    if (!_hydrated) return
    if (hasRedirectedRef.current) return

    if (!isAuthenticated) return // Not authenticated — stay on login page

    // Authenticated from Zustand persist — verify it's actually valid
    setVerifying(true)
    const verifyAndRedirect = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
            ...(useAuthStore.getState().accessToken
              ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
              : { 'user-id': useAuthStore.getState().user?.id || '' }),
          },
        })
        if (res.ok) {
          // Auth is valid — clear redirect log and redirect to dashboard
          hasRedirectedRef.current = true
          clearRedirectLog()
          safeRedirect('/dashboard')
        } else {
          // Auth is stale — clear it and stay on login page
          useAuthStore.getState().logout()
          clearRedirectLog()
        }
      } catch {
        // Network error — don't redirect, stay on login page
        // Also clear redirect log so future attempts aren't blocked
        clearRedirectLog()
      } finally {
        setVerifying(false)
      }
    }
    verifyAndRedirect()
  }, [_hydrated, isAuthenticated])

  // Email login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      // Step 1: Try API login first (always works, fast)
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const apiData = await apiRes.json()

      if (!apiRes.ok) {
        toast.error(apiData.error || 'Invalid email or password')
        return
      }

      // Step 2: Store user + token, then clear redirect log BEFORE navigating
      // The access token may be empty if Supabase Auth sign-in timed out,
      // but the user-id header fallback handles authentication
      login(apiData.user, apiData.accessToken || '')

      // CRITICAL: Mark redirect as handled so the useEffect below doesn't
      // fire a competing verifyAndRedirect() that could call logout() and
      // wipe the auth state we just set.
      hasRedirectedRef.current = true

      toast.success('Login successful!')

      // CRITICAL: Clear the redirect log before navigating.
      // Without this, safeRedirect may detect a false loop from previous
      // redirects (e.g., useAuth redirecting to /login) and block navigation.
      clearRedirectLog()

      await new Promise((resolve) => setTimeout(resolve, 100))
      if (apiData.user.role === 'admin') {
        safeRedirect('/admin/dashboard')
      } else {
        safeRedirect('/dashboard')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      clearRedirectLog()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
      {/* Show spinner while verifying existing auth */}
      {verifying ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-amber-700/70 text-sm">Verifying session...</p>
        </div>
      ) : (
      <>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-100/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-amber-200/50 shadow-xl shadow-amber-100/50">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Branding */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200/50">
              <Sun className="w-9 h-9 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Diamond Solar
              </CardTitle>
              <CardDescription className="text-amber-700/70 mt-1">
                Welcome back! Sign in to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-900">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-900">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50 h-10"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pb-6">
          <p className="text-sm text-amber-700/70">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors"
            >
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
      </>
      )}
    </div>
  )
}
