'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { safeRedirect } from '@/hooks/use-auth'

import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Building2,
  Zap,
  ClipboardCheck,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sun,
  MapPin,
  CheckCircle2,
  Leaf,
  TrendingUp,
  IndianRupee,
  ChevronRight,
  Info,
  Crosshair,
  Ruler,
  Upload,
  FileText,
  CreditCard,
  Copy,
  ExternalLink,
  AlertCircle,
  Shield,
  Clock,
  QrCode,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Indian states list
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

type AreaUnit = 'sq_ft' | 'sq_yard' | 'sq_meter' | 'acre'

const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  sq_ft: 'Sq Ft',
  sq_yard: 'Sq Yard',
  sq_meter: 'Sq Meter',
  acre: 'Acre',
}

// Conversion factors: 1 unit = X sq ft
const AREA_TO_SQFT: Record<AreaUnit, number> = {
  sq_ft: 1,
  sq_yard: 9,
  sq_meter: 10.7639,
  acre: 43560,
}

function convertToSqFt(value: number, unit: AreaUnit): number {
  return value * AREA_TO_SQFT[unit]
}

interface FormData {
  // Step 1 - Personal
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  applicantAddress: string
  // Step 2 - Property
  propertyType: string
  propertyAddress: string
  propertyState: string
  propertyCity: string
  propertyPincode: string
  landRoofSize: string
  landRoofSizeUnit: AreaUnit
  rooftopArea: string
  rooftopAreaUnit: AreaUnit
  latitude: string
  longitude: string
  // Step 3 - Solar
  connectionType: string
  preferredCapacity: string
  electricityBill: string
  existingConnection: boolean
}

interface CalculationResult {
  recommendedCapacity: number
  estimatedCost: number
  companyInvestment: number
  clientInvestment: number
  annualSavings: number
  clientProfitShare: number
  companyProfitShare: number
  propertyScore: number
  propertyClass: string
  co2Reduction: number
  paybackPeriod: number
  roiPercent: number
  annualGeneration: number
  peakCapacity: number
  monthlySavings?: number
  panelsRequired?: number
  subsidyEligible?: boolean
  estimatedSubsidy?: number
  costPerKw?: number
  marketCostPerKw?: number
  savingPerKw?: number
  registrationFee?: number
}

interface UploadedDoc {
  id: string
  docType: string
  fileName: string
  verified: boolean
}

interface PaymentSettings {
  bank?: Record<string, string>
  qr?: Record<string, string>
  pricing?: Record<string, string>
  general?: Record<string, string>
}

const initialFormData: FormData = {
  applicantName: '',
  applicantEmail: '',
  applicantPhone: '',
  applicantAddress: '',
  propertyType: '',
  propertyAddress: '',
  propertyState: '',
  propertyCity: '',
  propertyPincode: '',
  landRoofSize: '',
  landRoofSizeUnit: 'sq_ft',
  rooftopArea: '',
  rooftopAreaUnit: 'sq_ft',
  latitude: '',
  longitude: '',
  connectionType: '',
  preferredCapacity: '',
  electricityBill: '',
  existingConnection: false,
}

const steps = [
  { number: 1, title: 'Personal Info', icon: User },
  { number: 2, title: 'Property Details', icon: Building2 },
  { number: 3, title: 'Solar Requirements', icon: Zap },
  { number: 4, title: 'Review & Apply', icon: ClipboardCheck },
]

const REQUIRED_DOC_TYPES = [
  { key: 'identity', label: 'Identity Proof', description: 'Aadhaar, PAN, Voter ID, or Passport' },
  { key: 'address_proof', label: 'Address Proof', description: 'Utility bill, Aadhaar, or Bank statement' },
  { key: 'property_ownership', label: 'Property Ownership', description: 'Sale deed, Tax receipt, or Lease agreement' },
  { key: 'electricity_bill', label: 'Electricity Bill', description: 'Latest electricity bill copy' },
]

