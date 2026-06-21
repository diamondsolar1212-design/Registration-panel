'use client'

import { useEffect, useState, useRef } from 'react'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FileCheck,
  Download,
  Eye,
  Calendar,
  Shield,
  CheckCircle2,
  Clock,
  Loader2,
  Sun,
  AlertCircle,
  Award,
  ChevronRight,
  Building2,
  User,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface ApprovalApplication {
  id: string
  applicantName: string
  propertyType: string
  propertyAddress: string
  status: string
  userId: string
}

interface Approval {
  id: string
  approvalNumber: string
  approvedBy: string
  approvedAt: string
  validUntil: string | null
  terms: string | null
  conditions: string | null
  pdfGenerated: boolean
  pdfPath: string | null
  application: ApprovalApplication
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

export default function ApprovalPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const printRef = useRef<HTMLDivElement>(null)

  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)



  useEffect(() => {
    if (!user?.id) return

    const fetchApprovals = async () => {
      setLoading(true)
      try {
        const res = await authFetch('/api/approvals')
        if (res.ok) {
          const data = await res.json()
          setApprovals(data.approvals || [])
        }
      } catch (error) {
        console.error('Failed to fetch approvals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchApprovals()
  }, [user?.id])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const handleViewLetter = (approval: Approval) => {
    setSelectedApproval(approval)
    setDialogOpen(true)
  }

  const handleDownloadPDF = (approval: Approval) => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Approval Letter - ${approval.approvalNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px double #d97706; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: bold; color: #d97706; letter-spacing: 1px; }
          .company-subtitle { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 3px; margin-top: 4px; }
          .company-address { font-size: 11px; color: #888; margin-top: 8px; }
          .letter-title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 30px 0 20px; color: #333; border: 1px solid #d97706; padding: 10px; }
          .ref-number { font-size: 11px; color: #666; margin-bottom: 20px; }
          .date { text-align: right; font-size: 12px; color: #555; margin-bottom: 30px; }
          .content { font-size: 13px; text-align: justify; }
          .content p { margin-bottom: 12px; }
          .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .details-table td { padding: 8px 12px; border: 1px solid #ddd; font-size: 12px; }
          .details-table td:first-child { font-weight: bold; background: #fef3c7; width: 40%; color: #92400e; }
          .signature { margin-top: 50px; }
          .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 60px; padding-top: 5px; font-size: 12px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; color: #888; text-align: center; }
          .stamp { position: relative; }
          .stamp::after { content: 'APPROVED'; position: absolute; right: 20px; top: -20px; font-size: 48px; color: rgba(217, 119, 6, 0.15); font-weight: bold; transform: rotate(-15deg); letter-spacing: 5px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">DIAMOND SOLAR</div>
          <div class="company-subtitle">Powering India's Solar Future</div>
          <div class="company-address">Registered Office: New Delhi, India | CIN: U40106DL2023PTC123456</div>
        </div>

        <div class="letter-title">Approval Letter</div>

        <div class="ref-number">Ref: ${approval.approvalNumber}</div>
        <div class="date">Date: ${formatDate(approval.approvedAt)}</div>

        <div class="content stamp">
          <p>Dear ${approval.application.applicantName},</p>

          <p>We are pleased to inform you that your application for solar installation has been <strong>approved</strong> by Diamond Solar. This letter serves as official confirmation of your approval.</p>

          <table class="details-table">
            <tr><td>Approval Number</td><td>${approval.approvalNumber}</td></tr>
            <tr><td>Applicant Name</td><td>${approval.application.applicantName}</td></tr>
            <tr><td>Property Type</td><td>${approval.application.propertyType.charAt(0).toUpperCase() + approval.application.propertyType.slice(1)}</td></tr>
            <tr><td>Property Address</td><td>${approval.application.propertyAddress}</td></tr>
            <tr><td>Approved By</td><td>${approval.approvedBy}</td></tr>
            <tr><td>Approval Date</td><td>${formatDate(approval.approvedAt)}</td></tr>
            ${approval.validUntil ? `<tr><td>Valid Until</td><td>${formatDate(approval.validUntil)}</td></tr>` : ''}
          </table>

          ${approval.terms ? `
          <p><strong>Terms & Conditions:</strong></p>
          <p>${approval.terms}</p>
          ` : ''}

          ${approval.conditions ? `
          <p><strong>Special Conditions:</strong></p>
          <p>${approval.conditions}</p>
          ` : ''}

          <p>Please keep this letter for your records. Our installation team will contact you shortly to schedule the site visit and begin the installation process.</p>

          <p>If you have any questions, please contact our customer support team.</p>

          <p>Thank you for choosing Diamond Solar.</p>
        </div>

        <div class="signature">
          <div class="signature-line">
            Authorized Signatory<br/>
            Diamond Solar Pvt. Ltd.
          </div>
        </div>

        <div class="footer">
          This is a computer-generated document. No physical signature is required.<br/>
          Diamond Solar Pvt. Ltd. | www.diamondsolar.in | support@diamondsolar.in
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
  if (!isAuthenticated || !user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Page Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200/50">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Approval Letters
                </h1>
                <p className="text-sm text-muted-foreground">
                  View and download your solar installation approval documents
                </p>
              </div>
            </div>
            {approvals.length > 0 && (
              <Badge variant="secondary" className="w-fit bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                {approvals.length} Approved
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-64" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20 rounded-md" />
                      <Skeleton className="h-9 w-20 rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : approvals.length > 0 ? (
          /* Approval Cards */
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-4"
          >
            {approvals.map((approval) => {
              const propertyTypeIcon: Record<string, string> = {
                residential: '🏠',
                commercial: '🏢',
                industrial: '🏭',
                agricultural: '🌾',
              }

              return (
                <motion.div key={approval.id} variants={fadeInUp}>
                  <Card className="border-primary/10 overflow-hidden transition-shadow hover:shadow-md">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Left colored bar */}
                        <div className="flex sm:flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-2.5 sm:p-6 text-white sm:min-w-[120px]">
                          <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
                        </div>

                        {/* Main content */}
                        <div className="flex-1 p-3 sm:p-6">
                          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base sm:text-lg font-bold text-foreground">
                                  {approval.application.applicantName}
                                </h3>
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                  Approved
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                                <span className="text-sm">
                                  {propertyTypeIcon[approval.application.propertyType] || '🏠'}
                                </span>
                                <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                                  {approval.application.propertyType} Property
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {approval.application.propertyAddress}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
                                <div className="rounded-lg bg-amber-50 p-2 sm:p-2.5 border border-amber-100">
                                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-600 font-medium">Approval No.</p>
                                  <p className="text-xs sm:text-sm font-bold text-amber-900 mt-0.5">{approval.approvalNumber}</p>
                                </div>
                                <div className="rounded-lg bg-amber-50 p-2 sm:p-2.5 border border-amber-100">
                                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-600 font-medium">Approved Date</p>
                                  <p className="text-xs sm:text-sm font-bold text-amber-900 mt-0.5">{formatDate(approval.approvedAt)}</p>
                                </div>
                                <div className="rounded-lg bg-amber-50 p-2 sm:p-2.5 border border-amber-100">
                                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-600 font-medium">Approved By</p>
                                  <p className="text-xs sm:text-sm font-bold text-amber-900 mt-0.5">{approval.approvedBy}</p>
                                </div>
                                <div className="rounded-lg bg-amber-50 p-2 sm:p-2.5 border border-amber-100">
                                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-600 font-medium">Valid Until</p>
                                  <p className="text-xs sm:text-sm font-bold text-amber-900 mt-0.5">
                                    {approval.validUntil ? formatDate(approval.validUntil) : 'No Expiry'}
                                  </p>
                                </div>
                              </div>

                              {approval.terms && (
                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-2.5 sm:p-3">
                                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                  <p className="text-xs text-muted-foreground line-clamp-2">{approval.terms}</p>
                                </div>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                                onClick={() => handleViewLetter(approval)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                onClick={() => handleDownloadPDF(approval)}
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          /* Empty State */
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <Card className="border-primary/10">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  {/* Decorative empty state */}
                  <div className="relative mb-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100">
                      <FileCheck className="h-12 w-12 text-amber-400" />
                    </div>
                    <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-200/50">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2">No Approvals Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Your approval letters will appear here once your solar applications are reviewed and approved by our team. This typically takes 2-5 business days.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50">
                      <Link href="/application">
                        <Sun className="h-4 w-4" />
                        Apply for Solar
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
                      <Link href="/dashboard">
                        <ChevronRight className="h-4 w-4" />
                        Go to Dashboard
                      </Link>
                    </Button>
                  </div>

                  {/* How it works */}
                  <div className="mt-10 w-full max-w-lg">
                    <Separator className="bg-amber-200/50 mb-8" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-4">How the approval process works</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { step: 1, title: 'Submit Application', desc: 'Fill out the solar application form', icon: User },
                        { step: 2, title: 'Review Process', desc: 'Our team reviews your application', icon: Building2 },
                        { step: 3, title: 'Get Approved', desc: 'Receive your approval letter', icon: FileCheck },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.step} className="flex flex-col items-center text-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Hidden print content for the dialog */}
        <div ref={printRef} className="hidden" />

        {/* View Approval Letter Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <FileCheck className="h-4 w-4" />
                </div>
                Approval Letter
              </DialogTitle>
              <DialogDescription>
                Official solar installation approval document
              </DialogDescription>
            </DialogHeader>

            {selectedApproval && (
              <div className="rounded-xl border border-amber-200 bg-white">
                {/* Letter Header */}
                <div className="border-b-2 border-amber-500 p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sun className="h-6 w-6 text-amber-600" />
                    <h2 className="text-2xl font-bold text-amber-600 tracking-wide">DIAMOND SOLAR</h2>
                  </div>
                  <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground">
                    Powering India&apos;s Solar Future
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Registered Office: New Delhi, India
                  </p>
                </div>

                {/* Letter Body */}
                <div className="p-6 space-y-4">
                  <div className="text-center border border-amber-300 py-2 px-4 rounded-md">
                    <h3 className="text-sm font-bold uppercase tracking-[2px] text-foreground">Approval Letter</h3>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ref: {selectedApproval.approvalNumber}</span>
                    <span>Date: {formatDate(selectedApproval.approvedAt)}</span>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm">
                      Dear <strong>{selectedApproval.application.applicantName}</strong>,
                    </p>

                    <p className="text-sm mt-3">
                      We are pleased to inform you that your application for solar installation has been{' '}
                      <strong className="text-emerald-700">approved</strong> by Diamond Solar. This letter serves as
                      official confirmation of your approval.
                    </p>

                    {/* Details Table */}
                    <div className="mt-4 overflow-hidden rounded-lg border border-amber-200">
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-amber-100">
                            <td className="bg-amber-50 px-4 py-2.5 font-semibold text-amber-800 w-[40%]">Approval Number</td>
                            <td className="px-4 py-2.5">{selectedApproval.approvalNumber}</td>
                          </tr>
                          <tr className="border-b border-amber-100">
                            <td className="bg-amber-50 px-4 py-2.5 font-semibold text-amber-800">Applicant Name</td>
                            <td className="px-4 py-2.5">{selectedApproval.application.applicantName}</td>
                          </tr>
                          <tr className="border-b border-amber-100">
                            <td className="bg-amber-50 px-4 py-2.5 font-semibold text-amber-800">Property Type</td>
                            <td className="px-4 py-2.5 capitalize">{selectedApproval.application.propertyType}</td>
                          </tr>
                          <tr className="border-b border-amber-100">
                            <td className="bg-amber-50 px-4 py-2.5 font-semibold text-amber-800">Property Address</td>
                            <td className="px-4 py-2.5">{selectedApproval.application.propertyAddress}</td>
                          </tr>
                          <tr className="border-b border-amber-100">
                            <td className="bg-amber-50 px-4 py-2.5 font-semibold text-amber-800">Approved By</td>
                            <td className="px-4 py-2.5">{selectedApproval.approvedBy}</td>
                          </tr>
                          <tr className="border-b border-amber-100">
                            <td className="bg-amber-50 px-4 py-2.5 font-semibold text-amber-800">Approval Date</td>
                            <td className="px-4 py-2.5">{formatDate(selectedApproval.approvedAt)}</td>
                          </tr>
                          {selectedApproval.validUntil && (
                            <tr>
                              <td className="bg-amber-50 px-4 py-2.5 font-semibold text-amber-800">Valid Until</td>
                              <td className="px-4 py-2.5">{formatDate(selectedApproval.validUntil)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {selectedApproval.terms && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-foreground">Terms & Conditions:</p>
                        <p className="text-sm text-muted-foreground mt-1">{selectedApproval.terms}</p>
                      </div>
                    )}

                    {selectedApproval.conditions && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-foreground">Special Conditions:</p>
                        <p className="text-sm text-muted-foreground mt-1">{selectedApproval.conditions}</p>
                      </div>
                    )}

                    <p className="text-sm mt-4">
                      Please keep this letter for your records. Our installation team will contact you shortly
                      to schedule the site visit and begin the installation process.
                    </p>

                    <p className="text-sm mt-2">
                      If you have any questions, please contact our customer support team.
                    </p>

                    <p className="text-sm mt-2">
                      Thank you for choosing Diamond Solar.
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="mt-8 pt-4">
                    <div className="border-t border-foreground/20 w-48 pt-2">
                      <p className="text-xs font-semibold text-foreground">Authorized Signatory</p>
                      <p className="text-xs text-muted-foreground">Diamond Solar Pvt. Ltd.</p>
                    </div>
                  </div>
                </div>

                {/* Letter Footer */}
                <div className="border-t border-amber-200 px-6 py-3">
                  <p className="text-[10px] text-center text-muted-foreground">
                    This is a computer-generated document. No physical signature is required. &bull; Diamond Solar Pvt. Ltd.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                Close
              </Button>
              {selectedApproval && (
                <Button
                  onClick={() => handleDownloadPDF(selectedApproval)}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
