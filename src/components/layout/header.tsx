'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Sun,
  Menu,
  Bell,
  LayoutDashboard,
  FileText,
  CreditCard,
  FolderOpen,
  RefreshCw,
  Headphones,
  LogOut,
  User,
  Settings,
  Home,
  LogIn,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuthStore } from '@/store/auth-store'
import { useNotificationStore } from '@/store/notification-store'
import { supabaseBrowser } from '@/lib/supabase-browser'

const authenticatedNavItems: Array<{ label: string; href: string; icon: typeof FileText; showBadge?: boolean }> = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Application', href: '/application', icon: FileText },
  { label: 'Payments', href: '/payments', icon: CreditCard },
  { label: 'Documents', href: '/documents', icon: FolderOpen },
  { label: 'Notifications', href: '/notifications', icon: Bell, showBadge: true },
  { label: 'Updates', href: '/updates', icon: RefreshCw },
  { label: 'Support', href: '/support', icon: Headphones },
]

const unauthenticatedNavItems: Array<{ label: string; href: string; icon: typeof FileText; showBadge?: boolean }> = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Login', href: '/login', icon: LogIn },
  { label: 'Register', href: '/register', icon: UserPlus },
]

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await supabaseBrowser.auth.signOut()
    } catch {
      // Ignore signout errors
    }
    logout()
  }
  const { unreadCount } = useNotificationStore()

  // Defer Radix UI components (Sheet, DropdownMenu) rendering until after
  // client hydration to prevent aria-controls ID mismatch warnings.
  // Radix generates random IDs that differ between server and client.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const navItems = isAuthenticated ? authenticatedNavItems : unauthenticatedNavItems

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Sun className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Diamond <span className="text-primary">Solar</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`relative gap-1.5 text-sm font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.showBadge && unreadCount > 0 && (
                    <Badge className="ml-0.5 h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell (authenticated only) */}
          {isAuthenticated && (
            mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/notifications" className="flex items-center gap-2 cursor-pointer">
                      <Bell className="h-4 w-4" />
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">Notifications</span>
              </Button>
            )
          )}

          {/* User Avatar Dropdown (authenticated only) */}
          {isAuthenticated && user ? (
            mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-primary/20">
                      <AvatarImage src="" alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/support" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Help & Support
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            )
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu - only for tablet (md to lg), phone uses BottomNav */}
          {mounted ? (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <Sun className="h-5 w-5 text-primary" />
                    Diamond Solar
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-2 pt-4">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={`w-full justify-start gap-3 ${
                            isActive
                              ? 'bg-primary/10 text-primary hover:bg-primary/15'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                          {item.showBadge && unreadCount > 0 && (
                            <Badge className="ml-auto h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    )
                  })}

                  {isAuthenticated && user && (
                    <>
                      <div className="my-2 h-px bg-border" />
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Avatar className="h-8 w-8 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
                          <User className="h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                        onClick={() => {
                          handleLogout()
                          setMobileOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </Button>
                    </>
                  )}

                  {!isAuthenticated && (
                    <>
                      <div className="my-2 h-px bg-border" />
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full mt-2">Register</Button>
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <Button variant="ghost" size="icon" className="hidden md:flex lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
