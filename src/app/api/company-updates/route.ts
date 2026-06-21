import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') !== 'false' // default true
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build query
    let query = db
      .from('CompanyUpdate')
      .select('*', { count: 'exact' })

    if (category) query = query.eq('category', category)
    if (activeOnly) query = query.eq('active', true)

    const { data: updates, error, count } = await query
      .order('pinned', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) throw error

    const total = count || 0

    return NextResponse.json({
      updates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List company updates error:', error)
    return NextResponse.json({ error: 'Failed to fetch company updates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, category, pinned, active } = body

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    const validCategories = ['news', 'promotion', 'maintenance', 'policy']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const { data: update, error: insertError } = await db
      .from('CompanyUpdate')
      .insert({
        title,
        content,
        category,
        pinned: pinned || false,
        active: active !== false,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Notify all users about the update
    const { data: users } = await db
      .from('User')
      .select('id')
      .eq('role', 'user')

    if (users && users.length > 0) {
      const notifications = users.map((u: { id: string }) => ({
        userId: u.id,
        title: `Company Update: ${title}`,
        message: content.length > 100 ? content.substring(0, 100) + '...' : content,
        type: category === 'maintenance' ? 'warning' : 'info',
      }))

      await db
        .from('Notification')
        .insert(notifications)
    }

    return NextResponse.json(
      { message: 'Company update created successfully', update },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create company update error:', error)
    return NextResponse.json({ error: 'Failed to create company update' }, { status: 500 })
  }
}
