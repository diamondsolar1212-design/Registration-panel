import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

const KEY_LENGTH = 64

/**
 * Hash a password using scrypt (memory-hard, brute-force resistant)
 * Returns `salt:hash` format for storage
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored hash
 * Supports both:
 * - New scrypt format: `salt:hash`
 * - Legacy SHA-256 format: `hexhash` (for migration)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  // Check if this is the new scrypt format (contains a colon separator)
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':')
    const derivedHash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derivedHash, 'hex'))
  }

  // Legacy SHA-256 fallback — supports existing users created before the migration
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('crypto')
  const sha256Hash = createHash('sha256').update(password).digest('hex')
  return sha256Hash === storedHash
}

/**
 * Check if a string looks like a UUID (used for user-id token auth)
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Get user from request — supports multiple auth methods:
 * 1. Authorization: Bearer <uuid> (user ID as token — our custom auth)
 * 2. user-id: <id> (header-based auth)
 * 3. Authorization: Bearer <jwt> (Supabase Auth JWT — legacy, best-effort)
 */
export async function getUserFromHeaders(request: Request) {
  const { db } = await import('@/lib/db')

  // Method 1: Authorization Bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)

    // Check if the token is a UUID (our custom user-id token)
    if (isUUID(token)) {
      const { data: user, error } = await db
        .from('User')
        .select('id, name, email, phone, role, createdAt, updatedAt')
        .eq('id', token)
        .single()

      if (!error && user) return user
    }

    // Try as Supabase Auth JWT (best-effort, may fail)
    try {
      const { data: { user: authUser }, error } = await db.auth.getUser(token)
      if (!error && authUser) {
        const { data: user, error: userError } = await db
          .from('User')
          .select('id, name, email, phone, role, createdAt, updatedAt')
          .eq('email', authUser.email!)
          .single()

        if (!userError && user) return user
      }
    } catch {
      // Supabase Auth token verification failed
    }
  }

  // Method 2: user-id header (fallback)
  const userId = request.headers.get('user-id')
  if (userId) {
    const { data: user, error } = await db
      .from('User')
      .select('id, name, email, phone, role, createdAt, updatedAt')
      .eq('id', userId)
      .single()

    if (!error && user) return user
  }

  return null
}

export async function requireAuth(request: Request) {
  const user = await getUserFromHeaders(request)
  if (!user) return null
  return user
}

export async function requireAdmin(request: Request) {
  const user = await getUserFromHeaders(request)
  if (!user || user.role !== 'admin') return null
  return user
}
