'use client'

import { useState, useEffect } from 'react'
import {
  Headphones,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Loader2,
  MessageSquare,
  Sun,
  Zap,
  Shield,
  IndianRupee,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

interface GeneralSettings {
  company_name?: string
  company_phone?: string
  company_email?: string
  company_address?: string
}

const faqs = [
  {
    question: 'How much can I save with solar panels?',
    answer:
      'Most solar customers save 70–90% on their electricity bills. A typical 3–5 kW residential system can reduce monthly bills significantly. With net metering, you can even earn credits for excess energy exported to the grid, further maximizing your savings.',
  },
  {
    question: 'What government subsidies are available for solar installation?',
    answer:
      'Under the PM Surya Ghar Yojana, you can receive subsidies depending on system capacity. Additional state-level subsidies may also apply. Our team handles all the paperwork and subsidy applications for you, ensuring you get the maximum benefit available.',
  },
  {
    question: 'How long does installation take and what does it involve?',
    answer:
      'A standard residential installation takes 2–3 days. The full process from application to commissioning takes about 2–4 weeks, including site assessment, design, approvals, and grid connection. Our certified technicians handle everything with minimal disruption to your daily routine.',
  },
  {
    question: 'What warranty and after-sales support do you provide?',
    answer:
      'We offer a 25-year performance warranty on solar panels, 10-year warranty on inverters, and 5-year warranty on batteries. Our after-sales support includes annual maintenance contracts, free system monitoring through our portal, and a prompt response guarantee for any issues.',
  },
]

export default function SupportPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [general, setGeneral] = useState<GeneralSettings>({})

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/public')
        if (!res.ok) return
        const data = await res.json()
        if (data.settings?.general) {
          setGeneral(data.settings.general)
        }
      } catch {
        // Silently fail
      }
    }
    fetchSettings()
  }, [])

  const companyPhone = general.company_phone || ''
  const companyEmail = general.company_email || ''
  const companyAddress = general.company_address || ''

  const contactInfo = [
    companyPhone ? {
      icon: Phone,
      label: 'Phone',
      value: companyPhone,
      description: 'Mon–Sat, 9 AM – 7 PM IST',
      href: `tel:${companyPhone.replace(/\s/g, '')}`,
    } : null,
    companyEmail ? {
      icon: Mail,
      label: 'Email',
      value: companyEmail,
      description: 'We reply within 24 hours',
      href: `mailto:${companyEmail}`,
    } : null,
    companyAddress ? {
      icon: MapPin,
      label: 'Address',
      value: companyAddress,
      description: 'Visit us for in-person support',
      href: '#',
    } : null,
    {
      icon: Clock,
      label: 'Working Hours',
      value: 'Mon–Sat: 9 AM – 7 PM',
      description: 'Sunday: Closed',
      href: '#',
    },
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; value: string; description: string; href: string }>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !subject || !message) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSubmitting(false)

    toast.success('Message sent successfully! We\'ll get back to you within 24 hours.')
    setName('')
    setEmail('')
    setSubject('')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Support & Contact
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              Need help? We&apos;re here for you. Reach out through any channel and our team will assist you.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Contact Form */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="lg:col-span-3"
          >
            <Card className="border-amber-200/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Send us a Message</CardTitle>
                    <CardDescription>Fill out the form and we&apos;ll respond promptly</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="support-name" className="text-amber-900">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="support-name"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="support-email" className="text-amber-900">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="support-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-subject" className="text-amber-900">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="support-subject"
                      placeholder="What do you need help with?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-message" className="text-amber-900">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="support-message"
                      placeholder="Describe your question or issue in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[140px] border-amber-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="border-amber-200/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                    <Headphones className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Contact Info</CardTitle>
                    <CardDescription>Reach us directly</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  return (
                    <div key={index}>
                      <a
                        href={info.href}
                        className="flex items-start gap-3 group rounded-lg p-2 -m-2 transition-colors hover:bg-amber-50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors flex-shrink-0">
                          <Icon className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-amber-700/70 uppercase tracking-wider">
                            {info.label}
                          </p>
                          <p className="text-sm font-medium text-foreground mt-0.5">
                            {info.value}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {info.description}
                          </p>
                        </div>
                      </a>
                      {index < contactInfo.length - 1 && (
                        <Separator className="mt-4 bg-amber-100/50" />
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mt-12"
        >
          <Card className="border-amber-200/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
                  <HelpCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => {
                  const icons = [Sun, IndianRupee, Zap, Shield]
                  const FaqIcon = icons[index % icons.length]
                  return (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:text-amber-600 hover:no-underline sm:text-base">
                        <div className="flex items-center gap-3">
                          <FaqIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          {faq.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground pl-7">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
