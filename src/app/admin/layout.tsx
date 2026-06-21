'use client'

import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { safeRedirect, clearRedirectLog, recordRedirect } from '@/hooks/use-auth'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  CreditCard,
  FileCheck,
  Bell,
  Settings,
  LogOut,
  Sun,
  Shield,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/approvals', label: 'Approvals', icon: CheckCircle },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/documents', label: 'Documents', icon: FileCheck },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, isAdmin, logout, _hydrated } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const redirectInitiatedRef = useRef(false)
  const [hydrationStable, setHydrationStable] = useState(false)

  useEffect(() => {
    if (_hydrated && !hydrationStable) {
      const timer = setTimeout(() => {
        setHydrationStable(true)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [_hydrated, hydrationStable])

  useEffect(() => {
    if (!hydrationStable) return
    // Don't redirect if already on admin login page
    if (pathname === '/admin') return
    // Don't redirect if a redirect has already been initiated
    if (redirectInitiatedRef.current) return
    if (!user || !isAdmin) {
      // Check for redirect loop before proceeding
      const loopDetected = recordRedirect()
      if (loopDetected) {
        console.warn('[AdminLayout] Redirect loop detected — stopping.')
        logout()
        clearRedirectLog()
        return
      }
      redirectInitiatedRef.current = true
      safeRedirect('/admin')
    }
  }, [pathname, user, isAdmin, hydrationStable, logout])

  if (!_hydrated) return null

  // Login page — no sidebar
  if (pathname === '/admin') {
    return <>{children}</>
  }

  // Not authenticated — redirect
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Shield className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sun className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm">Diamond Solar</h1>
                <p className="text-[11px] text-slate-500">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <ScrollArea className="flex-1 py-3">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      safeRedirect(item.href)
                      setSidebarOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className={cn('w-4.5 h-4.5', isActive && 'text-amber-400')} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500/60" />
                    )}
                  </button>
                )
              })}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="p-3 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                {user.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Separator className="my-2 bg-slate-800" />
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try { await supabaseBrowser.auth.signOut() } catch {}
                logout()
                clearRedirectLog()
                safeRedirect('/admin')
              }}
              className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-slate-200"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div className="flex-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500 hidden sm:block" />
            <span className="text-sm text-slate-400 hidden sm:block">Admin</span>
            <span className="text-slate-600 hidden sm:block">/</span>
            <span className="text-sm font-medium text-slate-200">
              {navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500 hidden sm:block">Live</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
