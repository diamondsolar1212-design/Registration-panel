import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { calculateSolarOutput } from '@/lib/solar-calculator'

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
    const { data: application, error } = await db
      .from('Application')
      .select('*, documents:Document!applicationId(*), payments:Payment!applicationId(*), approvals:Approval!applicationId(*, versions:ApprovalLetterVersion!approvalId(*), history:ApprovalHistory!approvalId(*)), calculations:ApplicationCalculation!applicationId(*), user:User!userId(id, name, email, phone)')
      .eq('id', id)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Non-admin users can only see their own applications
    if (user.role !== 'admin' && application.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ application })
  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { data: existingApplication, error: findError } = await db
      .from('Application')
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !existingApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Non-admin users can only update their own pending applications
    if (user.role !== 'admin' && existingApplication.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role !== 'admin' && existingApplication.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot update application that is not pending' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Fields that can be updated
    const updatableFields = [
      'applicantName', 'applicantEmail', 'applicantPhone', 'applicantAddress',
      'propertyType', 'propertyAddress', 'propertyState', 'propertyCity', 'propertyPincode',
      'connectionType', 'existingConnection',
    ]

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Numeric fields
    if (body.landRoofSize !== undefined) updateData.landRoofSize = parseFloat(body.landRoofSize)
    if (body.landRoofSizeUnit !== undefined) updateData.landRoofSizeUnit = body.landRoofSizeUnit
    if (body.rooftopArea !== undefined) updateData.rooftopArea = parseFloat(body.rooftopArea)
    if (body.rooftopAreaUnit !== undefined) updateData.rooftopAreaUnit = body.rooftopAreaUnit
    if (body.latitude !== undefined) updateData.latitude = parseFloat(body.latitude)
    if (body.longitude !== undefined) updateData.longitude = parseFloat(body.longitude)
    if (body.preferredCapacity !== undefined) updateData.preferredCapacity = parseFloat(body.preferredCapacity)
    if (body.electricityBill !== undefined) updateData.electricityBill = parseFloat(body.electricityBill)

    // Recalculate solar metrics if relevant fields changed
    const relevantFieldsChanged =
      body.landRoofSize !== undefined ||
      body.rooftopArea !== undefined ||
      body.propertyType !== undefined ||
      body.connectionType !== undefined ||
      body.electricityBill !== undefined ||
      body.preferredCapacity !== undefined

    if (relevantFieldsChanged) {
      const calculation = calculateSolarOutput({
        landRoofSize: updateData.landRoofSize as number ?? existingApplication.landRoofSize,
        rooftopArea: (updateData.rooftopArea as number ?? existingApplication.rooftopArea) ?? undefined,
        propertyType: (updateData.propertyType as string) ?? existingApplication.propertyType,
        connectionType: (updateData.connectionType as string) ?? existingApplication.connectionType,
        electricityBill: (updateData.electricityBill as number ?? existingApplication.electricityBill) ?? undefined,
        preferredCapacity: (updateData.preferredCapacity as number ?? existingApplication.preferredCapacity) ?? undefined,
      })

      updateData.recommendedCapacity = calculation.recommendedCapacity
      updateData.estimatedCost = calculation.estimatedCost
      updateData.annualSavings = calculation.annualSavings
      updateData.propertyScore = calculation.propertyScore
      updateData.propertyClass = calculation.propertyClass
      updateData.co2Reduction = calculation.co2Reduction

      // Update calculation record
      await db
        .from('ApplicationCalculation')
        .insert({
          applicationId: id,
          solarIrradiance: 5.5,
          systemEfficiency: ((updateData.connectionType as string) ?? existingApplication.connectionType) === 'off-grid' ? 0.72 : 0.78,
          degradationRate: 0.5,
          peakCapacity: calculation.peakCapacity,
          annualGeneration: calculation.annualGeneration,
          paybackPeriod: calculation.paybackPeriod,
          roiPercent: calculation.roiPercent,
          carbonOffset: calculation.co2Reduction,
        })
    }

    const { data: application, error: updateError } = await db
      .from('Application')
      .update(updateData)
      .eq('id', id)
      .select('*, documents:Document!applicationId(*), payments:Payment!applicationId(*), approvals:Approval!applicationId(*), calculations:ApplicationCalculation!applicationId(*)')
      .single()

    if (updateError) throw updateError

    // Sort calculations by calculatedAt desc and take the latest
    if (application?.calculations && Array.isArray(application.calculations)) {
      application.calculations = application.calculations
        .sort((a: { calculatedAt: string }, b: { calculatedAt: string }) =>
          new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
        )
        .slice(0, 1)
    }

    return NextResponse.json({ message: 'Application updated successfully', application })
  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}
