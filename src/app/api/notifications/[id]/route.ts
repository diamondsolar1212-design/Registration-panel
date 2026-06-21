import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data: notification, error: findError } = await db
      .from('Notification')
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Non-admin users can only mark their own notifications
    if (user.role !== 'admin' && notification.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const read = body.read !== undefined ? body.read : true

    const { data: updatedNotification, error: updateError } = await db
      .from('Notification')
      .update({ read })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      message: read ? 'Notification marked as read' : 'Notification marked as unread',
      notification: updatedNotification,
    })
  } catch (error) {
    console.error('Mark notification error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
