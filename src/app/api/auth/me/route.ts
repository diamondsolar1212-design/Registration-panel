import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromHeaders(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
