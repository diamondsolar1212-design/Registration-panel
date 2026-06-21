'use client'

import { useEffect, useState } from 'react'
import { safeRedirect } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth-store'
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  IndianRupee,
  FileCheck,
  ArrowRight,
  Loader2,
  TrendingUp,
  Zap,
  Leaf,
  AlertCircle,
  Bell,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'

interface DashboardStats {
  users: { total: number }
  applications: { total: number; pending: number; approved: number; rejected: number; underReview: number }
  revenue: { total: number; verifiedPayments: number; pendingPayments: number }
  documents: { total: number; verified: number; pending: number }
  approvals: { total: number }
  solar: { totalCapacityKw: number; totalCo2Reduction: number }
}

interface ChartData {
  applicationsByStatus: Array<{ status: string; count: number }>
  revenueByMonth: Array<{ month: string; revenue: number }>
}

interface RecentApplication {
  id: string
  applicantName: string
  applicantEmail: string
  propertyType: string
  status: string
  createdAt: string
  user: { id: string; name: string; email: string }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  under_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  installed: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

const chartConfig: ChartConfig = {
  count: {
    label: 'Applications',
    color: '#f59e0b',
  },
  pending: { label: 'Pending', color: '#eab308' },
  under_review: { label: 'Under Review', color: '#3b82f6' },
  approved: { label: 'Approved', color: '#22c55e' },
  rejected: { label: 'Rejected', color: '#ef4444' },
}

export default function AdminDashboardPage() {
  // const router = useRouter() // removed - using safeRedirect for iframe compatibility
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [recentApps, setRecentApps] = useState<RecentApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await authFetch('/api/admin/dashboard')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data.stats)
      setChartData(data.charts)
      setRecentApps(data.recentApplications || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    )
  }

  const statusChartData = chartData?.applicationsByStatus.map((item) => ({
    status: item.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    count: item.count,
    fill: statusColors[item.status]
      ? item.status === 'pending'
        ? '#eab308'
        : item.status === 'under_review'
          ? '#3b82f6'
          : item.status === 'approved'
            ? '#22c55e'
            : item.status === 'rejected'
              ? '#ef4444'
              : '#a855f7'
      : '#94a3b8',
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back, {user?.name || 'Admin'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          icon={Users}
          color="amber"
        />
        <StatCard
          title="Applications"
          value={stats?.applications.total || 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Approved"
          value={stats?.applications.approved || 0}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Review"
          value={(stats?.applications.pending || 0) + (stats?.applications.underReview || 0)}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats?.revenue.total || 0)}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Documents"
          value={stats?.documents.total || 0}
          icon={FileCheck}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Capacity</p>
              <p className="text-lg font-bold text-white">
                {(stats?.solar.totalCapacityKw || 0).toFixed(1)} <span className="text-sm text-slate-400">kW</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">CO₂ Reduction</p>
              <p className="text-lg font-bold text-white">
                {(stats?.solar.totalCo2Reduction || 0).toFixed(1)} <span className="text-sm text-slate-400">tonnes/yr</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Approvals</p>
              <p className="text-lg font-bold text-white">
                {stats?.approvals.total || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Status Chart */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Applications by Status</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Distribution of all applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <BarChart data={statusChartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={12} />
                  <YAxis type="category" dataKey="status" stroke="#475569" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-slate-500">
                No application data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Recent Applications</CardTitle>
                <CardDescription className="text-slate-500 text-xs">Last 5 applications</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => safeRedirect('/admin/applications')}
                className="text-amber-400 hover:text-amber-300 text-xs"
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentApps.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-500 text-xs">Applicant</TableHead>
                    <TableHead className="text-slate-500 text-xs">Type</TableHead>
                    <TableHead className="text-slate-500 text-xs">Status</TableHead>
                    <TableHead className="text-slate-500 text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentApps.map((app) => (
                    <TableRow
                      key={app.id}
                      className="border-slate-800/50 hover:bg-slate-800/30 cursor-pointer"
                      onClick={() => safeRedirect('/admin/applications')}
                    >
                      <TableCell className="text-sm text-slate-200">
                        <div>
                          <p className="font-medium">{app.applicantName}</p>
                          <p className="text-xs text-slate-500">{app.applicantEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400 capitalize">
                        {app.propertyType}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={mergeCn(
                            'text-[11px] capitalize',
                            statusColors[app.status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                          )}
                        >
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(app.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm">No applications yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => safeRedirect('/admin/applications')}
              className="h-auto py-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-amber-500/30 text-left justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Review Applications</p>
                  <p className="text-[11px] text-slate-500">{stats?.applications.pending || 0} pending</p>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => safeRedirect('/admin/payments')}
              className="h-auto py-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-emerald-500/30 text-left justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Verify Payments</p>
                  <p className="text-[11px] text-slate-500">{stats?.revenue.pendingPayments || 0} pending</p>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => safeRedirect('/admin/notifications')}
              className="h-auto py-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-blue-500/30 text-left justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Send Notification</p>
                  <p className="text-[11px] text-slate-500">Notify users</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function mergeCn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400' },
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400' },
  }
  const c = colorMap[color] || colorMap.amber

  return (
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={mergeCn('w-9 h-9 rounded-lg flex items-center justify-center', c.bg)}>
            <Icon className={mergeCn('w-4.5 h-4.5', c.icon)} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 truncate">{title}</p>
            <p className="text-lg font-bold text-white truncate">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
