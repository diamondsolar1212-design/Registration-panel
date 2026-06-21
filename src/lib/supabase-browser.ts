import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Browser-side Supabase client (uses anon key, respects RLS, handles sessions)
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey)
