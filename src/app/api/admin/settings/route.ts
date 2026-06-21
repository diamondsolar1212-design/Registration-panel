import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: settings, error } = await db
      .from('AdminSettings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    if (error) throw error

    // Group settings by category
    const grouped: Record<string, Record<string, unknown>> = {}
    for (const setting of settings || []) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {}
      }
      try {
        grouped[setting.category][setting.key] = JSON.parse(setting.value)
      } catch {
        grouped[setting.category][setting.key] = setting.value
      }
    }

    return NextResponse.json({ settings: grouped })
  } catch (error) {
    console.error('Get admin settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { settings } = body as {
      settings: Array<{
        key: string
        value: unknown
        category: string
      }>
    }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings array is required' },
        { status: 400 }
      )
    }

    // Upsert each setting
    for (const setting of settings) {
      if (!setting.key || !setting.category) {
        continue
      }

      const valueStr = typeof setting.value === 'string'
        ? setting.value
        : JSON.stringify(setting.value)

      const { error: upsertError } = await db
        .from('AdminSettings')
        .upsert(
          {
            key: setting.key,
            value: valueStr,
            category: setting.category,
          },
          { onConflict: 'key' }
        )

      if (upsertError) {
        console.error('Upsert setting error:', upsertError)
      }
    }

    // Return updated settings
    const { data: updatedSettings, error: fetchError } = await db
      .from('AdminSettings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    if (fetchError) throw fetchError

    const grouped: Record<string, Record<string, unknown>> = {}
    for (const setting of updatedSettings || []) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {}
      }
      try {
        grouped[setting.category][setting.key] = JSON.parse(setting.value)
      } catch {
        grouped[setting.category][setting.key] = setting.value
      }
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: grouped,
    })
  } catch (error) {
    console.error('Update admin settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
