'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sun, Phone, Mail, MapPin, ArrowRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Apply for Solar', href: '/application' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Support', href: '/support' },
  { label: 'Updates', href: '/updates' },
]

const resources = [
  { label: 'FAQs', href: '/support' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Documents', href: '/documents' },
  { label: 'Payments', href: '/payments' },
  { label: 'Approvals', href: '/approval' },
]

interface GeneralSettings {
  company_name?: string
  company_phone?: string
  company_email?: string
  company_address?: string
}

export function Footer() {
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
        // Silently fail - use empty defaults
      }
    }
    fetchSettings()
  }, [])

  const companyName = general.company_name || 'Diamond Solar'
  const companyPhone = general.company_phone || ''
  const companyEmail = general.company_email || ''
  const companyAddress = general.company_address || ''

  const contactItems = [
    companyPhone ? { icon: Phone, label: companyPhone, href: `tel:${companyPhone.replace(/\s/g, '')}` } : null,
    companyEmail ? { icon: Mail, label: companyEmail, href: `mailto:${companyEmail}` } : null,
    companyAddress ? { icon: MapPin, label: companyAddress, href: '#' } : null,
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; href: string }>

  return (
    <footer className="border-t bg-foreground/[0.03]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors">
                <Sun className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                {companyName.split(' ').length > 1 ? (
                  <>
                    {companyName.split(' ').slice(0, -1).join(' ')} <span className="text-primary">{companyName.split(' ').slice(-1)}</span>
                  </>
                ) : (
                  <span className="text-primary">{companyName}</span>
                )}
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Powering India&apos;s Solar Future. We bring clean, affordable solar
              energy to homes and businesses across India with world-class
              installation and support.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
              <span>Get started today</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5">
              {resources.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact Us
            </h3>
            {contactItems.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {contactItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                        {item.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Contact details coming soon.
              </p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <Separator className="opacity-50" />
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/support" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/support" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
            <Link href="/support" className="transition-colors hover:text-primary">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
