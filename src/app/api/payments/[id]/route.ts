import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getPublicUrl } from '@/lib/supabase'

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
    const { status, remarks } = body

    if (!status || !['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "verified" or "rejected"' },
        { status: 400 }
      )
    }

    const { data: payment, error: findError } = await db
      .from('Payment')
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const { data: updatedPayment, error: updateError } = await db
      .from('Payment')
      .update({
        status,
        verifiedBy: admin.id,
        verifiedAt: new Date(),
        remarks: remarks || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Notify the user
    await db
      .from('Notification')
      .insert({
        userId: payment.userId,
        title: status === 'verified' ? 'Payment Verified' : 'Payment Rejected',
        message: status === 'verified'
          ? `Your payment of ₹${payment.amount.toLocaleString()} has been verified.`
          : `Your payment of ₹${payment.amount.toLocaleString()} has been rejected. ${remarks ? `Reason: ${remarks}` : ''}`,
        type: status === 'verified' ? 'success' : 'error',
      })

    // Add computed screenshotUrl
    const paymentWithUrl = updatedPayment
      ? { ...updatedPayment, screenshotUrl: updatedPayment.screenshotPath ? getPublicUrl(updatedPayment.screenshotPath) : null }
      : null

    return NextResponse.json({
      message: `Payment ${status}`,
      payment: paymentWithUrl,
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
