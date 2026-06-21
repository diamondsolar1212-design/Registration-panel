'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  Search,
  Filter,
  Loader2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  IndianRupee,
  Leaf,
  MapPin,
  User,
  Building2,
  Sun,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface Application {
  id: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  applicantAddress?: string
  propertyType: string
  propertyAddress: string
  propertyState: string
  propertyCity: string
  propertyPincode: string
  landRoofSize: number
  landRoofSizeUnit?: string
  rooftopArea?: number
  rooftopAreaUnit?: string
  connectionType: string
  preferredCapacity?: number
  electricityBill?: number
  existingConnection: boolean
  recommendedCapacity?: number
  estimatedCost?: number
  annualSavings?: number
  propertyScore?: number
  propertyClass?: string
  co2Reduction?: number
  status: string
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  user: { id: string; name: string; email: string; phone?: string }
  _count?: { documents: number; payments: number }
  documents?: Array<{ id: string; docType: string; verified: boolean }>
  payments?: Array<{ id: string; amount: number; status: string }>
  approvals?: Array<{ id: string; approvalNumber: string }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  under_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  installed: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

export default function AdminApplicationsPage() {
  const { user } = useAuthStore()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Review dialog
  const [reviewApp, setReviewApp] = useState<Application | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await authFetch(`/api/admin/applications?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setApplications(data.applications)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, user?.id])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleReview = async (newStatus: string) => {
    if (!reviewApp) return
    try {
      setReviewLoading(true)
      const res = await authFetch(`/api/admin/applications/${reviewApp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
          reviewedBy: user?.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      toast.success(`Application ${newStatus.replace(/_/g, ' ')} successfully`)
      setReviewApp(null)
      setAdminNotes('')
      fetchApplications()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update application')
    } finally {
      setReviewLoading(false)
    }
  }

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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Applications</h1>
        <p className="text-slate-400 text-sm mt-1">Review and manage solar applications</p>
      </div>

      {/* Search & Filter */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10 bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-800/50 border-slate-700 text-slate-200">
                <Filter className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-slate-500 mt-2">{total} application{total !== 1 ? 's' : ''} found</p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              No applications found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-500">Applicant</TableHead>
                      <TableHead className="text-slate-500">Property Type</TableHead>
                      <TableHead className="text-slate-500 hidden md:table-cell">Capacity</TableHead>
                      <TableHead className="text-slate-500">Status</TableHead>
                      <TableHead className="text-slate-500 hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-slate-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow
                        key={app.id}
                        className="border-slate-800/50 hover:bg-slate-800/30"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-200 text-sm">{app.applicantName}</p>
                            <p className="text-xs text-slate-500">{app.applicantEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-400 capitalize">{app.propertyType}</TableCell>
                        <TableCell className="text-sm text-slate-400 hidden md:table-cell">
                          {app.recommendedCapacity ? `${app.recommendedCapacity} kW` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[11px] capitalize ${statusColors[app.status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}
                          >
                            {app.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 hidden sm:table-cell">
                          {formatDate(app.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReviewApp(app)
                              setAdminNotes(app.adminNotes || '')
                            }}
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-800">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="bg-slate-800/50 border-slate-700 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="bg-slate-800/50 border-slate-700 text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!reviewApp} onOpenChange={(open) => !open && setReviewApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Review Application</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review and update application status
            </DialogDescription>
          </DialogHeader>

          {reviewApp && (
            <div className="space-y-5">
              {/* Personal Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  Applicant Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Name:</span>
                    <p className="text-slate-200">{reviewApp.applicantName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="text-slate-200">{reviewApp.applicantEmail}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone:</span>
                    <p className="text-slate-200">{reviewApp.applicantPhone}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Address:</span>
                    <p className="text-slate-200">{reviewApp.applicantAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* Property Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Property Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Type:</span>
                    <p className="text-slate-200 capitalize">{reviewApp.propertyType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Connection:</span>
                    <p className="text-slate-200 capitalize">{reviewApp.connectionType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Address:</span>
                    <p className="text-slate-200">{reviewApp.propertyAddress}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">City/State:</span>
                    <p className="text-slate-200">{reviewApp.propertyCity}, {reviewApp.propertyState}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Land/Roof Size:</span>
                    <p className="text-slate-200">{(() => {
                      const unit = reviewApp.landRoofSizeUnit || 'sq_ft'
                      const sqftToUnit: Record<string, number> = { sq_ft: 1, sq_yard: 1/9, sq_meter: 1/10.7639, acre: 1/43560 }
                      const unitLabels: Record<string, string> = { sq_ft: 'sq ft', sq_yard: 'sq yard', sq_meter: 'sq meter', acre: 'acre' }
                      const originalValue = reviewApp.landRoofSize * (sqftToUnit[unit] || 1)
                      return `${unit === 'sq_ft' ? reviewApp.landRoofSize.toLocaleString('en-IN') : originalValue.toFixed(2).replace(/\.?0+$/, '')} ${unitLabels[unit] || 'sq ft'}`
                    })()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Rooftop Area:</span>
                    <p className="text-slate-200">{reviewApp.rooftopArea ? (() => {
                      const unit = reviewApp.rooftopAreaUnit || 'sq_ft'
                      const sqftToUnit: Record<string, number> = { sq_ft: 1, sq_yard: 1/9, sq_meter: 1/10.7639, acre: 1/43560 }
                      const unitLabels: Record<string, string> = { sq_ft: 'sq ft', sq_yard: 'sq yard', sq_meter: 'sq meter', acre: 'acre' }
                      const originalValue = reviewApp.rooftopArea! * (sqftToUnit[unit] || 1)
                      return `${unit === 'sq_ft' ? reviewApp.rooftopArea!.toLocaleString('en-IN') : originalValue.toFixed(2).replace(/\.?0+$/, '')} ${unitLabels[unit] || 'sq ft'}`
                    })() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* Auto-calculation Results */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Calculation Results
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <CalcResult
                    icon={Sun}
                    label="Recommended"
                    value={reviewApp.recommendedCapacity ? `${reviewApp.recommendedCapacity} kW` : 'N/A'}
                    color="amber"
                  />
                  <CalcResult
                    icon={IndianRupee}
                    label="Est. Cost"
                    value={reviewApp.estimatedCost ? formatCurrency(reviewApp.estimatedCost) : 'N/A'}
                    color="blue"
                  />
                  <CalcResult
                    icon={IndianRupee}
                    label="Annual Savings"
                    value={reviewApp.annualSavings ? formatCurrency(reviewApp.annualSavings) : 'N/A'}
                    color="emerald"
                  />
                  <CalcResult
                    icon={Leaf}
                    label="CO₂ Reduction"
                    value={reviewApp.co2Reduction ? `${reviewApp.co2Reduction} t/yr` : 'N/A'}
                    color="emerald"
                  />
                </div>
                {reviewApp.propertyScore && (
                  <div className="flex items-center gap-4 text-sm mt-2">
                    <div>
                      <span className="text-slate-500">Property Score:</span>
                      <span className="ml-2 text-slate-200">{reviewApp.propertyScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Class:</span>
                      <Badge variant="outline" className="ml-2 text-amber-400 border-amber-500/30">
                        {reviewApp.propertyClass || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-slate-800" />

              {/* Additional Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Documents:</span>
                  <p className="text-slate-200">{reviewApp._count?.documents || reviewApp.documents?.length || 0}</p>
                </div>
                <div>
                  <span className="text-slate-500">Payments:</span>
                  <p className="text-slate-200">{reviewApp._count?.payments || reviewApp.payments?.length || 0}</p>
                </div>
                <div>
                  <span className="text-slate-500">Current Status:</span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] capitalize ${statusColors[reviewApp.status] || ''}`}
                  >
                    {reviewApp.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-500">Applied:</span>
                  <p className="text-slate-200">{formatDate(reviewApp.createdAt)}</p>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  className="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-600 min-h-[80px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {reviewApp.status !== 'approved' && (
                  <Button
                    onClick={() => handleReview('approved')}
                    disabled={reviewLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {reviewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                )}
                {reviewApp.status !== 'under_review' && reviewApp.status !== 'approved' && reviewApp.status !== 'rejected' && (
                  <Button
                    onClick={() => handleReview('under_review')}
                    disabled={reviewLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {reviewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                    Under Review
                  </Button>
                )}
                {reviewApp.status !== 'rejected' && (
                  <Button
                    variant="destructive"
                    onClick={() => handleReview('rejected')}
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CalcResult({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  }
  const c = colorMap[color] || colorMap.amber

  return (
    <div className={`p-3 rounded-lg ${c.bg}`}>
      <Icon className={`w-4 h-4 ${c.text} mb-1`} />
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  )
}
