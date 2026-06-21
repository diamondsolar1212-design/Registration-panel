'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Sun, User, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { safeRedirect, clearRedirectLog } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const { login, isAuthenticated, _hydrated } = useAuthStore()
  const hasRedirectedRef = useRef(false)

  // Redirect already-authenticated users away from register page
  // BUT only after verifying the auth is actually valid (not stale Zustand state)
  useEffect(() => {
    if (!_hydrated) return
    if (hasRedirectedRef.current) return

    if (!isAuthenticated) return // Not authenticated — stay on register page

    // Authenticated from Zustand persist — verify it's actually valid
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
          hasRedirectedRef.current = true
          clearRedirectLog()
          safeRedirect('/dashboard')
        } else {
          // Auth is stale — clear it and stay on register page
          useAuthStore.getState().logout()
          clearRedirectLog()
        }
      } catch {
        // Network error — don't redirect, stay on register page
        clearRedirectLog()
      }
    }
    verifyAndRedirect()
  }, [_hydrated, isAuthenticated])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    if (!name.trim()) {
      toast.error('Please enter your full name')
      return false
    }
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (!password) {
      toast.error('Please enter a password')
      return false
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // Step 1: Create user via our API (creates in Supabase Auth + custom User table)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }

      // Step 2: Try API login to get user data and access token
      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        })
        const loginData = await loginRes.json()
        if (loginRes.ok && loginData.user) {
          login(loginData.user, loginData.accessToken || '')
        } else {
          // API login failed — use the user data from registration
          login(data.user, '')
        }
      } catch {
        // API login failed — use the user data from registration
        login(data.user, '')
      }

      // CRITICAL: Mark redirect as handled so the useEffect below doesn't
      // fire a competing verifyAndRedirect() that could call logout() and
      // wipe the auth state we just set.
      hasRedirectedRef.current = true

      toast.success('Account created successfully!')

      // CRITICAL: Clear the redirect log before navigating.
      // Without this, safeRedirect may detect a false loop from previous
      // redirects and block the post-registration navigation.
      clearRedirectLog()

      await new Promise((resolve) => setTimeout(resolve, 150))
      safeRedirect('/dashboard')
    } catch {
      toast.error('Something went wrong. Please try again.')
      clearRedirectLog()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
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
                Create your account to get started
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-amber-900">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-amber-900">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-amber-900">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-amber-900">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50 h-11"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pb-6">
          <p className="text-sm text-amber-700/70">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors"
            >
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
