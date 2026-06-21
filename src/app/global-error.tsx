'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Something went wrong</h1>
        <p className="text-amber-700 mb-8">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-white font-medium hover:bg-amber-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
