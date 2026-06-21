'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  CreditCard,
  Clock,
  ImageIcon,
  ExternalLink,
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

interface Payment {
  id: string
  userId: string
  applicationId?: string
  amount: number
  paymentType: string
  paymentMethod: string
  transactionId?: string
  screenshotPath?: string
  status: string
  verifiedBy?: string
  verifiedAt?: string
  remarks?: string
  createdAt: string
  user: { id: string; name: string; email: string; phone?: string }
  application?: { id: string; applicantName: string; status: string }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  verified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const methodLabels: Record<string, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
}

const typeLabels: Record<string, string> = {
  application_fee: 'Application Fee',
  installation_fee: 'Installation Fee',
  maintenance_fee: 'Maintenance Fee',
}

export default function AdminPaymentsPage() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Verify dialog
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [remarks, setRemarks] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await authFetch(`/api/payments?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPayments(data.payments)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, user?.id])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleVerify = async (newStatus: 'verified' | 'rejected') => {
    if (!selectedPayment) return
    try {
      setActionLoading(true)
      const res = await authFetch(`/api/payments/${selectedPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          remarks,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(`Payment ${newStatus} successfully`)
      setSelectedPayment(null)
      setRemarks('')
      fetchPayments()
    } catch {
      toast.error('Failed to update payment')
    } finally {
      setActionLoading(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-slate-400 text-sm mt-1">Verify and manage payment records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Total</p>
              <p className="text-lg font-bold text-white">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Pending</p>
              <p className="text-lg font-bold text-white">{payments.filter((p) => p.status === 'pending').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Verified</p>
              <p className="text-lg font-bold text-white">{payments.filter((p) => p.status === 'verified').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Total Amount</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(payments.filter((p) => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-slate-200">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-slate-500">{total} payment{total !== 1 ? 's' : ''}</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              No payments found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-500">User</TableHead>
                      <TableHead className="text-slate-500">Amount</TableHead>
                      <TableHead className="text-slate-500 hidden sm:table-cell">Type</TableHead>
                      <TableHead className="text-slate-500 hidden md:table-cell">Method</TableHead>
                      <TableHead className="text-slate-500 hidden lg:table-cell">Transaction ID</TableHead>
                      <TableHead className="text-slate-500">Status</TableHead>
                      <TableHead className="text-slate-500 hidden md:table-cell">Date</TableHead>
                      <TableHead className="text-slate-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow
                        key={payment.id}
                        className="border-slate-800/50 hover:bg-slate-800/30"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm text-slate-200">{payment.user.name}</p>
                            <p className="text-xs text-slate-500">{payment.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-emerald-400">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-400 hidden sm:table-cell">
                          {typeLabels[payment.paymentType] || payment.paymentType}
                        </TableCell>
                        <TableCell className="text-sm text-slate-400 hidden md:table-cell">
                          {methodLabels[payment.paymentMethod] || payment.paymentMethod}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500 hidden lg:table-cell">
                          {payment.transactionId || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[11px] capitalize ${statusColors[payment.status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 hidden md:table-cell">
                          {formatDate(payment.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setRemarks(payment.remarks || '')
                            }}
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-slate-800">
                <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
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

      {/* Verify Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Payment Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review and verify payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">User:</span>
                  <p className="text-slate-200">{selectedPayment.user.name}</p>
                  <p className="text-xs text-slate-500">{selectedPayment.user.email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Amount:</span>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Type:</span>
                  <p className="text-slate-200">{typeLabels[selectedPayment.paymentType] || selectedPayment.paymentType}</p>
                </div>
                <div>
                  <span className="text-slate-500">Method:</span>
                  <p className="text-slate-200">{methodLabels[selectedPayment.paymentMethod] || selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-slate-500">Transaction ID:</span>
                  <p className="font-mono text-xs text-slate-300">{selectedPayment.transactionId || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>
                  <p className="text-slate-200">{formatDate(selectedPayment.createdAt)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] capitalize ${statusColors[selectedPayment.status] || ''}`}
                  >
                    {selectedPayment.status}
                  </Badge>
                </div>
                {selectedPayment.application && (
                  <div>
                    <span className="text-slate-500">Application:</span>
                    <p className="text-slate-200">{selectedPayment.application.applicantName}</p>
                  </div>
                )}
              </div>

              {/* Screenshot */}
              {selectedPayment.screenshotPath && (
                <>
                  <Separator className="bg-slate-800" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      Payment Screenshot
                    </h3>
                    <a
                      href={selectedPayment.screenshotPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Screenshot
                    </a>
                  </div>
                </>
              )}

              {/* Existing remarks */}
              {selectedPayment.remarks && (
                <div className="text-sm">
                  <span className="text-slate-500">Existing Remarks:</span>
                  <p className="text-slate-300 mt-1 p-2 rounded bg-slate-800/50 text-xs">{selectedPayment.remarks}</p>
                </div>
              )}

              <Separator className="bg-slate-800" />

              {/* Remarks for verification */}
              {selectedPayment.status === 'pending' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-sm">Remarks</Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add remarks for this verification..."
                      className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1 min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleVerify('verified')}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Verify
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleVerify('rejected')}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {selectedPayment.status !== 'pending' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30">
                  {selectedPayment.status === 'verified' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm text-slate-300">
                    This payment has already been {selectedPayment.status}
                    {selectedPayment.verifiedAt && ` on ${formatDate(selectedPayment.verifiedAt)}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
