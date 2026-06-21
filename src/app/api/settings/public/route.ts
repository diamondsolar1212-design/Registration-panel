import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch only public-facing settings (bank details, UPI, QR code, pricing, general)
    const { data: settings, error } = await db
      .from('AdminSettings')
      .select('*')
      .in('category', ['bank', 'qr', 'pricing', 'general'])
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    if (error) throw error

    // Group settings by category
    const grouped: Record<string, Record<string, string>> = {}
    for (const setting of settings || []) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {}
      }
      // Return all values as strings - no JSON parsing for public endpoint
      grouped[setting.category][setting.key] = setting.value
    }

    return NextResponse.json({ settings: grouped })
  } catch (error) {
    console.error('Get public settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
