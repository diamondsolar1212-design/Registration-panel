import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

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
    const { status, adminNotes, reviewedBy } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['draft', 'pending', 'under_review', 'approved', 'rejected', 'installed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: application, error: findError } = await db
      .from('Application')
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      status,
      reviewedBy: reviewedBy || admin.id,
      reviewedAt: new Date(),
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }

    const { data: updatedApplication, error: updateError } = await db
      .from('Application')
      .update(updateData)
      .eq('id', id)
      .select('*, user:User!userId(id, name, email)')
      .single()

    if (updateError) throw updateError

    // If approved, create an approval record
    if (status === 'approved') {
      // Count existing approvals for generating approval number
      const { count: approvalCount } = await db
        .from('Approval')
        .select('*', { count: 'exact', head: true })

      const approvalNumber = `DS-APR-${String((approvalCount || 0) + 1).padStart(6, '0')}-${new Date().getFullYear()}`

      const { data: newApproval, error: approvalError } = await db
        .from('Approval')
        .insert({
          applicationId: id,
          approvalNumber,
          approvedBy: admin.id,
          approvedAt: new Date(),
          validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          pdfGenerated: false,
        })
        .select()
        .single()

      if (approvalError) {
        console.error('Create approval error:', approvalError)
      }

      // Record approval history
      if (newApproval) {
        await db
          .from('ApprovalHistory')
          .insert({
            approvalId: newApproval.id,
            action: 'created',
            performedBy: admin.id,
            notes: 'Application approved',
          })
      }
    }

    // Notify the user
    const notificationType: Record<string, string> = {
      draft: 'info',
      pending: 'info',
      under_review: 'info',
      approved: 'success',
      rejected: 'error',
      installed: 'success',
    }

    const statusMessages: Record<string, string> = {
      draft: 'Your application has been moved back to draft.',
      pending: 'Your application is now pending review.',
      under_review: 'Your application is now under review.',
      approved: 'Congratulations! Your application has been approved.',
      rejected: `Your application has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`,
      installed: 'Your solar system has been installed successfully!',
    }

    await db
      .from('Notification')
      .insert({
        userId: application.userId,
        title: `Application ${status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
        message: statusMessages[status] || 'Your application status has been updated.',
        type: (notificationType[status] || 'info') as 'info' | 'warning' | 'success' | 'error',
        link: `/approval`,
      })

    return NextResponse.json({
      message: `Application ${status}`,
      application: updatedApplication,
    })
  } catch (error) {
    console.error('Admin review application error:', error)
    return NextResponse.json({ error: 'Failed to review application' }, { status: 500 })
  }
}
