'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sun,
  FileText,
  CheckCircle2,
  Clock,
  IndianRupee,
  TrendingUp,
  Upload,
  CreditCard,
  Plus,
  ArrowRight,
  Zap,
  Leaf,
  Activity,
  Loader2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/hooks/use-auth'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

interface Application {
  id: string
  applicantName: string
  propertyType: string
  connectionType: string
  status: string
  recommendedCapacity: number | null
  estimatedCost: number | null
  annualSavings: number | null
  co2Reduction: number | null
  createdAt: string
  propertyAddress: string
  propertyCity: string
  propertyState: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

interface Payment {
  id: string
  amount: number
  paymentType: string
  status: string
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string; bgClass: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bgClass: 'bg-amber-100 border-amber-200', icon: Clock },
  under_review: { label: 'Under Review', color: 'text-blue-700', bgClass: 'bg-blue-100 border-blue-200', icon: Activity },
  approved: { label: 'Approved', color: 'text-emerald-700', bgClass: 'bg-emerald-100 border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-700', bgClass: 'bg-red-100 border-red-200', icon: Activity },
  installed: { label: 'Installed', color: 'text-green-700', bgClass: 'bg-green-100 border-green-200', icon: CheckCircle2 },
}

const chartConfig: ChartConfig = {
  savings: {
    label: 'Monthly Savings (₹)',
    color: 'oklch(0.75 0.183 55)',
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()

  const [applications, setApplications] = useState<Application[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data
  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [appsRes, notifsRes, paysRes] = await Promise.all([
          authFetch('/api/applications'),
          authFetch('/api/notifications'),
          authFetch('/api/payments'),
        ])

        if (appsRes.ok) {
          const appsData = await appsRes.json()
          setApplications(appsData.applications || [])
        }

        if (notifsRes.ok) {
          const notifsData = await notifsRes.json()
          setNotifications(notifsData.notifications || [])
        }

        if (paysRes.ok) {
          const paysData = await paysRes.json()
          setPayments(paysData.payments || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
  if (!isAuthenticated || !user) return null

  // Calculate stats
  const totalApps = applications.length
  const approvedApps = applications.filter((a) => a.status === 'approved' || a.status === 'installed').length
  const pendingApps = applications.filter((a) => a.status === 'pending' || a.status === 'under_review').length
  const totalSavings = applications.reduce((sum, a) => sum + (a.annualSavings || 0), 0)

  // Monthly savings projection data for chart
  const monthlySavingsData = Array.from({ length: 12 }, (_, i) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const baseSavings = totalSavings / 12
    const seasonalFactor = 1 + 0.2 * Math.sin(((i + 2) / 12) * Math.PI * 2)
    return {
      month: monthNames[i],
      savings: Math.round(baseSavings * seasonalFactor),
    }
  })

  // Recent activity from notifications
  const recentActivity = notifications.slice(0, 5)

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Welcome Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Welcome back, <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">{user.name}</span> 👋
              </h1>
              <p className="mt-1 text-muted-foreground">
                Here&apos;s an overview of your solar journey with Diamond Solar.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                asChild
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
              >
                <Link href="/application">
                  <Plus className="h-4 w-4" />
                  New Application
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
        >
          {[
            { title: 'Total Applications', value: totalApps, icon: FileText, color: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50', iconColor: 'text-amber-600' },
            { title: 'Approved', value: approvedApps, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', lightBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
            { title: 'Pending', value: pendingApps, icon: Clock, color: 'from-blue-500 to-blue-600', lightBg: 'bg-blue-50', iconColor: 'text-blue-600' },
            { title: 'Annual Savings', value: formatCurrency(totalSavings), icon: IndianRupee, color: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50', iconColor: 'text-orange-600' },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div key={stat.title} variants={fadeInUp}>
                <Card className="relative overflow-hidden border-primary/10 transition-shadow hover:shadow-md">
                  <CardContent className="p-4 sm:p-6">
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-7 w-16" />
                      </div>
                    ) : (
                      <>
                        <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.lightBg}`}>
                          <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                        <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                          {stat.value}
                        </p>
                      </>
                    )}
                    {/* Decorative gradient corner */}
                    <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br ${stat.color} opacity-10`} />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Applications & Chart */}
          <div className="space-y-6 lg:col-span-2">
            {/* Monthly Savings Chart */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Monthly Savings Projection
                      </CardTitle>
                      <CardDescription>Estimated savings based on your approved applications</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Zap className="h-3 w-3 mr-1" />
                      Solar Powered
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : totalSavings > 0 ? (
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                      <BarChart data={monthlySavingsData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.91 0.02 80)" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 50)' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 50)' }}
                          tickFormatter={(v) => `₹${v}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Savings']}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid oklch(0.91 0.02 80)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          }}
                        />
                        <Bar
                          dataKey="savings"
                          fill="oklch(0.75 0.183 55)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-amber-50/50 border border-dashed border-amber-200">
                      <Sun className="mb-3 h-12 w-12 text-amber-300" />
                      <p className="text-sm font-medium text-amber-700">No savings data yet</p>
                      <p className="text-xs text-amber-600/70 mt-1">Submit an application to see your projected savings</p>
                      <Button asChild size="sm" className="mt-4 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                        <Link href="/application">
                          <Plus className="h-3 w-3" />
                          Apply Now
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Application Status Cards */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Your Applications
                      </CardTitle>
                      <CardDescription>Track the status of your solar applications</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50">
                      <Link href="/application">
                        <Plus className="h-3.5 w-3.5" />
                        New
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 p-4">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : applications.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-3">
                      {applications.map((app) => {
                        const config = statusConfig[app.status] || statusConfig.pending
                        const StatusIcon = config.icon
                        return (
                          <div
                            key={app.id}
                            className="group flex items-start gap-4 rounded-xl border border-border/50 p-4 transition-all hover:border-primary/20 hover:bg-amber-50/30"
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.bgClass}`}>
                              <StatusIcon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {app.applicantName} - {app.propertyType.charAt(0).toUpperCase() + app.propertyType.slice(1)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {app.propertyCity}, {app.propertyState} &bull; {app.connectionType.replace('-', ' ')} &bull; {app.recommendedCapacity ? `${app.recommendedCapacity} kW` : 'N/A'}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`shrink-0 text-[10px] ${config.bgClass} ${config.color} border-0`}>
                                  {config.label}
                                </Badge>
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{formatDate(app.createdAt)}</span>
                                {app.estimatedCost && (
                                  <span className="flex items-center gap-1">
                                    <IndianRupee className="h-3 w-3" />
                                    {formatCurrency(app.estimatedCost)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-amber-50/50 border border-dashed border-amber-200">
                      <FileText className="mb-3 h-12 w-12 text-amber-300" />
                      <p className="text-sm font-medium text-amber-700">No applications yet</p>
                      <p className="text-xs text-amber-600/70 mt-1">Start your solar journey by submitting an application</p>
                      <Button asChild size="sm" className="mt-4 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                        <Link href="/application">
                          <Plus className="h-3 w-3" />
                          Apply Now
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Activity & Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="border-primary/10 bg-gradient-to-br from-amber-50/80 to-orange-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md h-11">
                    <Link href="/application">
                      <Plus className="h-4 w-4" />
                      New Application
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start gap-3 border-amber-200 text-amber-800 hover:bg-amber-50 h-11">
                    <Link href="/documents">
                      <Upload className="h-4 w-4" />
                      Upload Documents
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start gap-3 border-amber-200 text-amber-800 hover:bg-amber-50 h-11">
                    <Link href="/payments">
                      <CreditCard className="h-4 w-4" />
                      Make Payment
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-full" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivity.length > 0 ? (
                    <div className="relative space-y-0">
                      {/* Timeline line */}
                      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-primary/15 to-transparent" />
                      {recentActivity.map((activity, index) => {
                        const typeColors: Record<string, string> = {
                          success: 'bg-emerald-500',
                          info: 'bg-blue-500',
                          warning: 'bg-amber-500',
                          error: 'bg-red-500',
                        }
                        return (
                          <div key={activity.id} className="relative flex items-start gap-3 pb-5 last:pb-0">
                            <div className={`z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${typeColors[activity.type] || 'bg-primary'} text-white shadow-sm`}>
                              {activity.type === 'success' ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : activity.type === 'warning' ? (
                                <Clock className="h-3.5 w-3.5" />
                              ) : (
                                <Activity className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-sm font-medium text-foreground leading-tight">{activity.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.message}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">{formatDate(activity.createdAt)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Activity className="mb-2 h-8 w-8 text-amber-300" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Eco Impact Card */}
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <Card className="border-primary/10 bg-gradient-to-br from-emerald-50/80 to-green-50/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                      <Leaf className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Environmental Impact</p>
                      <p className="text-xs text-emerald-600/70">Your contribution to a greener planet</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-700">CO₂ Offset</span>
                      <span className="text-sm font-bold text-emerald-800">
                        {applications.reduce((sum, a) => sum + (a.co2Reduction || 0), 0).toFixed(1)} tonnes/yr
                      </span>
                    </div>
                    <Separator className="bg-emerald-200/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-700">Trees Equivalent</span>
                      <span className="text-sm font-bold text-emerald-800">
                        ~{Math.round(applications.reduce((sum, a) => sum + (a.co2Reduction || 0), 0) * 16)} trees/yr
                      </span>
                    </div>
                    <Separator className="bg-emerald-200/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-700">Applications</span>
                      <span className="text-sm font-bold text-emerald-800">{totalApps} total</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
