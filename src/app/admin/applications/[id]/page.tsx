'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { authFetch } from '@/lib/auth-fetch'
import { toast } from 'sonner'
import {
  ArrowLeft,
  User,
  Building2,
  Sun,
  IndianRupee,
  Leaf,
  Zap,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  MapPin,
  Upload,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  under_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  installed: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

function getFileUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/uploads/${path}`
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function isImageFile(url: string, mime?: string): boolean {
  if (mime && mime.startsWith('image/')) return true
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
}

function isPdfFile(url: string, mime?: string): boolean {
  if (mime === 'application/pdf') return true
  return /\.pdf$/i.test(url)
}

type Tab = 'details' | 'documents' | 'payments'

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()

  const [app, setApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [adminNotes, setAdminNotes] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  // Separate docs/payments with computed URLs
  const [docs, setDocs] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true)
      const [appRes, docsRes, paysRes] = await Promise.all([
        authFetch(`/api/applications/${id}`),
        authFetch(`/api/documents?applicationId=${id}`),
        authFetch(`/api/payments?applicationId=${id}`),
      ])

      if (appRes.ok) {
        const data = await appRes.json()
        setApp(data.application)
        setAdminNotes(data.application.adminNotes || '')
      }

      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocs(data.documents || [])
      }

      if (paysRes.ok) {
        const data = await paysRes.json()
        setPayments(data.payments || [])
      }
    } catch {
      toast.error('Failed to load application details')
    } finally {
      setLoading(false)
      setDataLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePaymentVerify = async (paymentId: string, newStatus: string) => {
    try {
      const res = await authFetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update payment')
      }
      toast.success(`Payment ${newStatus} successfully`)
      await fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment')
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!app) return
    try {
      setReviewLoading(true)
      const res = await authFetch(`/api/admin/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      await fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update application')
    } finally {
      setReviewLoading(false)
    }
  }

  const navItems: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'documents', label: 'Documents', icon: Upload, count: docs.length },
    { key: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
  ]

  // Client share calculation
  const totalShare = app?.estimatedCost ? Math.round(app.estimatedCost * 0.20) : 0
  const paidAmount = payments.filter((p: any) => p.status === 'verified').reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const remainingShare = Math.max(0, totalShare - paidAmount)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/admin/applications')} className="gap-2 text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Button>
        <p className="text-slate-500 text-center py-20">Application not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/admin/applications')} className="gap-2 text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-[11px] capitalize ${statusColors[app.status] || ''}`}>
            {app.status.replace(/_/g, ' ')}
          </Badge>
          <span className="text-xs text-slate-500 font-mono">{id}</span>
        </div>
      </div>

      {/* Main content: left nav + right content */}
      <div className="flex gap-6">
        {/* Left navigation */}
        <Card className="bg-slate-900/50 border-slate-800 w-48 shrink-0 self-start">
          <CardContent className="p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  activeTab === item.key
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    activeTab === item.key ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Right content area */}
        <Card className="bg-slate-900/50 border-slate-800 flex-1 min-w-0">
          <CardContent className="p-5">
            {dataLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              </div>
            ) : activeTab === 'details' ? (
              <div className="space-y-6">
                {/* Applicant Details */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-amber-400" />
                    Applicant Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Name:</span><p className="text-slate-200">{app.applicantName}</p></div>
                    <div><span className="text-slate-500">Email:</span><p className="text-slate-200">{app.applicantEmail}</p></div>
                    <div><span className="text-slate-500">Phone:</span><p className="text-slate-200">{app.applicantPhone}</p></div>
                    <div><span className="text-slate-500">Address:</span><p className="text-slate-200">{app.applicantAddress || 'N/A'}</p></div>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Property Details */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Property Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-slate-500">Type:</span><p className="text-slate-200 capitalize">{app.propertyType}</p></div>
                    <div><span className="text-slate-500">Connection:</span><p className="text-slate-200 capitalize">{app.connectionType?.replace(/_/g, ' ')}</p></div>
                    <div><span className="text-slate-500">Address:</span><p className="text-slate-200">{app.propertyAddress}</p></div>
                    <div><span className="text-slate-500">City/State:</span><p className="text-slate-200">{app.propertyCity}, {app.propertyState}</p></div>
                    <div>
                      <span className="text-slate-500">Land/Roof Size:</span>
                      <p className="text-slate-200">
                        {(() => {
                          const unit = app.landRoofSizeUnit || 'sq_ft'
                          const sqftToUnit: Record<string, number> = { sq_ft: 1, sq_yard: 1/9, sq_meter: 1/10.7639, acre: 1/43560 }
                          const unitLabels: Record<string, string> = { sq_ft: 'sq ft', sq_yard: 'sq yard', sq_meter: 'sq meter', acre: 'acre' }
                          const originalValue = app.landRoofSize * (sqftToUnit[unit] || 1)
                          return `${unit === 'sq_ft' ? app.landRoofSize.toLocaleString('en-IN') : originalValue.toFixed(2).replace(/\.?0+$/, '')} ${unitLabels[unit] || 'sq ft'}`
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Rooftop Area:</span>
                      <p className="text-slate-200">
                        {app.rooftopArea ? (() => {
                          const unit = app.rooftopAreaUnit || 'sq_ft'
                          const sqftToUnit: Record<string, number> = { sq_ft: 1, sq_yard: 1/9, sq_meter: 1/10.7639, acre: 1/43560 }
                          const unitLabels: Record<string, string> = { sq_ft: 'sq ft', sq_yard: 'sq yard', sq_meter: 'sq meter', acre: 'acre' }
                          const originalValue = app.rooftopArea * (sqftToUnit[unit] || 1)
                          return `${unit === 'sq_ft' ? app.rooftopArea.toLocaleString('en-IN') : originalValue.toFixed(2).replace(/\.?0+$/, '')} ${unitLabels[unit] || 'sq ft'}`
                        })() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Calculation Results */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Calculation Results
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <CalcResult icon={Sun} label="Recommended" value={app.recommendedCapacity ? `${app.recommendedCapacity} kW` : 'N/A'} color="amber" />
                    <CalcResult icon={IndianRupee} label="Est. Cost" value={app.estimatedCost ? formatCurrency(app.estimatedCost) : 'N/A'} color="blue" />
                    <CalcResult icon={IndianRupee} label="Annual Savings" value={app.annualSavings ? formatCurrency(app.annualSavings) : 'N/A'} color="emerald" />
                    <CalcResult icon={Leaf} label="CO₂ Reduction" value={app.co2Reduction ? `${app.co2Reduction} t/yr` : 'N/A'} color="emerald" />
                  </div>
                  {app.propertyScore && (
                    <div className="flex items-center gap-4 text-sm mt-3">
                      <div><span className="text-slate-500">Property Score:</span><span className="ml-2 text-slate-200">{app.propertyScore}/100</span></div>
                      <div>
                        <span className="text-slate-500">Class:</span>
                        <Badge variant="outline" className="ml-2 text-amber-400 border-amber-500/30">{app.propertyClass || 'N/A'}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'documents' ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                  <Upload className="w-4 h-4 text-amber-400" />
                  Submitted Documents
                </h3>
                {docs.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-10">No documents uploaded</p>
                ) : (
                  <div className="space-y-4">
                    {docs.map((doc: any) => {
                      const fileUrl = doc.fileUrl || getFileUrl(doc.filePath)
                      return (
                        <div key={doc.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${doc.verified ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                {doc.verified ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-200 capitalize">{doc.docType.replace(/_/g, ' ')}</p>
                                <p className="text-[11px] text-slate-500">{doc.fileName || ''}</p>
                              </div>
                            </div>
                            {doc.verified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">Verified</Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">Pending</Badge>
                            )}
                          </div>
                          {fileUrl && isImageFile(fileUrl, doc.mimeType) ? (
                            <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                              <img src={fileUrl} alt={doc.fileName || doc.docType} className="max-h-80 w-full object-contain" />
                            </div>
                          ) : fileUrl && isPdfFile(fileUrl, doc.mimeType) ? (
                            <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                              <iframe src={fileUrl} className="w-full h-80" title={doc.fileName || doc.docType} />
                            </div>
                          ) : fileUrl ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                              View File
                            </a>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Payments tab */
              <div>
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  Payment Receipts
                </h3>

                {/* User's Share Summary */}
                <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4 mb-4">
                  <p className="text-xs font-medium text-slate-400 mb-3">User's Share Summary (20%)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-slate-800/50 p-2.5 text-center">
                      <p className="text-[10px] text-slate-500">Total Share</p>
                      <p className="text-sm font-bold text-slate-200">{formatCurrency(totalShare)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-2.5 text-center">
                      <p className="text-[10px] text-slate-500">Paid Amount</p>
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(paidAmount)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-2.5 text-center">
                      <p className="text-[10px] text-slate-500">Remaining</p>
                      <p className="text-sm font-bold text-amber-400">{formatCurrency(remainingShare)}</p>
                    </div>
                  </div>
                </div>

                {payments.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-10">No payments made</p>
                ) : (
                  <div className="space-y-4">
                    {payments.map((pay: any) => {
                      const screenshotUrl = pay.screenshotUrl || getFileUrl(pay.screenshotPath)
                      return (
                        <div key={pay.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                                pay.status === 'verified' ? 'bg-emerald-500/10' : pay.status === 'rejected' ? 'bg-red-500/10' : 'bg-amber-500/10'
                              }`}>
                                {pay.status === 'verified' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
                                 pay.status === 'rejected' ? <XCircle className="h-4 w-4 text-red-400" /> :
                                 <Clock className="h-4 w-4 text-amber-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-200">
                                  {formatCurrency(pay.amount)} <span className="text-xs text-slate-400 capitalize">({pay.paymentType?.replace(/_/g, ' ') || 'processing_fee'})</span>
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {pay.paymentMethod === 'upi' ? 'UPI' : 'Bank Transfer'}
                                  {pay.transactionId ? ` · ${pay.transactionId}` : ''}
                                </p>
                              </div>
                            </div>
                            {pay.status === 'verified' ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">Verified</Badge>
                            ) : pay.status === 'rejected' ? (
                              <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">Rejected</Badge>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handlePaymentVerify(pay.id, 'verified')}
                                  className="text-[11px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handlePaymentVerify(pay.id, 'rejected')}
                                  className="text-[11px] px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                          {screenshotUrl && (
                            <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                              <img src={screenshotUrl} alt="Payment screenshot" className="max-h-80 w-full object-contain" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Admin Notes + Status Controls */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm">Admin Notes</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this application..."
              className="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-600 min-h-[80px]"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {app.status !== 'approved' && (
              <Button onClick={() => handleStatusUpdate('approved')} disabled={reviewLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {reviewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Approve
              </Button>
            )}
            {app.status !== 'under_review' && app.status !== 'approved' && app.status !== 'rejected' && (
              <Button onClick={() => handleStatusUpdate('under_review')} disabled={reviewLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {reviewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                Under Review
              </Button>
            )}
            {app.status !== 'rejected' && (
              <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')} disabled={reviewLoading}>
                {reviewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Reject
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CalcResult({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
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