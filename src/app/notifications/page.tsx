'use client'

import { useState, useEffect, useCallback } from 'react'
import { safeRedirect } from '@/hooks/use-auth'

import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CheckCheck,
  Loader2,
  BellOff,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { authFetch } from '@/lib/auth-fetch'
import { useNotificationStore } from '@/store/notification-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ApiNotification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string | null
  createdAt: string
}

const typeConfig: Record<string, { icon: typeof Info; bgClass: string; iconClass: string; borderClass: string }> = {
  info: {
    icon: Info,
    bgClass: 'bg-blue-50',
    iconClass: 'text-blue-500',
    borderClass: 'border-l-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50',
    iconClass: 'text-amber-500',
    borderClass: 'border-l-amber-400',
  },
  success: {
    icon: CheckCircle,
    bgClass: 'bg-emerald-50',
    iconClass: 'text-emerald-500',
    borderClass: 'border-l-emerald-400',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-red-50',
    iconClass: 'text-red-500',
    borderClass: 'border-l-red-400',
  },
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function NotificationsPage() {
  // const router = useRouter() // removed - using safeRedirect for iframe compatibility
  const { user, isAuthenticated, isLoading } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, setNotifications } = useNotificationStore()
  const [apiNotifications, setApiNotifications] = useState<ApiNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await authFetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const notifs = data.notifications || []
      setApiNotifications(notifs)

      // Sync with local notification store
      setNotifications(
        notifs.map((n: ApiNotification) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type as 'info' | 'warning' | 'success' | 'error',
          read: n.read,
          link: n.link || undefined,
          createdAt: n.createdAt,
        }))
      )
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [user, setNotifications])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifications()
  }, [isAuthenticated, fetchNotifications])

  const handleMarkAllAsRead = async () => {
    if (!user) return
    setMarkingAll(true)
    try {
      // Mark all in local store
      markAllAsRead()

      // Mark all on server
      await Promise.all(
        apiNotifications
          .filter((n) => !n.read)
          .map((n) =>
            authFetch(`/api/notifications/${n.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ read: true }),
            })
          )
      )

      // Update local state
      setApiNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark notifications as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const handleMarkAsRead = async (notif: ApiNotification) => {
    if (!user || notif.read) return
    try {
      await authFetch(`/api/notifications/${notif.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      })

      setApiNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      )
      markAsRead(notif.id)

      // Navigate to link if any
      if (notif.link) {
        safeRedirect(notif.link)
      }
    } catch {
      toast.error('Failed to mark notification as read')
    }
  }

  // Merge API notifications (authoritative) with any from the store
  const displayNotifications = apiNotifications.length > 0
    ? apiNotifications
    : notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        link: n.link || null,
        createdAt: n.createdAt,
      }))

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Notifications
                </span>
              </h1>
              <p className="mt-2 text-muted-foreground">
                Stay updated with your latest alerts and messages.
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="self-start border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCheck className="h-4 w-4 mr-2" />
                )}
                Mark All as Read
              </Button>
            )}
          </div>
        </motion.div>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500 text-white px-3 py-1 text-sm">
                {unreadCount} unread
              </Badge>
            </div>
          </motion.div>
        )}

        {/* Notifications List */}
        <Card className="border-amber-200/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">All Notifications</CardTitle>
                <CardDescription>
                  {displayNotifications.length} notification{displayNotifications.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-4">
                  <BellOff className="h-10 w-10 text-amber-400" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">No notifications</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  You&apos;re all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                    {displayNotifications.map((notif, index) => {
                      const config = typeConfig[notif.type] || typeConfig.info
                      const Icon = config.icon
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <button
                            onClick={() => handleMarkAsRead(notif as ApiNotification)}
                            className={`w-full text-left rounded-lg border-l-4 p-4 transition-all hover:shadow-sm ${
                              notif.read
                                ? 'bg-background border-l-transparent'
                                : `${config.bgClass} ${config.borderClass}`
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">
                                <Icon className={`h-5 w-5 ${config.iconClass}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`text-sm font-medium ${
                                      notif.read ? 'text-muted-foreground' : 'text-foreground'
                                    }`}
                                  >
                                    {notif.title}
                                  </p>
                                  {!notif.read && (
                                    <span className="flex-shrink-0 h-2 w-2 rounded-full bg-amber-500" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-muted-foreground/70">
                                    {getTimeAgo(notif.createdAt)}
                                  </span>
                                  {(notif as ApiNotification).link && (
                                    <span className="text-xs text-amber-600 flex items-center gap-0.5">
                                      <ExternalLink className="h-3 w-3" />
                                      View details
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                          {index < displayNotifications.length - 1 && (
                            <Separator className="my-1 bg-amber-100/50" />
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
