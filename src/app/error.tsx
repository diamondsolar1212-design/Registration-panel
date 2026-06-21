'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6">
      <h2 className="text-2xl font-bold text-amber-600 mb-4">Something went wrong</h2>
      <button
        onClick={reset}
        className="rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
