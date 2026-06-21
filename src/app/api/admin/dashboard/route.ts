import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// In-memory cache for dashboard data (30-second TTL to reduce Supabase load)
let dashboardCache: { data: unknown; timestamp: number } | null = null
const CACHE_TTL_MS = 30_000 // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Return cached data if still fresh
    if (dashboardCache && Date.now() - dashboardCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(dashboardCache.data)
    }

    // OPTIMIZED: Reduced from 19 queries to 7 queries
    // - Merged all Application count queries into a single query with all fields
    // - Merged Document count queries into a single query
    // - Merged Payment queries into a single query
    // - Removed redundant sequential queries
    const [
      usersResult,
      allAppsResult,
      allPaymentsResult,
      allDocsResult,
      totalApprovalsResult,
      recentAppsResult,
      approvedCapacityResult,
    ] = await Promise.all([
      // 1. Total users with role 'user'
      db.from('User').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      // 2. ALL applications with status + propertyType (replaces 5 count queries + 2 sequential queries)
      db.from('Application').select('status, propertyType'),
      // 3. ALL verified payments with amount + createdAt (replaces 3 separate queries)
      db.from('Payment').select('amount, status, createdAt'),
      // 4. ALL documents with verified flag (replaces 3 count queries)
      db.from('Document').select('verified'),
      // 5. Total approvals
      db.from('Approval').select('*', { count: 'exact', head: true }),
      // 6. Recent applications with user info
      db.from('Application').select('*, user:User!userId(id, name, email)').order('createdAt', { ascending: false }).limit(5),
      // 7. Approved applications capacity and co2
      db.from('Application').select('recommendedCapacity, co2Reduction').eq('status', 'approved'),
    ])

    // Compute application stats from the single allApps query
    const allApps = allAppsResult.data || []
    let totalApplications = 0
    let pendingApplications = 0
    let approvedApplications = 0
    let rejectedApplications = 0
    const statusDistribution: Record<string, number> = {}
    const typeDistribution: Record<string, number> = {}

    for (const app of allApps) {
      totalApplications++
      statusDistribution[app.status] = (statusDistribution[app.status] || 0) + 1
      typeDistribution[app.propertyType] = (typeDistribution[app.propertyType] || 0) + 1
      if (app.status === 'pending' || app.status === 'draft') pendingApplications++
      if (app.status === 'approved') approvedApplications++
      if (app.status === 'rejected') rejectedApplications++
    }

    // Compute payment stats from the single allPayments query
    const allPayments = allPaymentsResult.data || []
    let totalRevenue = 0
    let verifiedPayments = 0
    let pendingPayments = 0
    const revenueByMonth: Record<string, number> = {}
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    for (const payment of allPayments) {
      if (payment.status === 'verified') {
        totalRevenue += payment.amount || 0
        verifiedPayments++
        // Monthly revenue (only last 6 months)
        if (payment.createdAt) {
          const paymentDate = new Date(payment.createdAt)
          if (paymentDate >= sixMonthsAgo) {
            const monthKey = paymentDate.toISOString().slice(0, 7)
            revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (payment.amount || 0)
          }
        }
      } else if (payment.status === 'pending') {
        pendingPayments++
      }
    }

    // Compute document stats from the single allDocs query
    const allDocs = allDocsResult.data || []
    let totalDocs = allDocs.length
    let verifiedDocs = 0
    for (const doc of allDocs) {
      if (doc.verified) verifiedDocs++
    }

    // Calculate total capacity of approved applications
    const totalCapacity = (approvedCapacityResult.data || []).reduce(
      (sum: number, a: { recommendedCapacity: number | null }) => sum + (a.recommendedCapacity || 0),
      0
    )
    const totalCo2 = (approvedCapacityResult.data || []).reduce(
      (sum: number, a: { co2Reduction: number | null }) => sum + (a.co2Reduction || 0),
      0
    )

    const responseData = {
      stats: {
        users: {
          total: usersResult.count || 0,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
          underReview: totalApplications - pendingApplications - approvedApplications - rejectedApplications,
        },
        revenue: {
          total: totalRevenue,
          verifiedPayments,
          pendingPayments,
        },
        documents: {
          total: totalDocs,
          verified: verifiedDocs,
          pending: totalDocs - verifiedDocs,
        },
        approvals: {
          total: totalApprovalsResult.count || 0,
        },
        solar: {
          totalCapacityKw: totalCapacity,
          totalCo2Reduction: totalCo2,
        },
      },
      charts: {
        revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
          month,
          revenue,
        })),
        applicationsByStatus: Object.entries(statusDistribution).map(([status, count]) => ({
          status,
          count,
        })),
        applicationsByType: Object.entries(typeDistribution).map(([type, count]) => ({
          type,
          count,
        })),
      },
      recentApplications: recentAppsResult.data || [],
    }

    // Update cache
    dashboardCache = { data: responseData, timestamp: Date.now() }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
