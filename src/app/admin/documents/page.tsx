'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  FileCheck,
  ExternalLink,
  Filter,
  Clock,
  Shield,
  File,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

interface Document {
  id: string
  userId: string
  applicationId?: string
  docType: string
  fileName: string
  filePath: string
  fileSize?: number
  mimeType?: string
  verified: boolean
  verifiedBy?: string
  verifiedAt?: string
  remarks?: string
  createdAt: string
  user: { id: string; name: string; email: string }
  application?: { id: string; applicantName: string; status: string }
}

const docTypeLabels: Record<string, string> = {
  identity: 'Identity Proof',
  address_proof: 'Address Proof',
  property_ownership: 'Property Ownership',
  electricity_bill: 'Electricity Bill',
  payment_screenshot: 'Payment Screenshot',
  other: 'Other',
}

const docTypeColors: Record<string, string> = {
  identity: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  address_proof: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  property_ownership: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  electricity_bill: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  payment_screenshot: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  other: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export default function AdminDocumentsPage() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [docTypeFilter, setDocTypeFilter] = useState('all')

  // Verify dialog
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [remarks, setRemarks] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (docTypeFilter !== 'all') params.set('docType', docTypeFilter)

      const res = await authFetch(`/api/documents?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setDocuments(data.documents)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [docTypeFilter, user?.id])

  const handleVerify = async (verified: boolean) => {
    if (!selectedDoc) return
    try {
      setActionLoading(true)
      const res = await authFetch(`/api/documents/${selectedDoc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified,
          remarks,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(`Document ${verified ? 'verified' : 'rejected'} successfully`)
      setSelectedDoc(null)
      setRemarks('')
      fetchDocuments()
    } catch {
      toast.error('Failed to update document')
    } finally {
      setActionLoading(false)
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const verifiedCount = documents.filter((d) => d.verified).length
  const pendingCount = documents.filter((d) => !d.verified).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <p className="text-slate-400 text-sm mt-1">Verify and manage uploaded documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <File className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Total</p>
              <p className="text-lg font-bold text-white">{documents.length}</p>
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
              <p className="text-lg font-bold text-white">{verifiedCount}</p>
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
              <p className="text-lg font-bold text-white">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Verified Rate</p>
              <p className="text-lg font-bold text-white">
                {documents.length > 0 ? Math.round((verifiedCount / documents.length) * 100) : 0}%
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
              value={docTypeFilter}
              onValueChange={setDocTypeFilter}
            >
              <SelectTrigger className="w-[200px] bg-slate-800/50 border-slate-700 text-slate-200">
                <Filter className="w-4 h-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="identity">Identity Proof</SelectItem>
                <SelectItem value="address_proof">Address Proof</SelectItem>
                <SelectItem value="property_ownership">Property Ownership</SelectItem>
                <SelectItem value="electricity_bill">Electricity Bill</SelectItem>
                <SelectItem value="payment_screenshot">Payment Screenshot</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-slate-500">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
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
          ) : documents.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              No documents found
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-500">User</TableHead>
                    <TableHead className="text-slate-500">Doc Type</TableHead>
                    <TableHead className="text-slate-500">File Name</TableHead>
                    <TableHead className="text-slate-500 hidden sm:table-cell">Size</TableHead>
                    <TableHead className="text-slate-500 hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-slate-500">Status</TableHead>
                    <TableHead className="text-slate-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className="border-slate-800/50 hover:bg-slate-800/30"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm text-slate-200">{doc.user.name}</p>
                          <p className="text-xs text-slate-500">{doc.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${docTypeColors[doc.docType] || docTypeColors.other}`}
                        >
                          {docTypeLabels[doc.docType] || doc.docType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <File className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-sm text-slate-300 truncate">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 hidden sm:table-cell">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 hidden md:table-cell">
                        {formatDate(doc.createdAt)}
                      </TableCell>
                      <TableCell>
                        {doc.verified ? (
                          <Badge variant="outline" className="text-[11px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDoc(doc)
                              setRemarks(doc.remarks || '')
                            }}
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
          )}
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              Document Verification
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review and verify document
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">User:</span>
                  <p className="text-slate-200">{selectedDoc.user.name}</p>
                  <p className="text-xs text-slate-500">{selectedDoc.user.email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Document Type:</span>
                  <p className="text-slate-200">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${docTypeColors[selectedDoc.docType] || docTypeColors.other}`}
                    >
                      {docTypeLabels[selectedDoc.docType] || selectedDoc.docType}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">File Name:</span>
                  <p className="text-slate-200 text-xs truncate">{selectedDoc.fileName}</p>
                </div>
                <div>
                  <span className="text-slate-500">File Size:</span>
                  <p className="text-slate-200">{formatFileSize(selectedDoc.fileSize)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Uploaded:</span>
                  <p className="text-slate-200">{formatDate(selectedDoc.createdAt)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  {selectedDoc.verified ? (
                    <Badge variant="outline" className="text-[11px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>

              {selectedDoc.application && (
                <div className="text-sm">
                  <span className="text-slate-500">Application:</span>
                  <p className="text-slate-200">{selectedDoc.application.applicantName}</p>
                </div>
              )}

              {/* View file link */}
              <a
                href={selectedDoc.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
              >
                <ExternalLink className="w-4 h-4" />
                View Document File
              </a>

              {/* Existing remarks */}
              {selectedDoc.remarks && (
                <div className="text-sm">
                  <span className="text-slate-500">Existing Remarks:</span>
                  <p className="text-slate-300 mt-1 p-2 rounded bg-slate-800/50 text-xs">{selectedDoc.remarks}</p>
                </div>
              )}

              {selectedDoc.verifiedAt && (
                <div className="text-sm">
                  <span className="text-slate-500">Verified At:</span>
                  <p className="text-slate-300">{formatDate(selectedDoc.verifiedAt)}</p>
                </div>
              )}

              <Separator className="bg-slate-800" />

              {/* Verify/Reject for pending docs */}
              {!selectedDoc.verified ? (
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
                      onClick={() => handleVerify(true)}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Verify
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleVerify(false)}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">This document has been verified</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
