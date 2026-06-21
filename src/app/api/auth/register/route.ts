import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await db
      .from('User')
      .select('id, name, email, phone, role, createdAt')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists', user: existingUser },
        { status: 200 }
      )
    }

    // Create user in our custom User table with hashed password
    // The Supabase Auth admin API is NOT called here to prevent server crashes
    // Users are authenticated via our custom User table + user-id header
    const hashedPassword = hashPassword(password)

    const { data: user, error } = await db
      .from('User')
      .insert({
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'user',
      })
      .select('id, name, email, phone, role, createdAt')
      .single()

    if (error) throw error

    return NextResponse.json(
      { message: 'User registered successfully', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
