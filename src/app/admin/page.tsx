'use client'

import { useState, useEffect, useRef } from 'react'
import { Shield, Mail, Lock, Loader2, ArrowRight, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { safeRedirect, clearRedirectLog } from '@/hooks/use-auth'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
  const { login, isAuthenticated, isAdmin, _hydrated } = useAuthStore()
  const hasRedirectedRef = useRef(false)

  // Redirect already-authenticated admins away from login page
  useEffect(() => {
    if (!_hydrated) return
    if (hasRedirectedRef.current) return
    const timer = setTimeout(() => {
      if (isAuthenticated && isAdmin && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        clearRedirectLog()
        safeRedirect('/admin/dashboard')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [_hydrated, isAuthenticated, isAdmin])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        toast.error(authError.message || 'Invalid credentials')
        return
      }

      // Get user from our User table via API
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authData.session.access_token}` },
      })
      const data = await res.json()

      if (!res.ok || !data.user) {
        toast.error('Account not found.')
        await supabaseBrowser.auth.signOut()
        return
      }

      if (data.user.role !== 'admin') {
        toast.error('Access denied. Admin credentials required.')
        await supabaseBrowser.auth.signOut()
        return
      }

      login(data.user, authData.session.access_token)
      toast.success('Welcome, Admin!')
      // Clear redirect log to prevent false loop detection after login
      clearRedirectLog()
      // Small delay to ensure Zustand persist writes to localStorage before navigation
      await new Promise((resolve) => setTimeout(resolve, 100))
      safeRedirect('/admin/dashboard')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 bg-slate-800/80 border-slate-700/50 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Branding */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/50 ring-1 ring-slate-500/20">
                <Shield className="w-9 h-9 text-amber-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                <Sun className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Diamond Solar &mdash; Authorized access only
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleAdminLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-slate-300 text-sm">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@diamondsolar.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-slate-300 text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 focus-visible:border-amber-500/50 focus-visible:ring-amber-500/20"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 h-10 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </Button>
          </form>

          {/* Security notice */}
          <div className="mt-6 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-500/70 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                This portal is for authorized administrators only. All access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
