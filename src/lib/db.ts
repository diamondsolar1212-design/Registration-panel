import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

/**
 * Load .env file manually if Supabase env vars are missing.
 * The container's /start.sh may overwrite .env with only DATABASE_URL,
 * wiping Supabase credentials. This reads .env.supabase-backup as fallback.
 */
function loadEnvFallback() {
  const envPath = resolve(process.cwd(), '.env')
  const backupPath = resolve(process.cwd(), '.env.supabase-backup')
  
  // If Supabase vars are already present, nothing to do
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return
  
  // Try loading from .env first
  const pathsToTry = [envPath, backupPath]
  for (const p of pathsToTry) {
    if (!existsSync(p)) continue
    try {
      const content = readFileSync(p, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=')
        if (key && value !== undefined) {
          const k = key.trim()
          // Only set if not already set
          if (!process.env[k]) {
            process.env[k] = value.trim()
          }
        }
      }
      // Check if we got the Supabase vars now
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return
    } catch {
      // Continue to next path
    }
  }
}

loadEnvFallback()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Diagnostic: Log if service key is missing (helps debug RLS issues)
if (!supabaseServiceKey) {
  console.error('[DB] WARNING: SUPABASE_SERVICE_ROLE_KEY is empty! RLS policies will block writes.')
  console.error('[DB] Ensure .env file contains SUPABASE_SERVICE_ROLE_KEY')
}

if (!supabaseUrl) {
  console.error('[DB] WARNING: NEXT_PUBLIC_SUPABASE_URL is empty!')
}

// Singleton Supabase client with service role (server-side only)
const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient | undefined
}

// Always use singleton - even in production - to avoid creating multiple clients
// and to ensure the client is created once with the correct env vars
export const db = globalForSupabase.supabase ??
  createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

// Always set the singleton (not just in dev) to prevent re-creation
globalForSupabase.supabase = db

// Helper type for Supabase table names
export type TableName =
  | 'User'
  | 'Application'
  | 'Document'
  | 'Payment'
  | 'Approval'
  | 'ApprovalLetterVersion'
  | 'ApprovalHistory'
  | 'ApplicationCalculation'
  | 'CompanyUpdate'
  | 'Notification'
  | 'AdminSettings'
