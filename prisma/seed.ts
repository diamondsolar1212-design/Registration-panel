// Load .env file manually (since the system DATABASE_URL overrides it)
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [key, ...valueParts] = trimmed.split('=')
  const value = valueParts.join('=')
  if (key && value !== undefined) {
    process.env[key.trim()] = value.trim()
  }
}

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const db = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log('Seeding Supabase database...')
  console.log('URL:', supabaseUrl)

  // Create admin user
  const { data: existingAdmin } = await db
    .from('User')
    .select('id')
    .eq('email', 'admin@diamondsolar.in')
    .single()

  if (!existingAdmin) {
    const { error } = await db
      .from('User')
      .insert({
        name: 'Admin',
        email: 'admin@diamondsolar.in',
        phone: '',
        password: hashPassword('admin123'),
        role: 'admin',
      })

    if (error) {
      console.error('Failed to create admin:', error.message)
    } else {
      console.log('Admin user created: admin@diamondsolar.in')
    }
  } else {
    console.log('Admin user already exists - updating password')
    // Update password to ensure it matches
    await db
      .from('User')
      .update({ password: hashPassword('admin123') })
      .eq('email', 'admin@diamondsolar.in')
  }

  // Create default admin settings
  const defaultSettings = [
    { key: 'bank_name', value: '', category: 'bank' },
    { key: 'bank_account', value: '', category: 'bank' },
    { key: 'bank_ifsc', value: '', category: 'bank' },
    { key: 'bank_branch', value: '', category: 'bank' },
    { key: 'bank_holder', value: '', category: 'bank' },
    { key: 'upi_id', value: '', category: 'qr' },
    { key: 'qr_code_url', value: '', category: 'qr' },
    { key: 'qr_code_path', value: '', category: 'qr' },
    { key: 'price_ongrid', value: '', category: 'pricing' },
    { key: 'price_offgrid', value: '', category: 'pricing' },
    { key: 'price_hybrid', value: '', category: 'pricing' },
    { key: 'application_fee', value: '', category: 'pricing' },
    { key: 'maintenance_fee', value: '', category: 'pricing' },
    { key: 'company_name', value: 'Diamond Solar Energy Pvt. Ltd.', category: 'general' },
    { key: 'company_phone', value: '', category: 'general' },
    { key: 'company_email', value: '', category: 'general' },
    { key: 'company_address', value: '', category: 'general' },
  ]

  for (const setting of defaultSettings) {
    const { error } = await db
      .from('AdminSettings')
      .upsert(setting, { onConflict: 'key' })

    if (error) {
      console.error(`Failed to upsert setting ${setting.key}:`, error.message)
    }
  }
  console.log('Default settings created')

  // Verify
  const { data: admin } = await db.from('User').select('id, email, role').eq('email', 'admin@diamondsolar.in').single()
  console.log('Admin user verified:', admin)

  const { count } = await db.from('AdminSettings').select('*', { count: 'exact', head: true })
  console.log('Settings count:', count)

  console.log('Seeding complete!')
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
