import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { calculateSolarOutput } from '@/lib/solar-calculator'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build query for applications
    let query = db
      .from('Application')
      .select('*, documents:Document!applicationId(id, docType, verified), payments:Payment!applicationId(id, amount, status, paymentType), approvals:Approval!applicationId(id, approvalNumber, approvedAt)', { count: 'exact' })
      .eq('userId', user.id)

    if (status) {
      query = query.eq('status', status)
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
    console.error('List applications error:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      applicantName,
      applicantEmail,
      applicantPhone,
      applicantAddress,
      propertyType,
      propertyAddress,
      propertyState,
      propertyCity,
      propertyPincode,
      landRoofSize,
      landRoofSizeUnit,
      rooftopArea,
      rooftopAreaUnit,
      latitude,
      longitude,
      connectionType,
      preferredCapacity,
      electricityBill,
      existingConnection,
    } = body

    // Validate required fields
    if (!applicantName || !applicantEmail || !applicantPhone || !propertyType || !propertyAddress || !propertyState || !propertyCity || !propertyPincode || !landRoofSize || !connectionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Auto-calculate solar metrics
    const calculation = calculateSolarOutput({
      landRoofSize: parseFloat(landRoofSize),
      rooftopArea: rooftopArea ? parseFloat(rooftopArea) : undefined,
      propertyType,
      connectionType,
      electricityBill: electricityBill ? parseFloat(electricityBill) : undefined,
      preferredCapacity: preferredCapacity ? parseFloat(preferredCapacity) : undefined,
    })

    const { data: application, error: appError } = await db
      .from('Application')
      .insert({
        userId: user.id,
        applicantName,
        applicantEmail,
        applicantPhone,
        applicantAddress: applicantAddress || null,
        propertyType,
        propertyAddress,
        propertyState,
        propertyCity,
        propertyPincode,
        landRoofSize: parseFloat(landRoofSize),
        landRoofSizeUnit: landRoofSizeUnit || 'sq_ft',
        rooftopArea: rooftopArea ? parseFloat(rooftopArea) : null,
        rooftopAreaUnit: rooftopAreaUnit || 'sq_ft',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        connectionType,
        preferredCapacity: preferredCapacity ? parseFloat(preferredCapacity) : null,
        electricityBill: electricityBill ? parseFloat(electricityBill) : null,
        existingConnection: existingConnection || false,
        // Auto-calculated fields
        recommendedCapacity: calculation.recommendedCapacity,
        estimatedCost: calculation.estimatedCost,
        annualSavings: calculation.annualSavings,
        propertyScore: calculation.propertyScore,
        propertyClass: calculation.propertyClass,
        co2Reduction: calculation.co2Reduction,
        status: 'draft',
      })
      .select('*, documents:Document!applicationId(*), payments:Payment!applicationId(*)')
      .single()

    if (appError) throw appError

    // Also create a calculation record
    const { error: calcError } = await db
      .from('ApplicationCalculation')
      .insert({
        applicationId: application.id,
        solarIrradiance: 5.5,
        systemEfficiency: connectionType === 'off-grid' ? 0.72 : 0.78,
        degradationRate: 0.5,
        peakCapacity: calculation.peakCapacity,
        annualGeneration: calculation.annualGeneration,
        paybackPeriod: calculation.paybackPeriod,
        roiPercent: calculation.roiPercent,
        carbonOffset: calculation.co2Reduction,
      })

    if (calcError) console.error('Calculation record error:', calcError)

    // Create notification for the user
    await db
      .from('Notification')
      .insert({
        userId: user.id,
        title: 'Application Submitted',
        message: `Your solar application has been submitted successfully. Application ID: ${application.id}`,
        type: 'success',
      })

    return NextResponse.json(
      { message: 'Application created successfully', application },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
  }
}
