'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  CreditCard,
  IndianRupee,
  Clock,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Wallet,
  CalendarClock,
  Landmark,
  QrCode,
  Copy,
  Check,
  Building2,
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
import { Separator } from '@/components/ui/separator'
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

interface Payment {
  id: string
  amount: number
  paymentType: string
  paymentMethod: string
  transactionId: string | null
  screenshotPath: string | null
  status: string
  createdAt: string
  application?: {
    id: string
    applicantName: string
  } | null
}

interface PaymentSettings {
  bank?: {
    bank_name?: string
    bank_account?: string
    bank_ifsc?: string
    bank_branch?: string
    bank_holder?: string
    upi_id?: string
  }
  qr?: {
    qr_code_url?: string
    upi_id?: string
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const paymentTypeLabels: Record<string, string> = {
  application_fee: 'Application Fee',
  installation_fee: 'Installation Fee',
  maintenance_fee: 'Maintenance Fee',
}

const paymentMethodLabels: Record<string, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
}

export default function PaymentsPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)

  // View screenshot dialog
  const [viewScreenshot, setViewScreenshot] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const res = await authFetch('/api/payments')
      if (!res.ok) throw new Error('Failed to fetch payments')
      const data = await res.json()
      setPayments(data.payments || [])
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchPaymentSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/public')
      if (!res.ok) return
      const data = await res.json()
      setPaymentSettings(data.settings || {})
    } catch {
      // Silently fail - payment settings are optional
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchPayments()
    fetchPaymentSettings()
  }, [isAuthenticated, fetchPayments, fetchPaymentSettings])

  const totalPaid = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)
  const nextPending = payments.find((p) => p.status === 'pending')

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  // Get UPI ID from either bank or qr category
  const upiId = paymentSettings.bank?.upi_id || paymentSettings.qr?.upi_id || ''
  const qrCodeUrl = paymentSettings.qr?.qr_code_url || ''
  const hasBankDetails = paymentSettings.bank?.bank_name || paymentSettings.bank?.bank_account
  const hasPaymentInfo = hasBankDetails || upiId || qrCodeUrl

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!amount || !paymentType || !paymentMethod) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('amount', amount)
      formData.append('paymentType', paymentType)
      formData.append('paymentMethod', paymentMethod)
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      const res = await authFetch('/api/payments', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit payment')
        return
      }

      toast.success('Payment submitted successfully! It will be verified shortly.')
      setAmount('')
      setPaymentType('')
      setPaymentMethod('')
      setScreenshot(null)
      fetchPayments()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
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
                Payments
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your payments, view history, and submit new payments.
            </p>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          <motion.div variants={fadeInUp}>
            <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200/50">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-amber-700/70">Total Paid</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-amber-700/70">Pending Payments</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      ₹{pendingAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-200/50">
                    <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-amber-700/70">Next Due</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {nextPending ? `₹${nextPending.amount.toLocaleString('en-IN')}` : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Payment Details Section - Show details based on selected payment method */}
        {hasPaymentInfo && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-8"
          >
            <Card className="border-amber-200/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                    <Landmark className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                    <CardDescription>Select a payment method in the form below to view relevant details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!paymentMethod ? (
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                      Please select a payment method in the form below to view the relevant payment details.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Bank Details - Show when Bank Transfer is selected */}
                    {paymentMethod === 'bank_transfer' && hasBankDetails && (
                      <div className="space-y-3 md:col-span-2 lg:col-span-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                          <Building2 className="h-4 w-4" />
                          Bank Transfer Details
                        </div>
                        <div className="space-y-2 rounded-lg bg-amber-50/50 border border-amber-100 p-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {paymentSettings.bank?.bank_name && (
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs text-amber-600/70">Bank Name</p>
                                  <p className="text-sm font-medium text-foreground">{paymentSettings.bank.bank_name}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-amber-500 hover:text-amber-700"
                                  onClick={() => copyToClipboard(paymentSettings.bank!.bank_name!, 'bank_name')}
                                >
                                  {copiedField === 'bank_name' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            )}
                            {paymentSettings.bank?.bank_holder && (
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs text-amber-600/70">Account Holder</p>
                                  <p className="text-sm font-medium text-foreground">{paymentSettings.bank.bank_holder}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-amber-500 hover:text-amber-700"
                                  onClick={() => copyToClipboard(paymentSettings.bank!.bank_holder!, 'bank_holder')}
                                >
                                  {copiedField === 'bank_holder' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            )}
                            {paymentSettings.bank?.bank_account && (
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs text-amber-600/70">Account Number</p>
                                  <p className="text-sm font-medium font-mono text-foreground">{paymentSettings.bank.bank_account}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-amber-500 hover:text-amber-700"
                                  onClick={() => copyToClipboard(paymentSettings.bank!.bank_account!, 'bank_account')}
                                >
                                  {copiedField === 'bank_account' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            )}
                            {paymentSettings.bank?.bank_ifsc && (
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs text-amber-600/70">IFSC Code</p>
                                  <p className="text-sm font-medium font-mono text-foreground">{paymentSettings.bank.bank_ifsc}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-amber-500 hover:text-amber-700"
                                  onClick={() => copyToClipboard(paymentSettings.bank!.bank_ifsc!, 'bank_ifsc')}
                                >
                                  {copiedField === 'bank_ifsc' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            )}
                            {paymentSettings.bank?.bank_branch && (
                              <div>
                                <p className="text-xs text-amber-600/70">Branch</p>
                                <p className="text-sm font-medium text-foreground">{paymentSettings.bank.bank_branch}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI Details - Show when UPI is selected */}
                    {paymentMethod === 'upi' && upiId && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                          <CreditCard className="h-4 w-4" />
                          UPI Payment
                        </div>
                        <div className="space-y-3 rounded-lg bg-amber-50/50 border border-amber-100 p-4">
                          <div>
                            <p className="text-xs text-amber-600/70">UPI ID</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm font-medium font-mono text-foreground flex-1">{upiId}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-amber-500 hover:text-amber-700"
                                onClick={() => copyToClipboard(upiId, 'upi_id')}
                              >
                                {copiedField === 'upi_id' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Open any UPI app (Google Pay, PhonePe, Paytm) and pay to this UPI ID
                          </p>
                        </div>
                      </div>
                    )}

                    {/* QR Code - Show when UPI is selected */}
                    {paymentMethod === 'upi' && qrCodeUrl && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                          <QrCode className="h-4 w-4" />
                          Scan & Pay
                        </div>
                        <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-4 text-center">
                          <img
                            src={qrCodeUrl}
                            alt="Payment QR Code"
                            className="w-48 h-48 mx-auto rounded-lg bg-white p-2 border border-amber-100"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Scan this QR code with any UPI app to pay
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                      After making the payment, please submit the payment details and upload a screenshot of the transaction as proof below.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No Payment Info Available */}
        {!hasPaymentInfo && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mb-8"
          >
            <Card className="border-amber-200/50 shadow-sm">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Payment details are not configured yet. Please contact admin or check back later.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Make Payment Form */}
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
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Make Payment</CardTitle>
                    <CardDescription>Submit a new payment</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-amber-900">
                      Amount (₹) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-amber-900">
                      Payment Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
                      <SelectTrigger className="w-full border-amber-200 focus:border-amber-400">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="application_fee">Application Fee</SelectItem>
                        <SelectItem value="installation_fee">Installation Fee</SelectItem>
                        <SelectItem value="maintenance_fee">Maintenance Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-amber-900">
                      Payment Method <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all text-sm ${
                          paymentMethod === 'upi'
                            ? 'border-amber-500 bg-amber-50 font-semibold text-amber-900'
                            : 'border-amber-200 bg-white hover:border-amber-300'
                        }`}
                      >
                        <QrCode className="h-4 w-4 shrink-0" />
                        UPI
                        {paymentMethod === 'upi' && <CheckCircle2 className="h-4 w-4 text-amber-500 ml-auto" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all text-sm ${
                          paymentMethod === 'bank_transfer'
                            ? 'border-amber-500 bg-amber-50 font-semibold text-amber-900'
                            : 'border-amber-200 bg-white hover:border-amber-300'
                        }`}
                      >
                        <Building2 className="h-4 w-4 shrink-0" />
                        Bank Transfer
                        {paymentMethod === 'bank_transfer' && <CheckCircle2 className="h-4 w-4 text-amber-500 ml-auto" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="screenshot" className="text-amber-900">
                      Payment Proof (Screenshot)
                    </Label>
                    <div className="relative">
                      <Input
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                        className="border-amber-200 focus-visible:border-amber-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                      />
                    </div>
                    {screenshot && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        {screenshot.name}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Submit Payment
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment History */}
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
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Payment History</CardTitle>
                    <CardDescription>Track all your payments</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
                      <CreditCard className="h-8 w-8 text-amber-400" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">No payments yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Your payment history will appear here
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-3 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-amber-50 [&::-webkit-scrollbar-thumb]:bg-amber-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {payments.map((payment) => {
                        const status = statusConfig[payment.status] || statusConfig.pending
                        const StatusIcon = status.icon
                        return (
                          <div key={payment.id} className="mobile-touch-card rounded-xl border border-amber-100 bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-lg text-foreground">
                                ₹{payment.amount.toLocaleString('en-IN')}
                              </p>
                              <Badge variant="outline" className={`gap-1 ${status.className}`}>
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                              </span>
                              <span className="text-muted-foreground">
                                {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground/70">
                                {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              {payment.screenshotPath && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => setViewScreenshot(payment.screenshotPath)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              )}
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
                            <TableHead className="text-amber-800">Date</TableHead>
                            <TableHead className="text-amber-800">Amount</TableHead>
                            <TableHead className="text-amber-800">Type</TableHead>
                            <TableHead className="text-amber-800">Method</TableHead>
                            <TableHead className="text-amber-800">Status</TableHead>
                            <TableHead className="text-amber-800">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => {
                            const status = statusConfig[payment.status] || statusConfig.pending
                            const StatusIcon = status.icon
                            return (
                              <TableRow key={payment.id} className="border-amber-50">
                                <TableCell className="text-sm">
                                  {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  ₹{payment.amount.toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {paymentTypeLabels[payment.paymentType] || payment.paymentType}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`gap-1 ${status.className}`}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    {status.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {payment.screenshotPath && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => setViewScreenshot(payment.screenshotPath)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                  )}
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

        {/* Screenshot Dialog */}
        <Dialog open={!!viewScreenshot} onOpenChange={() => setViewScreenshot(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
              <DialogDescription>Screenshot uploaded as payment proof</DialogDescription>
            </DialogHeader>
            {viewScreenshot && (
              <div className="rounded-lg overflow-hidden border border-amber-200">
                <img
                  src={viewScreenshot}
                  alt="Payment proof"
                  className="w-full h-auto"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
