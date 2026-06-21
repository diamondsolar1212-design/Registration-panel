'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  FolderOpen,
  Upload,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  FileImage,
  File,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Document {
  id: string
  docType: string
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  verified: boolean
  remarks: string | null
  createdAt: string
  application?: {
    id: string
    applicantName: string
  } | null
}

interface Application {
  id: string
  applicantName: string
  status: string
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const docTypeLabels: Record<string, string> = {
  identity: 'Identity Proof',
  address_proof: 'Address Proof',
  property_ownership: 'Property Ownership',
  electricity_bill: 'Electricity Bill',
  payment_screenshot: 'Payment Screenshot',
  other: 'Other',
}

const docTypeIcons: Record<string, typeof FileText> = {
  identity: FileText,
  address_proof: FileText,
  property_ownership: FileText,
  electricity_bill: FileImage,
  payment_screenshot: FileImage,
  other: File,
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [docType, setDocType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [applicationId, setApplicationId] = useState('')

  // Dialog state
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await authFetch('/api/documents')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchApplications = useCallback(async () => {
    if (!user) return
    try {
      const res = await authFetch('/api/applications')
      if (!res.ok) return
      const data = await res.json()
      setApplications(data.applications || [])
    } catch {
      // Non-critical
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchDocuments()
    fetchApplications()
  }, [isAuthenticated, fetchDocuments, fetchApplications])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!docType || !file) {
      toast.error('Please select a document type and file')
      return
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image or PDF file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docType', docType)
      if (applicationId) {
        formData.append('applicationId', applicationId)
      }

      const res = await authFetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to upload document')
        return
      }

      toast.success('Document uploaded successfully!')
      setDocType('')
      setFile(null)
      setApplicationId('')
      // Reset file input
      const fileInput = document.getElementById('doc-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      fetchDocuments()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !deleteDoc) return
    try {
      const res = await authFetch(`/api/documents/${deleteDoc.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete document')
        return
      }
      toast.success('Document deleted successfully')
      fetchDocuments()
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeleteDoc(null)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Documents
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Upload and manage your documents for verification.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Upload Document Form */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="lg:col-span-1"
          >
            <Card className="border-amber-200/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Upload Document</CardTitle>
                    <CardDescription>Add a new document</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-amber-900">
                      Document Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger className="w-full border-amber-200 focus:border-amber-400">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="identity">Identity Proof</SelectItem>
                        <SelectItem value="address_proof">Address Proof</SelectItem>
                        <SelectItem value="property_ownership">Property Ownership</SelectItem>
                        <SelectItem value="electricity_bill">Electricity Bill</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-file" className="text-amber-900">
                      File <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="doc-file"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="border-amber-200 focus-visible:border-amber-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                    />
                    {file && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <File className="h-3 w-3" />
                        {file.name} ({formatFileSize(file.size)})
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Accepts images and PDFs (max 10MB)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-amber-900">
                      Link to Application <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <Select value={applicationId} onValueChange={setApplicationId}>
                      <SelectTrigger className="w-full border-amber-200 focus:border-amber-400">
                        <SelectValue placeholder="Select application" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.applicantName} — {app.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* My Documents Table */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="lg:col-span-2"
          >
            <Card className="border-amber-200/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                    <FolderOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">My Documents</CardTitle>
                    <CardDescription>All your uploaded documents</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
                      <FolderOpen className="h-8 w-8 text-amber-400" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">No documents yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Upload your first document to get started
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-3 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-amber-50 [&::-webkit-scrollbar-thumb]:bg-amber-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {documents.map((doc) => {
                        const DocIcon = docTypeIcons[doc.docType] || File
                        return (
                          <div key={doc.id} className="mobile-touch-card rounded-xl border border-amber-100 bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DocIcon className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-medium">
                                  {docTypeLabels[doc.docType] || doc.docType}
                                </span>
                              </div>
                              {doc.verified ? (
                                <Badge variant="outline" className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 bg-amber-100 text-amber-700 border-amber-200">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-foreground truncate max-w-[180px]">
                                {doc.fileName}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {formatFileSize(doc.fileSize)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground/70">
                                {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => setPreviewDoc(doc)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteDoc(doc)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden md:block max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-amber-50 [&::-webkit-scrollbar-thumb]:bg-amber-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-amber-100 hover:bg-transparent">
                            <TableHead className="text-amber-800">Type</TableHead>
                            <TableHead className="text-amber-800">File Name</TableHead>
                            <TableHead className="text-amber-800">Size</TableHead>
                            <TableHead className="text-amber-800">Uploaded</TableHead>
                            <TableHead className="text-amber-800">Status</TableHead>
                            <TableHead className="text-amber-800">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((doc) => {
                            const DocIcon = docTypeIcons[doc.docType] || File
                            return (
                              <TableRow key={doc.id} className="border-amber-50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <DocIcon className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm font-medium">
                                      {docTypeLabels[doc.docType] || doc.docType}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm max-w-[200px] truncate">
                                  {doc.fileName}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatFileSize(doc.fileSize)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </TableCell>
                                <TableCell>
                                  {doc.verified ? (
                                    <Badge
                                      variant="outline"
                                      className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="gap-1 bg-amber-100 text-amber-700 border-amber-200"
                                    >
                                      <Clock className="h-3 w-3" />
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => setPreviewDoc(doc)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => setDeleteDoc(doc)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                {previewDoc?.fileName}
              </DialogTitle>
              <DialogDescription>
                {docTypeLabels[previewDoc?.docType || ''] || previewDoc?.docType}
              </DialogDescription>
            </DialogHeader>
            {previewDoc && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-amber-200">
                  {previewDoc.mimeType?.startsWith('image/') ? (
                    <img
                      src={previewDoc.filePath}
                      alt={previewDoc.fileName}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-amber-50">
                      <File className="h-12 w-12 text-amber-300 mb-3" />
                      <p className="text-sm text-muted-foreground">PDF preview not available</p>
                      <a
                        href={previewDoc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-amber-600 hover:underline mt-2"
                      >
                        Open file in new tab
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  {previewDoc.verified ? (
                    <Badge variant="outline" className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 bg-amber-100 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3" />
                      Pending Verification
                    </Badge>
                  )}
                </div>
                {previewDoc.remarks && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Remarks:</span>{' '}
                    <span>{previewDoc.remarks}</span>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Delete Document
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{deleteDoc?.fileName}&rdquo;? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
