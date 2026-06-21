import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the application
    const { data: application, error: findError } = await db
      .from('Application')
      .select('*, documents:Document!applicationId(id), payments:Payment!applicationId(id)')
      .eq('id', id)
      .single()

    if (findError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify application belongs to user
    if (user.role !== 'admin' && application.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check application is in draft status
    if (application.status !== 'draft') {
      return NextResponse.json(
        { error: 'Application can only be submitted from draft status' },
        { status: 400 }
      )
    }

    // Check that documents exist
    if (!application.documents || application.documents.length === 0) {
      return NextResponse.json(
        { error: 'Please upload at least one document before submitting' },
        { status: 400 }
      )
    }

    // Check that a payment exists
    if (!application.payments || application.payments.length === 0) {
      return NextResponse.json(
        { error: 'Please complete the registration fee payment before submitting' },
        { status: 400 }
      )
    }

    // Update application status to pending
    const { data: updatedApplication, error: updateError } = await db
      .from('Application')
      .update({ status: 'pending' })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Create notification for the user
    await db
      .from('Notification')
      .insert({
        userId: user.id,
        title: 'Application Submitted',
        message: `Your solar application has been submitted successfully and is now pending review. Application ID: ${id}`,
        type: 'success',
      })

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: updatedApplication,
    })
  } catch (error) {
    console.error('Submit application error:', error)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}
