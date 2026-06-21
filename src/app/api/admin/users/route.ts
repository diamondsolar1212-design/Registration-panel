import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: users, error } = await db
      .from('User')
      .select('id, name, email, phone')
      .eq('role', 'user')
      .order('createdAt', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
