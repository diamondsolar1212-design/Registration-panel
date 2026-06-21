'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  Loader2,
  Save,
  Landmark,
  IndianRupee,
  QrCode,
  Building2,
  CheckCircle2,
  Upload,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { authFetch } from '@/lib/auth-fetch'

type SettingsMap = Record<string, Record<string, unknown>>

export default function AdminSettingsPage() {
  const { user } = useAuthStore()
  const [settings, setSettings] = useState<SettingsMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null) // category being saved
  const [activeTab, setActiveTab] = useState('bank')
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [uploadingQr, setUploadingQr] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [user?.id])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await authFetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSettings(data.settings || {})
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const getSetting = (category: string, key: string, fallback: string = ''): string => {
    const val = settings[category]?.[key]
    if (val === undefined || val === null) return fallback
    return String(val)
  }

  const updateSetting = (category: string, key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [key]: value,
      },
    }))
  }

  const saveCategory = async (category: string, keys: Array<{ key: string; label: string }>) => {
    try {
      setSaving(category)
      const settingEntries = keys.map(({ key }) => ({
        key,
        value: getSetting(category, key),
        category,
      }))

      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingEntries }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      setSettings(data.settings || {})
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved`)
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(null)
    }
  }

  const handleQrUpload = async () => {
    if (!qrFile) return
    try {
      setUploadingQr(true)
      const formData = new FormData()
      formData.append('qr', qrFile)

      const res = await authFetch('/api/admin/settings/upload-qr', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to upload QR code')
      const data = await res.json()

      // Update the settings with the new QR URL
      setSettings((prev) => ({
        ...prev,
        qr: {
          ...(prev.qr || {}),
          qr_code_url: data.qrUrl,
        },
      }))

      setQrFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success('QR code uploaded successfully')
    } catch {
      toast.error('Failed to upload QR code')
    } finally {
      setUploadingQr(false)
    }
  }

  const removeQrCode = async () => {
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: [{ key: 'qr_code_url', value: '', category: 'qr' }] }),
      })
      if (!res.ok) throw new Error('Failed to remove QR')
      const data = await res.json()
      setSettings(data.settings || {})
      toast.success('QR code removed')
    } catch {
      toast.error('Failed to remove QR code')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    )
  }

  const bankFields = [
    { key: 'bank_name', label: 'Bank Name' },
    { key: 'bank_account', label: 'Account Number' },
    { key: 'bank_ifsc', label: 'IFSC Code' },
    { key: 'bank_branch', label: 'Branch' },
    { key: 'bank_holder', label: 'Account Holder Name' },
  ]

  const pricingFields = [
    { key: 'application_fee', label: 'Application Fee (₹)', type: 'number' },
    { key: 'price_ongrid', label: 'Cost per kW - On-Grid (₹)', type: 'number' },
    { key: 'price_offgrid', label: 'Cost per kW - Off-Grid (₹)', type: 'number' },
    { key: 'price_hybrid', label: 'Cost per kW - Hybrid (₹)', type: 'number' },
    { key: 'maintenance_fee', label: 'Maintenance Fee (₹)', type: 'number' },
  ]

  const qrFields = [
    { key: 'upi_id', label: 'UPI ID' },
  ]

  const generalFields = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'company_phone', label: 'Phone' },
    { key: 'company_email', label: 'Email' },
    { key: 'company_address', label: 'Address' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage application configuration and business settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800 h-auto p-1">
          <TabsTrigger
            value="bank"
            className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 text-slate-400 px-4 py-2"
          >
            <Landmark className="w-4 h-4 mr-2" />
            Bank Details
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 text-slate-400 px-4 py-2"
          >
            <IndianRupee className="w-4 h-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger
            value="qr"
            className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 text-slate-400 px-4 py-2"
          >
            <QrCode className="w-4 h-4 mr-2" />
            QR Code & UPI
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 text-slate-400 px-4 py-2"
          >
            <Building2 className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
        </TabsList>

        {/* Bank Details */}
        <TabsContent value="bank" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-400" />
                Bank Account Details
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                These details will be shown to users for payment reference. Users will transfer money to this bank account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bankFields.map((field) => (
                <div key={field.key}>
                  <Label className="text-slate-300 text-sm">{field.label}</Label>
                  <Input
                    value={getSetting('bank', field.key)}
                    onChange={(e) => updateSetting('bank', field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1"
                  />
                </div>
              ))}
              <Separator className="bg-slate-800" />
              <Button
                onClick={() => saveCategory('bank', bankFields)}
                disabled={saving === 'bank'}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {saving === 'bank' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Bank Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                Pricing Configuration
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Set pricing for solar installations and fees. These values are used in the solar calculator and application form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingFields.map((field) => (
                <div key={field.key}>
                  <Label className="text-slate-300 text-sm">{field.label}</Label>
                  <Input
                    type="number"
                    value={getSetting('pricing', field.key)}
                    onChange={(e) => updateSetting('pricing', field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1"
                  />
                </div>
              ))}
              <Separator className="bg-slate-800" />
              <Button
                onClick={() => saveCategory('pricing', pricingFields)}
                disabled={saving === 'pricing'}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {saving === 'pricing' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Pricing
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Code & UPI */}
        <TabsContent value="qr" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                Payment QR Code & UPI
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Upload QR code image and set UPI ID. Users will scan this QR code or use the UPI ID to make payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* UPI ID */}
              {qrFields.map((field) => (
                <div key={field.key}>
                  <Label className="text-slate-300 text-sm">{field.label}</Label>
                  <Input
                    value={getSetting('qr', field.key)}
                    onChange={(e) => updateSetting('qr', field.key, e.target.value)}
                    placeholder="e.g., diamondsolar@sbi"
                    className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1"
                  />
                </div>
              ))}

              {/* QR Code Upload */}
              <div>
                <Label className="text-slate-300 text-sm">Upload QR Code Image</Label>
                <div className="mt-1 flex items-center gap-3">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                    className="bg-slate-800/50 border-slate-700 text-slate-200 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30"
                  />
                  <Button
                    onClick={handleQrUpload}
                    disabled={!qrFile || uploadingQr}
                    className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                  >
                    {uploadingQr ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    Upload
                  </Button>
                </div>
                {qrFile && (
                  <p className="text-xs text-amber-400 mt-1">Selected: {qrFile.name}</p>
                )}
              </div>

              {/* QR Preview */}
              {getSetting('qr', 'qr_code_url') && (
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 text-center">
                  <p className="text-xs text-slate-500 mb-2">Current QR Code:</p>
                  <div className="relative inline-block">
                    <img
                      src={getSetting('qr', 'qr_code_url')}
                      alt="Payment QR Code"
                      className="w-48 h-48 mx-auto rounded-lg bg-white p-2"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      onClick={removeQrCode}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <Separator className="bg-slate-800" />
              <Button
                onClick={() => saveCategory('qr', qrFields)}
                disabled={saving === 'qr'}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {saving === 'qr' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save UPI Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General */}
        <TabsContent value="general" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                General Settings
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Company information and contact details. These will be shown in the footer and other public areas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generalFields.map((field) => (
                <div key={field.key}>
                  <Label className="text-slate-300 text-sm">{field.label}</Label>
                  <Input
                    value={getSetting('general', field.key)}
                    onChange={(e) => updateSetting('general', field.key, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="bg-slate-800/50 border-slate-700 text-slate-200 mt-1"
                  />
                </div>
              ))}

              {/* Current values display */}
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">Current Configuration</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Company:</span>
                    <span className="ml-1 text-slate-300">{getSetting('general', 'company_name', 'Diamond Solar')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <span className="ml-1 text-slate-300">{getSetting('general', 'company_email', 'Not set')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone:</span>
                    <span className="ml-1 text-slate-300">{getSetting('general', 'company_phone', 'Not set')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Address:</span>
                    <span className="ml-1 text-slate-300">{getSetting('general', 'company_address', 'Not set')}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-800" />
              <Button
                onClick={() => saveCategory('general', generalFields)}
                disabled={saving === 'general'}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {saving === 'general' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
