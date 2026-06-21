import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Build query for notifications
    let query = db
      .from('Notification')
      .select('*, user:User!userId(id, name, email)', { count: 'exact' })

    // Regular users can only see their own notifications
    if (user.role !== 'admin') {
      query = query.eq('userId', user.id)
    }

    if (type) query = query.eq('type', type)
    if (unreadOnly) query = query.eq('read', false)

    const { data: notifications, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) throw error

    const total = count || 0

    // Compute unread count from the already-fetched data instead of a second query
    const unreadCount = (notifications || []).filter((n: { read: boolean }) => !n.read).length

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, title, message, type, link } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'userId, title, and message are required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['info', 'warning', 'success', 'error']
    const notificationType = type && validTypes.includes(type) ? type : 'info'

    const { data: notification, error } = await db
      .from('Notification')
      .insert({
        userId,
        title,
        message,
        type: notificationType,
        link: link || null,
        read: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      { message: 'Notification sent successfully', notification },
      { status: 201 }
    )
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
