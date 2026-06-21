import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const propertyType = searchParams.get('propertyType')
    const connectionType = searchParams.get('connectionType')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build query with joins
    let query = db
      .from('Application')
      .select('*, user:User!userId(id, name, email, phone), documents:Document!applicationId(id, docType, verified), payments:Payment!applicationId(id, amount, status), approvals:Approval!applicationId(id, approvalNumber)', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (propertyType) query = query.eq('propertyType', propertyType)
    if (connectionType) query = query.eq('connectionType', connectionType)

    // For search, use ilike with OR - need to handle this differently in Supabase
    // Supabase supports .or() for combining filters
    if (search) {
      query = query.or(`applicantName.ilike.%${search}%,applicantEmail.ilike.%${search}%,applicantPhone.ilike.%${search}%,propertyAddress.ilike.%${search}%,propertyCity.ilike.%${search}%,propertyState.ilike.%${search}%`)
    }

    const { data: applications, error, count } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1)

    if (error) throw error

    const total = count || 0

    // Add _count equivalent from the fetched arrays
    const applicationsWithCount = (applications || []).map((app: Record<string, unknown>) => ({
      ...app,
      _count: {
        documents: Array.isArray(app.documents) ? app.documents.length : 0,
        payments: Array.isArray(app.payments) ? app.payments.length : 0,
      },
    }))

    return NextResponse.json({
      applications: applicationsWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin list applications error:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}
