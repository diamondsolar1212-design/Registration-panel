'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (isInstalled || !showPrompt) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200">Install Diamond Solar</p>
            <p className="text-xs text-slate-400 mt-0.5">Install for quick access & offline support</p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="shrink-0 p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => setShowPrompt(false)}
            variant="ghost"
            size="sm"
            className="flex-1 text-slate-400 hover:text-slate-200"
          >
            Later
          </Button>
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  )
}
