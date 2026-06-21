'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  Loader2,
  Send,
  Bell,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string
  createdAt: string
  user: { id: string; name: string; email: string }
}

interface UserOption {
  id: string
  name: string
  email: string
}

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
}

const typeColors: Record<string, string> = {
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
}

export default function AdminNotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Form
  const [selectedUserId, setSelectedUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [sending, setSending] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)

  useEffect(() => {
    fetchNotifications()
    fetchUsers()
  }, [page, user?.id])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`/api/notifications?page=${page}&limit=10`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setNotifications(data.notifications)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await authFetch('/api/admin/users')
      if (!res.ok) return
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      // Silently fail
    }
  }

  const handleSend = async () => {
    if (!title || !message) {
      toast.error('Title and message are required')
      return
    }

    try {
      setSending(true)

      if (bulkMode) {
        // Send to all users
        for (const u of users) {
          await authFetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: u.id,
              title,
              message,
              type,
            }),
          })
        }
        toast.success(`Notification sent to ${users.length} users`)
      } else {
        if (!selectedUserId) {
          toast.error('Please select a user or enable bulk mode')
          return
        }

        const res = await authFetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedUserId,
            title,
            message,
            type,
          }),
        })
        if (!res.ok) throw new Error('Failed to send')
        toast.success('Notification sent successfully')
      }

      setTitle('')
      setMessage('')
      setType('info')
      setSelectedUserId('')
      fetchNotifications()
    } catch {
      toast.error('Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm mt-1">Send and manage user notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification Form */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              Send Notification
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Send a notification to a specific user or all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bulk Mode Toggle */}
            <div className="flex items-center gap-3">
              <Button
                variant={!bulkMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBulkMode(false)}
                className={!bulkMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}
              >
                <User className="w-3.5 h-3.5 mr-1.5" />
                Single User
              </Button>
              <Button
                variant={bulkMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBulkMode(true)}
                className={bulkMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                All Users
              </Button>
            </div>

            {/* User Select */}
            {!bulkMode && (
              <div>
                <Label className="text-slate-300 text-sm">User ID</Label>
                <Input
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder="Enter user ID (e.g., clx...)"
                  className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter the user ID from the applications or payments table
                </p>
              </div>
            )}

            {bulkMode && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300">This notification will be sent to all registered users</span>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <Label className="text-slate-300 text-sm">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1"
              />
            </div>

            {/* Message */}
            <div>
              <Label className="text-slate-300 text-sm">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your notification message..."
                className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1 min-h-[80px]"
              />
            </div>

            {/* Type */}
            <div>
              <Label className="text-slate-300 text-sm">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Success
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      Error
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {title && message && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Preview:</p>
                <div className="flex items-start gap-2">
                  {(() => {
                    const Icon = typeIcons[type] || Info
                    return <Icon className={`w-4 h-4 mt-0.5 ${typeColors[type]?.split(' ')[1] || 'text-blue-400'}`} />
                  })()}
                  <div>
                    <p className="text-sm font-medium text-slate-200">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{message}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sending || !title || !message}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {sending ? 'Sending...' : bulkMode ? 'Send to All Users' : 'Send Notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Recent Notifications
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  {total} total notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
                No notifications found
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Info
                  return (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-800/50"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[notif.type]?.split(' ')[0] || 'bg-slate-500/15'}`}>
                        <Icon className={`w-4 h-4 ${typeColors[notif.type]?.split(' ')[1] || 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-200 truncate">{notif.title}</p>
                          {!notif.read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-slate-500">{notif.user.name}</span>
                          <span className="text-[11px] text-slate-600">·</span>
                          <span className="text-[11px] text-slate-500">{formatDate(notif.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="bg-slate-800/50 border-slate-700 text-slate-300 h-7 w-7 p-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="bg-slate-800/50 border-slate-700 text-slate-300 h-7 w-7 p-0"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
