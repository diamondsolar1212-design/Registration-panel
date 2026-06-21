import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-amber-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-amber-900 mb-4">Page Not Found</h2>
        <p className="text-amber-700 mb-8 max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-white font-medium hover:bg-amber-700 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
