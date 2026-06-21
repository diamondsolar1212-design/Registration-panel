import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/auth'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Step 1: Look up user in our custom User table
    const { data: user, error } = await db
      .from('User')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Step 2: Verify password using our custom hash (scrypt or SHA-256 legacy)
    let isValid = false
    try {
      isValid = verifyPassword(password, user.password)
    } catch {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const { password: _, ...userWithoutPassword } = user

    // Step 3: Generate a simple token from user ID for auth header
    // We use the user's UUID as the access token — the auth/me endpoint
    // accepts both Bearer tokens (Supabase Auth JWT) and user-id headers
    const accessToken = user.id

    // Step 4: Upgrade legacy SHA-256 passwords to scrypt on successful login
    if (user.password && !user.password.includes(':')) {
      try {
        const newHash = hashPassword(password)
        await db.from('User').update({ password: newHash }).eq('id', user.id)
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
