import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build query - for non-admin users, we need to filter by application.userId
    // Since Supabase doesn't support filtering on nested joins directly in the query,
    // we need to first find the user's application IDs, then filter approvals
    let applicationIds: string[] | null = null

    if (user.role !== 'admin') {
      const { data: userApps } = await db
        .from('Application')
        .select('id')
        .eq('userId', user.id)
      applicationIds = (userApps || []).map((app: { id: string }) => app.id)
    }

    // Build the approval query
    let query = db
      .from('Approval')
      .select('*, application:Application!applicationId(id, applicantName, propertyType, propertyAddress, status, userId), versions:ApprovalLetterVersion!approvalId(*), history:ApprovalHistory!approvalId(*)', { count: 'exact' })

    if (applicationIds !== null) {
      if (applicationIds.length === 0) {
        // User has no applications, return empty
        return NextResponse.json({
          approvals: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
      query = query.in('applicationId', applicationIds)
    }

    const { data: approvals, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) throw error

    const total = count || 0

    // Sort nested arrays
    const processedApprovals = (approvals || []).map((approval: Record<string, unknown>) => ({
      ...approval,
      versions: Array.isArray(approval.versions)
        ? approval.versions.sort((a: { version: number }, b: { version: number }) => b.version - a.version).slice(0, 1)
        : [],
      history: Array.isArray(approval.history)
        ? approval.history.sort((a: { createdAt: string }, b: { createdAt: string }) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0, 5)
        : [],
    }))

    return NextResponse.json({
      approvals: processedApprovals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List approvals error:', error)
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
  }
}
