import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { deleteFromStorage, getPublicUrl } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data: document, error: findError } = await db
      .from('Document')
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Non-admin users can only delete their own documents
    if (user.role !== 'admin' && document.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete file from Supabase Storage
    if (document.filePath) {
      try {
        await deleteFromStorage(document.filePath)
      } catch {
        // File might not exist in storage, continue with DB deletion
      }
    }

    // Delete from database
    const { error: deleteError } = await db
      .from('Document')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { verified, remarks } = body

    const { data: document, error: findError } = await db
      .from('Document')
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (verified !== undefined) {
      updateData.verified = verified
      updateData.verifiedBy = admin.id
      updateData.verifiedAt = new Date()
    }
    if (remarks !== undefined) {
      updateData.remarks = remarks
    }

    const { data: updatedDocument, error: updateError } = await db
      .from('Document')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Notify the user about verification
    if (verified !== undefined) {
      await db
        .from('Notification')
        .insert({
          userId: document.userId,
          title: verified ? 'Document Verified' : 'Document Rejected',
          message: verified
            ? `Your document "${document.fileName}" has been verified.`
            : `Your document "${document.fileName}" has been rejected. ${remarks ? `Reason: ${remarks}` : ''}`,
          type: verified ? 'success' : 'error',
        })
    }

    return NextResponse.json({
      message: verified ? 'Document verified' : 'Document verification updated',
      document: updatedDocument,
    })
  } catch (error) {
    console.error('Verify document error:', error)
    return NextResponse.json({ error: 'Failed to verify document' }, { status: 500 })
  }
}
