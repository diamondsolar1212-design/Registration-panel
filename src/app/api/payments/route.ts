import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { uploadToStorage, getPublicUrl } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build query
    let query = db
      .from('Payment')
      .select('*, user:User!userId(id, name, email, phone), application:Application!applicationId(id, applicantName, status)', { count: 'exact' })

    // Regular users can only see their own payments
    if (user.role !== 'admin') {
      query = query.eq('userId', user.id)
    }

    if (applicationId) query = query.eq('applicationId', applicationId)
    if (status) query = query.eq('status', status)

    const { data: payments, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) throw error

    const total = count || 0

    // Add computed screenshotUrl to each payment
    const paymentsWithUrl = (payments || []).map((p: Record<string, unknown>) => ({
      ...p,
      screenshotUrl: p.screenshotPath ? getPublicUrl(p.screenshotPath as string) : null,
    }))

    return NextResponse.json({
      payments: paymentsWithUrl,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List payments error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const amount = formData.get('amount') as string | null
    const paymentType = formData.get('paymentType') as string | null
    const paymentMethod = formData.get('paymentMethod') as string | null
    const transactionId = formData.get('transactionId') as string | null
    const applicationId = formData.get('applicationId') as string | null
    const screenshot = formData.get('screenshot') as File | null

    if (!amount || !paymentType || !paymentMethod) {
      return NextResponse.json(
        { error: 'Amount, payment type, and payment method are required' },
        { status: 400 }
      )
    }

    // Validate paymentType
    const validPaymentTypes = ['application_fee', 'installation_fee', 'maintenance_fee']
    if (!validPaymentTypes.includes(paymentType)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    // Validate paymentMethod - Only UPI and Bank Transfer are supported
    const validPaymentMethods = ['upi', 'bank_transfer']
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method. Only UPI and Bank Transfer are supported.' }, { status: 400 })
    }

    // If applicationId is provided, verify it belongs to the user
    if (applicationId) {
      const { data: application, error: findError } = await db
        .from('Application')
        .select('*')
        .eq('id', applicationId)
        .single()

      if (findError || !application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }
      if (user.role !== 'admin' && application.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    let screenshotPath: string | null = null
    let screenshotUrl: string | null = null

    // Handle screenshot upload to Supabase Storage
    if (screenshot) {
      const { path: storagePath } = await uploadToStorage(screenshot, screenshot.name, 'payments')
      screenshotPath = storagePath
      screenshotUrl = getPublicUrl(storagePath)
    }

    const { data: payment, error: insertError } = await db
      .from('Payment')
      .insert({
        userId: user.id,
        applicationId: applicationId || null,
        amount: parseFloat(amount),
        paymentType,
        paymentMethod,
        transactionId: transactionId || null,
        screenshotPath,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Create notification
    await db
      .from('Notification')
      .insert({
        userId: user.id,
        title: 'Payment Submitted',
        message: `Your payment of ₹${parseFloat(amount).toLocaleString()} for ${paymentType.replace(/_/g, ' ')} has been submitted and is pending verification.`,
        type: 'info',
      })

    // Add computed screenshotUrl to response
    const paymentWithUrl = payment
      ? { ...payment, screenshotUrl }
      : null

    return NextResponse.json(
      { message: 'Payment recorded successfully', payment: paymentWithUrl },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
