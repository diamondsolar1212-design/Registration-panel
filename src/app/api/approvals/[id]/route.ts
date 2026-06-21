import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data: approval, error } = await db
      .from('Approval')
      .select('*, application:Application!applicationId(*, user:User!userId(id, name, email, phone)), versions:ApprovalLetterVersion!approvalId(*), history:ApprovalHistory!approvalId(*)')
      .eq('id', id)
      .single()

    if (error || !approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    // Non-admin users can only see approvals for their own applications
    if (user.role !== 'admin' && approval.application?.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Sort nested arrays
    if (Array.isArray(approval.versions)) {
      approval.versions = approval.versions.sort((a: { version: number }, b: { version: number }) => b.version - a.version)
    }
    if (Array.isArray(approval.history)) {
      approval.history = approval.history.sort((a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return NextResponse.json({ approval })
  } catch (error) {
    console.error('Get approval error:', error)
    return NextResponse.json({ error: 'Failed to fetch approval' }, { status: 500 })
  }
}

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
    const { approvedBy, validUntil, terms, conditions, notes, action } = body

    const { data: approval, error: findError } = await db
      .from('Approval')
      .select('*, application:Application!applicationId(*)')
      .eq('id', id)
      .single()

    if (findError || !approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (approvedBy !== undefined) updateData.approvedBy = approvedBy
    if (validUntil !== undefined) updateData.validUntil = new Date(validUntil)
    if (terms !== undefined) updateData.terms = terms
    if (conditions !== undefined) updateData.conditions = conditions

    const { data: updatedApproval, error: updateError } = await db
      .from('Approval')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    // Record in history
    await db
      .from('ApprovalHistory')
      .insert({
        approvalId: id,
        action: action || 'updated',
        performedBy: admin.id,
        notes: notes || 'Approval updated',
      })

    // Notify the user
    await db
      .from('Notification')
      .insert({
        userId: approval.application.userId,
        title: 'Approval Updated',
        message: `Your approval for application "${approval.application.applicantName}" has been updated.`,
        type: 'info',
      })

    return NextResponse.json({
      message: 'Approval updated successfully',
      approval: updatedApproval,
    })
  } catch (error) {
    console.error('Update approval error:', error)
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
  }
}
