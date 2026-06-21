'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  Loader2,
  Eye,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  History,
  Edit,
  Calendar,
  User,
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'

interface ApprovalHistory {
  id: string
  action: string
  performedBy: string
  notes?: string
  createdAt: string
}

interface ApprovalVersion {
  id: string
  version: number
  generatedAt: string
  generatedBy?: string
}

interface Approval {
  id: string
  approvalNumber: string
  approvedBy: string
  approvedAt: string
  validUntil?: string
  terms?: string
  conditions?: string
  pdfGenerated: boolean
  pdfPath?: string
  createdAt: string
  application: {
    id: string
    applicantName: string
    propertyType: string
    propertyAddress: string
    status: string
    userId: string
  }
  versions?: ApprovalVersion[]
  history?: ApprovalHistory[]
}

export default function AdminApprovalsPage() {
  const { user } = useAuthStore()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Detail dialog
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [editTerms, setEditTerms] = useState('')
  const [editConditions, setEditConditions] = useState('')
  const [editValidUntil, setEditValidUntil] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch(`/api/approvals?page=${page}&limit=10`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setApprovals(data.approvals)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch {
      toast.error('Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }, [page, user?.id])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const handleUpdateApproval = async () => {
    if (!selectedApproval) return
    try {
      setActionLoading(true)
      const body: Record<string, unknown> = {
        notes: editNotes,
        action: 'updated',
      }
      if (editTerms) body.terms = editTerms
      if (editConditions) body.conditions = editConditions
      if (editValidUntil) body.validUntil = editValidUntil

      const res = await authFetch(`/api/approvals/${selectedApproval.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Approval updated successfully')
      setSelectedApproval(null)
      fetchApprovals()
    } catch {
      toast.error('Failed to update approval')
    } finally {
      setActionLoading(false)
    }
  }

  const handleGeneratePdf = async () => {
    if (!selectedApproval) return
    try {
      setActionLoading(true)
      const body: Record<string, unknown> = {}
      if (editTerms) body.terms = editTerms
      if (editConditions) body.conditions = editConditions
      if (editValidUntil) body.validUntil = editValidUntil

      const res = await authFetch(`/api/approvals/${selectedApproval.id}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()
      toast.success(data.message || 'PDF generated successfully')
      fetchApprovals()
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setActionLoading(false)
    }
  }

  const openDetail = (approval: Approval) => {
    setSelectedApproval(approval)
    setEditTerms(approval.terms || '')
    setEditConditions(approval.conditions || '')
    setEditValidUntil(approval.validUntil ? approval.validUntil.split('T')[0] : '')
    setEditNotes('')
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

  const actionColors: Record<string, string> = {
    created: 'bg-emerald-500/15 text-emerald-400',
    updated: 'bg-blue-500/15 text-blue-400',
    revoked: 'bg-red-500/15 text-red-400',
    reissued: 'bg-amber-500/15 text-amber-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Approvals</h1>
        <p className="text-slate-400 text-sm mt-1">Manage approval letters and documentation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Total Approvals</p>
              <p className="text-lg font-bold text-white">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">PDF Generated</p>
              <p className="text-lg font-bold text-white">{approvals.filter((a) => a.pdfGenerated).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Pending PDF</p>
              <p className="text-lg font-bold text-white">{approvals.filter((a) => !a.pdfGenerated).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <History className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">With History</p>
              <p className="text-lg font-bold text-white">{approvals.filter((a) => a.history && a.history.length > 1).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : approvals.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              No approvals found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-500">Approval #</TableHead>
                      <TableHead className="text-slate-500">Applicant</TableHead>
                      <TableHead className="text-slate-500 hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-slate-500">PDF</TableHead>
                      <TableHead className="text-slate-500 hidden md:table-cell">Valid Until</TableHead>
                      <TableHead className="text-slate-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((approval) => (
                      <TableRow
                        key={approval.id}
                        className="border-slate-800/50 hover:bg-slate-800/30"
                      >
                        <TableCell>
                          <p className="font-mono text-sm text-amber-400">{approval.approvalNumber}</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-slate-200">{approval.application.applicantName}</p>
                            <p className="text-xs text-slate-500 capitalize">{approval.application.propertyType}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-400 hidden sm:table-cell">
                          {formatDate(approval.approvedAt)}
                        </TableCell>
                        <TableCell>
                          {approval.pdfGenerated ? (
                            <Badge variant="outline" className="text-[11px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                              Generated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-400 hidden md:table-cell">
                          {approval.validUntil ? formatDate(approval.validUntil) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetail(approval)}
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={(open) => !open && setSelectedApproval(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              Approval Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedApproval?.approvalNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-5">
              {/* Approval Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Approval #:</span>
                  <p className="font-mono text-amber-400">{selectedApproval.approvalNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Applicant:</span>
                  <p className="text-slate-200">{selectedApproval.application.applicantName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Approved Date:</span>
                  <p className="text-slate-200">{formatDate(selectedApproval.approvedAt)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Valid Until:</span>
                  <p className="text-slate-200">{selectedApproval.validUntil ? formatDate(selectedApproval.validUntil) : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Property:</span>
                  <p className="text-slate-200 capitalize">{selectedApproval.application.propertyType}</p>
                </div>
                <div>
                  <span className="text-slate-500">PDF Status:</span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] ${selectedApproval.pdfGenerated ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'}`}
                  >
                    {selectedApproval.pdfGenerated ? 'Generated' : 'Pending'}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              {/* Edit Form */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-400" />
                  Edit Approval
                </h3>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-slate-400 text-xs">Valid Until</Label>
                    <Input
                      type="date"
                      value={editValidUntil}
                      onChange={(e) => setEditValidUntil(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Terms</Label>
                    <Textarea
                      value={editTerms}
                      onChange={(e) => setEditTerms(e.target.value)}
                      placeholder="Terms and conditions..."
                      className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1 min-h-[60px]"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Conditions</Label>
                    <Textarea
                      value={editConditions}
                      onChange={(e) => setEditConditions(e.target.value)}
                      placeholder="Special conditions..."
                      className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1 min-h-[60px]"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Update Notes</Label>
                    <Input
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Reason for update..."
                      className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleUpdateApproval}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit className="w-4 h-4 mr-2" />}
                  Update Approval
                </Button>
                <Button
                  onClick={handleGeneratePdf}
                  disabled={actionLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Generate PDF
                </Button>
              </div>

              {/* History */}
              {selectedApproval.history && selectedApproval.history.length > 0 && (
                <>
                  <Separator className="bg-slate-800" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-400" />
                      Approval History
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedApproval.history.map((h) => (
                        <div key={h.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/30">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${actionColors[h.action]?.split(' ')[0] || 'bg-slate-500/15'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] capitalize ${actionColors[h.action] || 'bg-slate-500/15 text-slate-400'}`}>
                                {h.action}
                              </Badge>
                              <span className="text-[11px] text-slate-500">{formatDate(h.createdAt)}</span>
                            </div>
                            {h.notes && (
                              <p className="text-xs text-slate-400 mt-1">{h.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Versions */}
              {selectedApproval.versions && selectedApproval.versions.length > 0 && (
                <>
                  <Separator className="bg-slate-800" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      Letter Versions
                    </h3>
                    <div className="space-y-2">
                      {selectedApproval.versions.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] bg-slate-700 text-slate-300 border-slate-600">
                              v{v.version}
                            </Badge>
                            <span className="text-xs text-slate-400">{formatDate(v.generatedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
