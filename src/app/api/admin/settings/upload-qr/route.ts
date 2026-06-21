import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { uploadToStorage, deleteFromStorage } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const qrFile = formData.get('qr') as File | null

    if (!qrFile) {
      return NextResponse.json({ error: 'QR code image is required' }, { status: 400 })
    }

    // Validate file type
    if (!qrFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (qrFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Delete old QR code from Supabase Storage if it exists
    const { data: existingSetting } = await db
      .from('AdminSettings')
      .select('*')
      .eq('key', 'qr_code_path')
      .single()

    if (existingSetting?.value && existingSetting.value.startsWith('qr/')) {
      try {
        await deleteFromStorage(existingSetting.value)
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Upload to Supabase Storage
    const { url: qrUrl, path: storagePath } = await uploadToStorage(qrFile, qrFile.name, 'qr')

    // Save QR URL and path to admin settings using upsert
    await db
      .from('AdminSettings')
      .upsert(
        { key: 'qr_code_url', value: qrUrl, category: 'qr' },
        { onConflict: 'key' }
      )

    // Save storage path for future deletion
    await db
      .from('AdminSettings')
      .upsert(
        { key: 'qr_code_path', value: storagePath, category: 'qr' },
        { onConflict: 'key' }
      )

    return NextResponse.json({
      message: 'QR code uploaded successfully',
      qrUrl,
    })
  } catch (error) {
    console.error('Upload QR error:', error)
    return NextResponse.json({ error: 'Failed to upload QR code' }, { status: 500 })
  }
}
