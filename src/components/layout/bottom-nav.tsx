'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Bell,
  User,
  Home,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useNotificationStore } from '@/store/notification-store'

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Apply', href: '/application', icon: FileText },
  { label: 'Alerts', href: '/notifications', icon: Bell, showBadge: true },
  { label: 'Profile', href: '/dashboard', icon: User },
]

const unauthenticatedItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Login', href: '/login', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  const items = isAuthenticated ? navItems : unauthenticatedItems

  // Don't show on admin pages
  if (pathname.startsWith('/admin')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom bg-background/95 backdrop-blur-xl border-t border-border/60">
      <div className="flex items-center justify-around h-[52px] px-1 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0 px-3 py-1 rounded-xl transition-all duration-200 min-w-[52px] ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground/60 active:text-muted-foreground'
              }`}
            >
              {/* Active indicator pill */}
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />
              )}
              <div className="relative mt-1.5">
                <Icon className={`h-[22px] w-[22px] transition-all duration-200 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-tight mt-0.5 ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
