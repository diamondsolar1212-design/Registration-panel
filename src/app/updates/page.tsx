'use client'

import { useState, useEffect } from 'react'

import {
  RefreshCw,
  Newspaper,
  Megaphone,
  Wrench,
  Shield,
  Pin,
  Loader2,
  Calendar,
  Radio,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface CompanyUpdate {
  id: string
  title: string
  content: string
  category: string
  pinned: boolean
  active: boolean
  createdAt: string
}

const categoryConfig: Record<string, { label: string; icon: typeof Newspaper; className: string; bgClass: string }> = {
  news: {
    label: 'News',
    icon: Newspaper,
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    bgClass: 'from-blue-50/50 to-transparent',
  },
  promotion: {
    label: 'Promotion',
    icon: Megaphone,
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    bgClass: 'from-amber-50/50 to-transparent',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    bgClass: 'from-orange-50/50 to-transparent',
  },
  policy: {
    label: 'Policy',
    icon: Shield,
    className: 'bg-purple-100 text-purple-700 border-purple-200',
    bgClass: 'from-purple-50/50 to-transparent',
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function UpdatesPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [updates, setUpdates] = useState<CompanyUpdate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    async function fetchUpdates() {
      try {
        setLoading(true)
        const res = await fetch('/api/company-updates?limit=50')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setUpdates(data.updates || [])
      } catch {
        toast.error('Failed to load updates')
      } finally {
        setLoading(false)
      }
    }

    fetchUpdates()
  }, [isAuthenticated])

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
  if (!isAuthenticated) return null

  const pinnedUpdates = updates.filter((u) => u.pinned)
  const regularUpdates = updates.filter((u) => !u.pinned)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Company Updates
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Latest news, promotions, and announcements from Diamond Solar.
            </p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          </div>
        ) : updates.length === 0 ? (
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <Card className="border-amber-200/50 shadow-sm">
              <CardContent className="py-16">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-4">
                    <Radio className="h-10 w-10 text-amber-400" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No updates yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Check back later for the latest news and announcements.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Updates */}
            {pinnedUpdates.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Pin className="h-4 w-4 text-amber-500" />
                  <h2 className="text-lg font-semibold text-foreground">Pinned</h2>
                </div>
                <div className="space-y-4">
                  {pinnedUpdates.map((update) => {
                    const config = categoryConfig[update.category] || categoryConfig.news
                    const Icon = config.icon
                    return (
                      <motion.div key={update.id} variants={fadeInUp}>
                        <Card className={`border-amber-300/50 shadow-md bg-gradient-to-r ${config.bgClass} relative overflow-hidden`}>
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500" />
                          <CardHeader className="pb-3 pl-6">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={`gap-1 ${config.className}`}>
                                  <Icon className="h-3 w-3" />
                                  {config.label}
                                </Badge>
                                <div className="flex items-center gap-1 text-amber-500">
                                  <Pin className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">Pinned</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Calendar className="h-3 w-3" />
                                {new Date(update.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            </div>
                            <CardTitle className="text-lg mt-2">{update.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="pl-6 pb-4">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                              {update.content}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Regular Updates */}
            {regularUpdates.length > 0 && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { transition: { staggerChildren: 0.08 } },
                }}
              >
                {pinnedUpdates.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <RefreshCw className="h-4 w-4 text-amber-500" />
                    <h2 className="text-lg font-semibold text-foreground">Recent Updates</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {regularUpdates.map((update) => {
                    const config = categoryConfig[update.category] || categoryConfig.news
                    const Icon = config.icon
                    return (
                      <motion.div key={update.id} variants={fadeInUp}>
                        <Card className={`border-amber-200/50 shadow-sm bg-gradient-to-br ${config.bgClass} hover:shadow-md transition-shadow h-full`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <Badge variant="outline" className={`gap-1 ${config.className}`}>
                                <Icon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Calendar className="h-3 w-3" />
                                {new Date(update.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            </div>
                            <CardTitle className="text-base mt-2">{update.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                              {update.content}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