export default function ApplicationPage() {
  // const router = useRouter() // removed - using safeRedirect for iframe compatibility
  const { user, isAuthenticated, isLoading } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [calculation, setCalculation] = useState<CalculationResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Post-submission states
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [applicationStatus, setApplicationStatus] = useState<string>('draft')
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [paymentMade, setPaymentMade] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({})
  const [registrationFee, setRegistrationFee] = useState(4699)
  const MIN_REGISTRATION_FEE = 4699

  // Document upload states
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null)
  const docFileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Payment form states
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentTransactionId, setPaymentTransactionId] = useState('')
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Final submit state
  const [submittingApplication, setSubmittingApplication] = useState(false)

  // Pre-fill from user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        applicantName: user.name || '',
        applicantEmail: user.email || '',
        applicantPhone: user.phone || '',
      }))
    }
  }, [user])

  // Fetch payment settings and uploaded docs when application is created
  useEffect(() => {
    if (applicationId) {
      fetchPaymentSettings()
      fetchUploadedDocs()
    }
  }, [applicationId])

  // Calculate registration fee based on project cost when calculation is available
  useEffect(() => {
    if (calculation?.estimatedCost) {
      // Use server-calculated registration fee if available
      if (calculation.registrationFee && calculation.registrationFee >= MIN_REGISTRATION_FEE) {
        setRegistrationFee(calculation.registrationFee)
      } else {
        // ~4.7% of client investment (20% of project cost), minimum ₹4,699
        const feePercent = 4.699
        const clientInvestment = calculation.clientInvestment || (calculation.estimatedCost * 0.20)
        const calculatedFee = Math.round(clientInvestment * feePercent / 100)
        const finalFee = Math.max(MIN_REGISTRATION_FEE, calculatedFee)
        const displayFee = Math.ceil(finalFee / 100) * 100 - 1
        setRegistrationFee(Math.max(MIN_REGISTRATION_FEE, displayFee))
      }
    }
  }, [calculation])

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch('/api/settings/public')
      const data = await res.json()
      if (data.settings) {
        setPaymentSettings(data.settings)
        // Registration fee is calculated based on client investment (minimum ₹4,699)
        // Admin can set a custom minimum fee in pricing settings
        if (data.settings.pricing?.registration_fee) {
          const adminFee = parseFloat(data.settings.pricing.registration_fee)
          if (!isNaN(adminFee) && adminFee > 4699) {
            // Only use admin fee if it's higher than the base minimum
            // The actual fee is still calculated from client investment
          }
        }
      }
    } catch {
      // Silently fail - defaults will be used
    }
  }

  const fetchUploadedDocs = async () => {
    if (!applicationId) return
    try {
      const res = await authFetch(`/api/documents?applicationId=${applicationId}`)
      const data = await res.json()
      if (data.documents) {
        setUploadedDocs(data.documents.map((d: { id: string; docType: string; fileName: string; verified: boolean }) => ({
          id: d.id,
          docType: d.docType,
          fileName: d.fileName,
          verified: d.verified,
        })))
        // Check if payment exists
        const paymentRes = await authFetch(`/api/payments?applicationId=${applicationId}`)
        const paymentData = await paymentRes.json()
        if (paymentData.payments && paymentData.payments.length > 0) {
          setPaymentMade(true)
        }
      }
    } catch {
      // Silently fail
    }
  }

  const updateField = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  // Validation per step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.applicantName.trim()) newErrors.applicantName = 'Name is required'
      if (!formData.applicantEmail.trim()) newErrors.applicantEmail = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.applicantEmail)) newErrors.applicantEmail = 'Invalid email format'
      if (!formData.applicantPhone.trim()) newErrors.applicantPhone = 'Phone is required'
      else if (!/^[6-9]\d{9}$/.test(formData.applicantPhone.replace(/\D/g, ''))) newErrors.applicantPhone = 'Enter a valid 10-digit Indian phone number'
    }

    if (step === 2) {
      if (!formData.propertyType) newErrors.propertyType = 'Property type is required'
      if (!formData.propertyAddress.trim()) newErrors.propertyAddress = 'Property address is required'
      if (!formData.propertyState) newErrors.propertyState = 'State is required'
      if (!formData.propertyCity.trim()) newErrors.propertyCity = 'City is required'
      if (!formData.propertyPincode.trim()) newErrors.propertyPincode = 'Pincode is required'
      else if (!/^\d{6}$/.test(formData.propertyPincode)) newErrors.propertyPincode = 'Enter a valid 6-digit pincode'
      if (!formData.landRoofSize || parseFloat(formData.landRoofSize) <= 0) newErrors.landRoofSize = 'Valid roof size is required'
      if (formData.rooftopArea && parseFloat(formData.rooftopArea) <= 0) newErrors.rooftopArea = 'Must be a positive number'
    }

    if (step === 3) {
      if (!formData.connectionType) newErrors.connectionType = 'Connection type is required'
      if (formData.preferredCapacity && parseFloat(formData.preferredCapacity) <= 0) newErrors.preferredCapacity = 'Must be a positive number'
      if (formData.electricityBill && parseFloat(formData.electricityBill) < 0) newErrors.electricityBill = 'Must be a positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before proceeding')
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Live location detection
  const [detectingLocation, setDetectingLocation] = useState(false)

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }))
        setErrors((prev) => {
          const next = { ...prev }
          delete next.latitude
          delete next.longitude
          return next
        })
        toast.success('Location detected successfully!')
        setDetectingLocation(false)
      },
      (error) => {
        let message = 'Failed to detect location'
        if (error.code === 1) message = 'Location permission denied. Please enable it in your browser settings.'
        else if (error.code === 2) message = 'Location unavailable. Please enter manually.'
        else if (error.code === 3) message = 'Location request timed out. Please try again.'
        toast.error(message)
        setDetectingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      // Convert land/roof size to sq ft for calculation
      const landRoofSizeSqFt = convertToSqFt(parseFloat(formData.landRoofSize), formData.landRoofSizeUnit)
      const rooftopAreaSqFt = formData.rooftopArea
        ? convertToSqFt(parseFloat(formData.rooftopArea), formData.rooftopAreaUnit)
        : undefined

      const res = await fetch('/api/applications/auto-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landRoofSize: landRoofSizeSqFt,
          rooftopArea: rooftopAreaSqFt,
          propertyType: formData.propertyType,
          connectionType: formData.connectionType,
          electricityBill: formData.electricityBill || undefined,
          preferredCapacity: formData.preferredCapacity || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Calculation failed')
        return
      }

      setCalculation(data.calculation)
      toast.success('Solar metrics calculated successfully!')
    } catch {
      toast.error('Failed to calculate solar metrics')
    } finally {
      setCalculating(false)
    }
  }

  // Apply Now - Creates application with draft status
  const handleApplyNow = async () => {
    setSubmitting(true)
    try {
      const res = await authFetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          landRoofSize: convertToSqFt(parseFloat(formData.landRoofSize), formData.landRoofSizeUnit),
          landRoofSizeUnit: formData.landRoofSizeUnit,
          rooftopArea: formData.rooftopArea ? convertToSqFt(parseFloat(formData.rooftopArea), formData.rooftopAreaUnit) : undefined,
          rooftopAreaUnit: formData.rooftopAreaUnit,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          preferredCapacity: formData.preferredCapacity ? parseFloat(formData.preferredCapacity) : undefined,
          electricityBill: formData.electricityBill ? parseFloat(formData.electricityBill) : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit application')
        return
      }

      setApplicationId(data.application.id)
      setApplicationStatus('draft')

      // Auto-calculate and show results
      if (data.application.recommendedCapacity) {
        // Build calculation result from the application data
        const app = data.application
        const calcResult = await fetch('/api/applications/auto-calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            landRoofSize: app.landRoofSize,
            rooftopArea: app.rooftopArea,
            propertyType: app.propertyType,
            connectionType: app.connectionType,
            electricityBill: app.electricityBill,
            preferredCapacity: app.preferredCapacity,
          }),
        })
        const calcData = await calcResult.json()
        if (calcData.calculation) {
          setCalculation(calcData.calculation)
        }
      }

      toast.success('Application created successfully!')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Document upload handler
  const handleDocumentUpload = async (docType: string, file: File) => {
    if (!applicationId) return
    setUploadingDocType(docType)

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      setUploadingDocType(null)
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and PDF files are allowed')
      setUploadingDocType(null)
      return
    }

    try {
      const formDataObj = new FormData()
      formDataObj.append('file', file)
      formDataObj.append('docType', docType)
      formDataObj.append('applicationId', applicationId)

      const res = await authFetch('/api/documents', {
        method: 'POST',
        body: formDataObj,
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to upload document')
        return
      }

      setUploadedDocs((prev) => [...prev, {
        id: data.document.id,
        docType: data.document.docType,
        fileName: data.document.fileName,
        verified: data.document.verified,
      }])
      toast.success(`${REQUIRED_DOC_TYPES.find(d => d.key === docType)?.label || docType} uploaded successfully!`)
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setUploadingDocType(null)
    }
  }

  // Payment submit handler
  const handlePaymentSubmit = async () => {
    if (!applicationId) return
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    setSubmittingPayment(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('amount', registrationFee.toString())
      formDataObj.append('paymentType', 'application_fee')
      formDataObj.append('paymentMethod', paymentMethod)
      if (paymentTransactionId) {
        formDataObj.append('transactionId', paymentTransactionId)
      }
      formDataObj.append('applicationId', applicationId)
      if (paymentScreenshot) {
        formDataObj.append('screenshot', paymentScreenshot)
      }

      const res = await authFetch('/api/payments', {
        method: 'POST',
        body: formDataObj,
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit payment')
        return
      }

      setPaymentMade(true)
      toast.success('Payment submitted successfully!')
    } catch {
      toast.error('Failed to submit payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  // Final submit handler - changes status from draft to pending
  const handleFinalSubmit = async () => {
    if (!applicationId) return
    setSubmittingApplication(true)
    try {
      const res = await authFetch(`/api/applications/${applicationId}/submit`, {
        method: 'POST',
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit application')
        return
      }

      setApplicationStatus('pending')
      toast.success('Application submitted for review!')
    } catch {
      toast.error('Failed to submit application')
    } finally {
      setSubmittingApplication(false)
    }
  }

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`)
    }).catch(() => {
      toast.error('Failed to copy')
    })
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  const progressValue = ((currentStep) / 4) * 100

  const propertyClassColors: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    B: 'bg-blue-100 text-blue-800 border-blue-200',
    C: 'bg-amber-100 text-amber-800 border-amber-200',
    D: 'bg-red-100 text-red-800 border-red-200',
  }

  // Check which doc types have been uploaded
  const hasDocType = (docType: string) => uploadedDocs.some(d => d.docType === docType)
  const allDocsUploaded = REQUIRED_DOC_TYPES.every(d => hasDocType(d.key))

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
  if (!isAuthenticated || !user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200/50">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Solar Application
              </h1>
              <p className="text-sm text-muted-foreground">Apply for your solar installation in 4 simple steps</p>
            </div>
          </div>
        </motion.div>

        {/* Step Indicator */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-primary/10 mb-6">
            <CardContent className="p-4 sm:p-6">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Step {currentStep} of 4</span>
                  <span className="text-xs font-medium text-primary">{Math.round(progressValue)}% complete</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>

              {/* Step pills */}
              <div className="grid grid-cols-4 gap-2">
                {steps.map((step) => {
                  const Icon = step.icon
                  const isActive = currentStep === step.number
                  const isCompleted = currentStep > step.number
                  return (
                    <button
                      key={step.number}
                      onClick={() => {
                        if (isCompleted) setCurrentStep(step.number)
                      }}
                      className={`flex flex-col items-center gap-1.5 rounded-xl p-2 sm:p-3 transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-sm'
                          : isCompleted
                          ? 'bg-emerald-50 border border-emerald-100 cursor-pointer hover:bg-emerald-100'
                          : 'bg-muted/30 border border-transparent'
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-medium text-center ${
                        isActive ? 'text-amber-800' : isCompleted ? 'text-emerald-700' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Card className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                      <User className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Provide your contact details for the application</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="applicantName" className="text-amber-900">Full Name *</Label>
                      <Input
                        id="applicantName"
                        placeholder="Enter your full name"
                        value={formData.applicantName}
                        onChange={(e) => updateField('applicantName', e.target.value)}
                        className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.applicantName ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                      />
                      {errors.applicantName && <p className="text-xs text-red-500">{errors.applicantName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="applicantEmail" className="text-amber-900">Email Address *</Label>
                      <Input
                        id="applicantEmail"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.applicantEmail}
                        onChange={(e) => updateField('applicantEmail', e.target.value)}
                        className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.applicantEmail ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                      />
                      {errors.applicantEmail && <p className="text-xs text-red-500">{errors.applicantEmail}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="applicantPhone" className="text-amber-900">Phone Number *</Label>
                      <Input
                        id="applicantPhone"
                        type="tel"
                        placeholder="9876543210"
                        value={formData.applicantPhone}
                        onChange={(e) => updateField('applicantPhone', e.target.value)}
                        className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.applicantPhone ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                      />
                      {errors.applicantPhone && <p className="text-xs text-red-500">{errors.applicantPhone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="applicantAddress" className="text-amber-900">Address</Label>
                      <Input
                        id="applicantAddress"
                        placeholder="Your current address"
                        value={formData.applicantAddress}
                        onChange={(e) => updateField('applicantAddress', e.target.value)}
                        className="border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Property Details */}
            {currentStep === 2 && (
              <Card className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                      <Building2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Property Details</CardTitle>
                      <CardDescription>Tell us about the property where solar will be installed</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-amber-900">Property Type *</Label>
                      <Select value={formData.propertyType} onValueChange={(v) => updateField('propertyType', v)}>
                        <SelectTrigger className={`w-full border-amber-200 focus:ring-amber-400/30 ${errors.propertyType ? 'border-red-400' : ''}`}>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">🏠 Residential</SelectItem>
                          <SelectItem value="commercial">🏢 Commercial</SelectItem>
                          <SelectItem value="industrial">🏭 Industrial</SelectItem>
                          <SelectItem value="agricultural">🌾 Agricultural</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.propertyType && <p className="text-xs text-red-500">{errors.propertyType}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyAddress" className="text-amber-900">Property Address *</Label>
                      <Input
                        id="propertyAddress"
                        placeholder="Full address of the property"
                        value={formData.propertyAddress}
                        onChange={(e) => updateField('propertyAddress', e.target.value)}
                        className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.propertyAddress ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                      />
                      {errors.propertyAddress && <p className="text-xs text-red-500">{errors.propertyAddress}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-amber-900">State *</Label>
                      <Select value={formData.propertyState} onValueChange={(v) => updateField('propertyState', v)}>
                        <SelectTrigger className={`w-full border-amber-200 focus:ring-amber-400/30 ${errors.propertyState ? 'border-red-400' : ''}`}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.propertyState && <p className="text-xs text-red-500">{errors.propertyState}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyCity" className="text-amber-900">City *</Label>
                      <Input
                        id="propertyCity"
                        placeholder="City name"
                        value={formData.propertyCity}
                        onChange={(e) => updateField('propertyCity', e.target.value)}
                        className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.propertyCity ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                      />
                      {errors.propertyCity && <p className="text-xs text-red-500">{errors.propertyCity}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyPincode" className="text-amber-900">Pincode *</Label>
                      <Input
                        id="propertyPincode"
                        placeholder="6-digit pincode"
                        maxLength={6}
                        value={formData.propertyPincode}
                        onChange={(e) => updateField('propertyPincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.propertyPincode ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                      />
                      {errors.propertyPincode && <p className="text-xs text-red-500">{errors.propertyPincode}</p>}
                    </div>
                  </div>

                  <Separator className="bg-amber-200/50" />

                  {/* Land/Roof Size with Unit Selector */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="landRoofSize" className="text-amber-900 flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" />
                        Land/Roof Size *
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="landRoofSize"
                          type="number"
                          min="0"
                          step="any"
                          placeholder="e.g. 1000"
                          value={formData.landRoofSize}
                          onChange={(e) => updateField('landRoofSize', e.target.value)}
                          className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.landRoofSize ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                        />
                        <Select
                          value={formData.landRoofSizeUnit}
                          onValueChange={(v) => updateField('landRoofSizeUnit', v)}
                        >
                          <SelectTrigger className="w-[130px] border-amber-200 focus:ring-amber-400/30 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(AREA_UNIT_LABELS) as [AreaUnit, string][]).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.landRoofSize && <p className="text-xs text-red-500">{errors.landRoofSize}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rooftopArea" className="text-amber-900 flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" />
                        Usable Rooftop Area
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="rooftopArea"
                          type="number"
                          min="0"
                          step="any"
                          placeholder="e.g. 700"
                          value={formData.rooftopArea}
                          onChange={(e) => updateField('rooftopArea', e.target.value)}
                          className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.rooftopArea ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                        />
                        <Select
                          value={formData.rooftopAreaUnit}
                          onValueChange={(v) => updateField('rooftopAreaUnit', v)}
                        >
                          <SelectTrigger className="w-[130px] border-amber-200 focus:ring-amber-400/30 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(AREA_UNIT_LABELS) as [AreaUnit, string][]).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.rooftopArea && <p className="text-xs text-red-500">{errors.rooftopArea}</p>}
                      <p className="text-xs text-muted-foreground">Leave empty to auto-calculate (70% of roof size)</p>
                    </div>
                  </div>

                  {/* Location with Live Detection */}
                  <div className="space-y-3">
                    <Label className="text-amber-900 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Property Location
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="w-full h-10 gap-2 text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                    >
                      {detectingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Detecting Location...
                        </>
                      ) : formData.latitude && formData.longitude ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Location Detected ({formData.latitude}, {formData.longitude})
                        </>
                      ) : (
                        <>
                          <Crosshair className="h-4 w-4" />
                          Use Live Location
                        </>
                      )}
                    </Button>
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200/50">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">
                        Click &quot;Use Live Location&quot; to auto-detect your property&apos;s coordinates using your device GPS.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Solar Requirements */}
            {currentStep === 3 && (
              <Card className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                      <Zap className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Solar Requirements</CardTitle>
                      <CardDescription>Specify your solar energy needs and preferences</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-amber-900">Connection Type *</Label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { value: 'on-grid', label: 'On-Grid', desc: 'Connected to power grid, net metering', icon: '⚡' },
                        { value: 'off-grid', label: 'Off-Grid', desc: 'Independent with battery backup', icon: '🔋' },
                        { value: 'hybrid', label: 'Hybrid', desc: 'Grid + Battery, best of both', icon: '🔄' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('connectionType', option.value)}
                          className={`rounded-xl border-2 p-4 text-left transition-all ${
                            formData.connectionType === option.value
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-amber-200 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{option.icon}</span>
                            <span className="text-sm font-semibold text-foreground">{option.label}</span>
                            {formData.connectionType === option.value && (
                              <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                    {errors.connectionType && <p className="text-xs text-red-500">{errors.connectionType}</p>}
                  </div>

                  <Separator className="bg-amber-200/50" />

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="preferredCapacity" className="text-amber-900">Preferred Capacity (kW)</Label>
                      <Input
                        id="preferredCapacity"
                        type="number"
                        placeholder="e.g. 5"
                        value={formData.preferredCapacity}
                        onChange={(e) => updateField('preferredCapacity', e.target.value)}
                        className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.preferredCapacity ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                      />
                      {errors.preferredCapacity && <p className="text-xs text-red-500">{errors.preferredCapacity}</p>}
                      <p className="text-xs text-muted-foreground">Leave empty for auto-recommendation</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="electricityBill" className="text-amber-900">Monthly Electricity Bill (INR)</Label>
                      <Input
                        id="electricityBill"
                        type="number"
                        placeholder="e.g. 5000"
                        value={formData.electricityBill}
                        onChange={(e) => updateField('electricityBill', e.target.value)}
                        className={`border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30 ${errors.electricityBill ? 'border-red-400 focus-visible:border-red-400' : ''}`}
                      />
                      {errors.electricityBill && <p className="text-xs text-red-500">{errors.electricityBill}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-amber-200 p-4 bg-amber-50/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                        <Zap className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-amber-900">Existing Electricity Connection</Label>
                        <p className="text-xs text-amber-700/70">Do you have an existing grid connection?</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.existingConnection}
                      onCheckedChange={(checked) => updateField('existingConnection', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review & Apply */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Review Data */}
                <Card className="border-primary/10">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                        <ClipboardCheck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle>Review Your Application</CardTitle>
                        <CardDescription>Verify all details before applying</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Personal Info Summary */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">Personal Information</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{formData.applicantName}</span></div>
                        <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{formData.applicantEmail}</span></div>
                        <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{formData.applicantPhone}</span></div>
                        <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{formData.applicantAddress || 'N/A'}</span></div>
                      </div>
                    </div>

                    {/* Property Summary */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">Property Details</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{formData.propertyType}</span></div>
                        <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{formData.propertyAddress}</span></div>
                        <div><span className="text-muted-foreground">City:</span> <span className="font-medium">{formData.propertyCity}</span></div>
                        <div><span className="text-muted-foreground">State:</span> <span className="font-medium">{formData.propertyState}</span></div>
                        <div><span className="text-muted-foreground">Pincode:</span> <span className="font-medium">{formData.propertyPincode}</span></div>
                        <div><span className="text-muted-foreground">Roof Size:</span> <span className="font-medium">{formData.landRoofSize} {AREA_UNIT_LABELS[formData.landRoofSizeUnit]}</span></div>
                        <div><span className="text-muted-foreground">Usable Area:</span> <span className="font-medium">{formData.rooftopArea ? `${formData.rooftopArea} ${AREA_UNIT_LABELS[formData.rooftopAreaUnit]}` : 'Auto (70%)'}</span></div>
                        <div><span className="text-muted-foreground">Coordinates:</span> <span className="font-medium">{formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : 'Not provided'}</span></div>
                      </div>
                    </div>

                    {/* Solar Requirements Summary */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">Solar Requirements</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Connection:</span> <span className="font-medium capitalize">{formData.connectionType?.replace('-', '-')}</span></div>
                        <div><span className="text-muted-foreground">Capacity:</span> <span className="font-medium">{formData.preferredCapacity ? `${formData.preferredCapacity} kW` : 'Auto-recommend'}</span></div>
                        <div><span className="text-muted-foreground">Monthly Bill:</span> <span className="font-medium">{formData.electricityBill ? `₹${parseInt(formData.electricityBill).toLocaleString('en-IN')}` : 'Not provided'}</span></div>
                        <div><span className="text-muted-foreground">Existing Connection:</span> <span className="font-medium">{formData.existingConnection ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>

                    {/* Info notice */}
                    <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 border border-blue-200/50">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700">
                        After applying, you&apos;ll need to upload documents and pay the registration fee before final submission. Solar metrics will be calculated automatically.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons - Only show when no application submitted yet */}
        {!applicationId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-center justify-between"
          >
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1.5">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`h-2 rounded-full transition-all ${
                    step.number === currentStep
                      ? 'w-8 bg-primary'
                      : step.number < currentStep
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleApplyNow}
                disabled={submitting}
                className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-200/50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Application...
                  </>
                ) : (
                  <>
                    Apply Now
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )}

        {/* ==================== POST-SUBMISSION VIEW ==================== */}
        {applicationId && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 space-y-6"
          >
            {/* Application Created Success Card */}
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-emerald-800">Application Created!</h2>
                    <p className="text-sm text-emerald-600">Your application has been saved as a draft.</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-emerald-700 font-mono bg-emerald-100 px-2 py-0.5 rounded">ID: {applicationId}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-emerald-700 mt-4">
                  Complete the steps below to finalize your application. Upload required documents, pay the registration fee, then submit.
                </p>
              </CardContent>
            </Card>

            {/* Step A: Upload Documents */}
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${allDocsUploaded ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <FileText className={`h-5 w-5 ${allDocsUploaded ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Step A: Upload Documents
                        {allDocsUploaded && <Badge className="bg-emerald-500 text-white text-[10px]">COMPLETE</Badge>}
                      </CardTitle>
                      <CardDescription>Upload all required documents for verification</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {REQUIRED_DOC_TYPES.map((doc) => {
                  const isUploaded = hasDocType(doc.key)
                  const uploadedDoc = uploadedDocs.find(d => d.docType === doc.key)
                  return (
                    <div
                      key={doc.key}
                      className={`rounded-xl border-2 p-4 transition-all ${
                        isUploaded
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-amber-200 bg-amber-50/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                            isUploaded ? 'bg-emerald-100' : 'bg-amber-100'
                          }`}>
                            {isUploaded ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Upload className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                            <p className="text-xs text-muted-foreground">{doc.description}</p>
                            {isUploaded && uploadedDoc && (
                              <div className="flex items-center gap-2 mt-1">
                                <FileText className="h-3 w-3 text-emerald-500" />
                                <span className="text-xs text-emerald-700 truncate">{uploadedDoc.fileName}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-300">
                                  Uploaded
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        {!isUploaded && (
                          <div className="shrink-0">
                            <input
                              type="file"
                              ref={(el) => { docFileRefs.current[doc.key] = el }}
                              className="hidden"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleDocumentUpload(doc.key, file)
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                              disabled={uploadingDocType === doc.key}
                              onClick={() => docFileRefs.current[doc.key]?.click()}
                            >
                              {uploadingDocType === doc.key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5" />
                              )}
                              {uploadingDocType === doc.key ? 'Uploading...' : 'Upload'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200/50">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Accepted formats: JPEG, PNG, PDF. Maximum file size: 5MB per document.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step B: Pay Registration Fee */}
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${paymentMade ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <CreditCard className={`h-5 w-5 ${paymentMade ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Step B: Pay Registration Fee
                        {paymentMade && <Badge className="bg-emerald-500 text-white text-[10px]">PAID</Badge>}
                      </CardTitle>
                      <CardDescription>Pay the registration fee to proceed</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-700">₹{registrationFee.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Registration Fee</p>
                    {calculation?.estimatedCost && (
                      <p className="text-[10px] text-amber-600/70">Based on your investment (Min ₹4,699)</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!paymentMade ? (
                  <>
                    {/* Payment Method Selection - Show first */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Select Payment Method
                      </h4>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('upi')}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                            paymentMethod === 'upi'
                              ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100'
                              : 'border-amber-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${paymentMethod === 'upi' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'}`}>
                            <QrCode className="h-5 w-5" />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${paymentMethod === 'upi' ? 'text-amber-900' : 'text-foreground'}`}>UPI</p>
                            <p className="text-xs text-muted-foreground">Pay via UPI / QR Code</p>
                          </div>
                          {paymentMethod === 'upi' && (
                            <CheckCircle2 className="h-5 w-5 text-amber-500 ml-auto shrink-0" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bank_transfer')}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                            paymentMethod === 'bank_transfer'
                              ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-100'
                              : 'border-amber-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${paymentMethod === 'bank_transfer' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'}`}>
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${paymentMethod === 'bank_transfer' ? 'text-amber-900' : 'text-foreground'}`}>Bank Transfer</p>
                            <p className="text-xs text-muted-foreground">Pay via NEFT/RTGS/IMPS</p>
                          </div>
                          {paymentMethod === 'bank_transfer' && (
                            <CheckCircle2 className="h-5 w-5 text-amber-500 ml-auto shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Show payment details based on selected method */}
                    {paymentMethod === 'upi' && (
                      <div className="space-y-4">
                        {/* UPI Details */}
                        {paymentSettings.qr?.upi_id && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <QrCode className="h-4 w-4 text-amber-600" />
                              <h4 className="text-sm font-semibold text-amber-800">UPI Payment Details</h4>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">UPI ID</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground font-mono">{paymentSettings.qr.upi_id}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(paymentSettings.qr!.upi_id, 'UPI ID')}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* QR Code */}
                        {(paymentSettings.qr?.qr_code_url || paymentSettings.qr?.qr_code_path) && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <QrCode className="h-4 w-4 text-amber-600" />
                              <h4 className="text-sm font-semibold text-amber-800">Scan QR Code & Pay</h4>
                            </div>
                            <div className="flex justify-center">
                              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
                                <img
                                  src={paymentSettings.qr.qr_code_url || paymentSettings.qr.qr_code_path}
                                  alt="Payment QR Code"
                                  className="h-48 w-48 object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* No UPI info configured */}
                        {!paymentSettings.qr?.upi_id && !paymentSettings.qr?.qr_code_url && !paymentSettings.qr?.qr_code_path && (
                          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200/50">
                            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">
                              UPI payment details are being configured. Please check back soon or contact support.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'bank_transfer' && (
                      <div className="space-y-4">
                        {/* Bank Details */}
                        {paymentSettings.bank && (paymentSettings.bank.bank_name || paymentSettings.bank.bank_account || paymentSettings.bank.bank_ifsc) && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="h-4 w-4 text-amber-600" />
                              <h4 className="text-sm font-semibold text-amber-800">Bank Account Details</h4>
                            </div>
                            {paymentSettings.bank.bank_name && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Bank Name</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{paymentSettings.bank.bank_name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(paymentSettings.bank!.bank_name, 'Bank name')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            {paymentSettings.bank.bank_account && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Account Number</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground font-mono">{paymentSettings.bank.bank_account}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(paymentSettings.bank!.bank_account, 'Account number')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            {paymentSettings.bank.bank_ifsc && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">IFSC Code</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground font-mono">{paymentSettings.bank.bank_ifsc}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(paymentSettings.bank!.bank_ifsc, 'IFSC code')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            {paymentSettings.bank.bank_holder && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Account Holder</span>
                                <span className="text-sm font-medium text-foreground">{paymentSettings.bank.bank_holder}</span>
                              </div>
                            )}
                            {paymentSettings.bank.bank_branch && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Branch</span>
                                <span className="text-sm font-medium text-foreground">{paymentSettings.bank.bank_branch}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* No bank info configured */}
                        {(!paymentSettings.bank || Object.keys(paymentSettings.bank).length === 0) && (
                          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200/50">
                            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">
                              Bank account details are being configured. Please check back soon or contact support.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* No method selected yet */}
                    {!paymentMethod && (
                      <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 border border-blue-200/50">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700">
                          Please select a payment method above to view the payment details.
                        </p>
                      </div>
                    )}

                    <Separator className="bg-amber-200/50" />

                    {/* Payment Form - Transaction details & screenshot */}
                    {paymentMethod && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Submit Payment Proof
                        </h4>

                        <div className="space-y-2">
                          <Label htmlFor="transactionId" className="text-amber-900">Transaction / Reference ID</Label>
                          <Input
                            id="transactionId"
                            placeholder="Enter transaction ID"
                            value={paymentTransactionId}
                            onChange={(e) => setPaymentTransactionId(e.target.value)}
                            className="border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentScreenshot" className="text-amber-900">Payment Screenshot *</Label>
                          <Input
                            id="paymentScreenshot"
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                            className="border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                          />
                          <p className="text-xs text-muted-foreground">Upload a screenshot of your payment (JPEG, PNG)</p>
                        </div>

                        <Button
                          onClick={handlePaymentSubmit}
                          disabled={submittingPayment}
                          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50 h-11"
                        >
                          {submittingPayment ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Submitting Payment...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" />
                              Submit Payment — ₹{registrationFee.toLocaleString('en-IN')}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Registration Fee Paid</p>
                      <p className="text-xs text-emerald-600">Your payment of ₹{registrationFee.toLocaleString('en-IN')} has been submitted and is pending verification.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step C: Submit Application */}
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${applicationStatus !== 'draft' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <Shield className={`h-5 w-5 ${applicationStatus !== 'draft' ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Step C: Submit Application
                      {applicationStatus !== 'draft' && <Badge className="bg-emerald-500 text-white text-[10px]">SUBMITTED</Badge>}
                    </CardTitle>
                    <CardDescription>Final step to submit your application for review</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Checklist */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-amber-800">Submission Checklist</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm text-foreground">Application Information</span>
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border-0">Complete</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {allDocsUploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <span className="text-sm text-foreground">Documents Uploaded</span>
                      <Badge className={`${allDocsUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} text-[10px] border-0`}>
                        {allDocsUploaded ? 'Complete' : `${uploadedDocs.length}/${REQUIRED_DOC_TYPES.length}`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {paymentMade ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <span className="text-sm text-foreground">Registration Fee Paid</span>
                      <Badge className={`${paymentMade ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} text-[10px] border-0`}>
                        {paymentMade ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {applicationStatus === 'draft' ? (
                  <>
                    {!allDocsUploaded || !paymentMade ? (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200/50">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                          Please complete all checklist items above before submitting your application.
                        </p>
                      </div>
                    ) : null}
                    <Button
                      onClick={handleFinalSubmit}
                      disabled={submittingApplication || !allDocsUploaded || !paymentMade}
                      className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-200/50 h-12 text-base"
                      size="lg"
                    >
                      {submittingApplication ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Submit Application for Review
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Application Submitted Successfully!</p>
                      <p className="text-xs text-emerald-600">Your application is now pending review by our team.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Calculation Results - Show after application is created */}
            {calculation && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/10 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Solar Calculation Results</CardTitle>
                        <CardDescription>Estimated performance and savings for your property</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Cost Breakdown - Hero Section */}
                    <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-5 mb-4">
                      <div className="flex items-center gap-2 mb-4">
                        <IndianRupee className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-base font-bold text-emerald-800">Your Investment & Savings</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-white/80 border border-amber-200 p-3 text-center">
                          <span className="text-xs text-muted-foreground block mb-1">Total Project Cost</span>
                          <p className="text-lg font-bold text-foreground line-through decoration-amber-400">{formatCurrency(calculation.estimatedCost)}</p>
                          <span className="text-[10px] text-amber-600">Market Rate: {formatCurrency(calculation.marketCostPerKw || 0)}/kW</span>
                        </div>
                        <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-3 text-center shadow-lg shadow-emerald-200/50">
                          <span className="text-xs text-emerald-100 block mb-1">Your Investment (20%)</span>
                          <p className="text-2xl font-bold text-white">{formatCurrency(calculation.clientInvestment)}</p>
                          <span className="text-[10px] text-emerald-200">Only 20% of total cost</span>
                        </div>
                        <div className="rounded-lg bg-white/80 border border-blue-200 p-3 text-center">
                          <span className="text-xs text-muted-foreground block mb-1">Company Invests (80%)</span>
                          <p className="text-lg font-bold text-blue-700">{formatCurrency(calculation.companyInvestment)}</p>
                          <span className="text-[10px] text-blue-600">We bear the major cost</span>
                        </div>
                      </div>
                      {calculation.savingPerKw ? (
                        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-100 border border-amber-300 px-3 py-2">
                          <span className="text-sm font-semibold text-amber-800">Save {formatCurrency(calculation.savingPerKw)}/kW vs Market</span>
                          <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5">BEST PRICE</Badge>
                        </div>
                      ) : null}
                    </div>

                    {/* Profit Sharing Section */}
                    <div className="rounded-xl border border-amber-200 bg-white p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                        <h3 className="text-sm font-bold text-amber-800">Profit Sharing (50-50)</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-xs text-emerald-700 block">Your Annual Profit (50%)</span>
                            <p className="text-xl font-bold text-emerald-700">{formatCurrency(calculation.clientProfitShare)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <IndianRupee className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-xs text-blue-700 block">Company Profit (50%)</span>
                            <p className="text-xl font-bold text-blue-700">{formatCurrency(calculation.companyProfitShare)}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">Total Annual Savings: {formatCurrency(calculation.annualSavings)} &mdash; Shared equally between you &amp; company</p>
                    </div>

                    {/* Other Metrics */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      <div className="rounded-xl border border-amber-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-amber-600" />
                          <span className="text-xs text-muted-foreground">System Size</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{calculation.recommendedCapacity} kW</p>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sun className="h-4 w-4 text-amber-600" />
                          <span className="text-xs text-muted-foreground">Generation/yr</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{calculation.annualGeneration.toLocaleString()} kWh</p>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <IndianRupee className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs text-muted-foreground">Payback Period</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-700">{calculation.paybackPeriod} yrs</p>
                        <p className="text-xs text-muted-foreground">On your 20% investment</p>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs text-muted-foreground">ROI</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-700">{calculation.roiPercent}%</p>
                        <p className="text-xs text-muted-foreground">25-year return</p>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-amber-600" />
                          <span className="text-xs text-muted-foreground">Property Score</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{calculation.propertyScore}/100</p>
                        <Progress value={calculation.propertyScore} className="mt-2 h-1.5" />
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardCheck className="h-4 w-4 text-amber-600" />
                          <span className="text-xs text-muted-foreground">Property Class</span>
                        </div>
                        <Badge className={`text-lg px-3 py-1 ${propertyClassColors[calculation.propertyClass] || ''}`}>
                          Class {calculation.propertyClass}
                        </Badge>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Leaf className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs text-muted-foreground">CO₂ Reduction</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-700">{calculation.co2Reduction} t/yr</p>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-amber-600" />
                          <span className="text-xs text-muted-foreground">Govt. Subsidy</span>
                        </div>
                        {calculation.subsidyEligible && calculation.estimatedSubsidy ? (
                          <>
                            <p className="text-xl font-bold text-emerald-700">{formatCurrency(calculation.estimatedSubsidy)}</p>
                            <p className="text-xs text-emerald-600">PM Surya Ghar eligible</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not eligible</p>
                        )}
                      </div>
                    </div>

                    {calculation.panelsRequired && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200/50">
                        <Sun className="h-4 w-4 text-amber-600" />
                        <p className="text-sm text-amber-800">
                          Approximately <span className="font-semibold">{calculation.panelsRequired} solar panels</span> required
                          {calculation.subsidyEligible && (
                            <span className="text-emerald-700"> &bull; Eligible for PM Surya Ghar subsidy!</span>
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Application Status */}
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle>Application Status</CardTitle>
                    <CardDescription>Track the progress of your application</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Application ID</p>
                    <p className="text-sm font-mono font-medium text-foreground">{applicationId}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                    <Badge className={`mt-1 ${
                      applicationStatus === 'draft' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      applicationStatus === 'pending' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      applicationStatus === 'under_review' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      applicationStatus === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      applicationStatus === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {applicationStatus === 'draft' ? '📝 Draft' :
                       applicationStatus === 'pending' ? '⏳ Pending Review' :
                       applicationStatus === 'under_review' ? '🔍 Under Review' :
                       applicationStatus === 'approved' ? '✅ Approved' :
                       applicationStatus === 'rejected' ? '❌ Rejected' :
                       applicationStatus}
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Applied Date</p>
                    <p className="text-sm font-medium text-foreground">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => safeRedirect('/dashboard')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
