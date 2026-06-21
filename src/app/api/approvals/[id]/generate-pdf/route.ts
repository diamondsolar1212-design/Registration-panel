import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(
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
    const { terms, conditions, validUntil } = body

    const { data: approval, error: findError } = await db
      .from('Approval')
      .select('*, application:Application!applicationId(*, user:User!userId(id, name, email), calculations:ApplicationCalculation!applicationId(*))')
      .eq('id', id)
      .single()

    if (findError || !approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    // Sort calculations by calculatedAt desc and take the latest
    const app = approval.application
    if (Array.isArray(app.calculations)) {
      app.calculations = app.calculations
        .sort((a: { calculatedAt: string }, b: { calculatedAt: string }) =>
          new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime()
        )
    }

    // Build the letter content
    const letterContent = {
      header: {
        companyName: 'Diamond Solar Energy Pvt. Ltd.',
        address: '123 Solar Avenue, Green City, India - 110001',
        phone: '+91 98765 43210',
        email: 'info@diamondsolar.in',
        website: 'www.diamondsolar.in',
        logo: '/logo.png',
      },
      approvalDetails: {
        approvalNumber: approval.approvalNumber,
        approvalDate: approval.approvedAt ? new Date(approval.approvedAt).toISOString() : new Date().toISOString(),
        validUntil: (validUntil ? new Date(validUntil) : approval.validUntil ? new Date(approval.validUntil) : null)?.toISOString() || null,
      },
      recipient: {
        name: app.applicantName,
        email: app.applicantEmail,
        phone: app.applicantPhone,
        address: app.applicantAddress,
      },
      propertyDetails: {
        type: app.propertyType,
        address: app.propertyAddress,
        state: app.propertyState,
        city: app.propertyCity,
        pincode: app.propertyPincode,
        landRoofSize: app.landRoofSize,
        landRoofSizeUnit: app.landRoofSizeUnit || 'sq_ft',
        rooftopArea: app.rooftopArea,
        rooftopAreaUnit: app.rooftopAreaUnit || 'sq_ft',
      },
      solarSpecification: {
        connectionType: app.connectionType,
        recommendedCapacity: app.recommendedCapacity,
        estimatedCost: app.estimatedCost,
        annualSavings: app.annualSavings,
        co2Reduction: app.co2Reduction,
      },
      calculation: app.calculations?.[0] || null,
      terms: terms || approval.terms || 'Standard terms and conditions apply.',
      conditions: conditions || approval.conditions || 'Subject to site inspection and technical feasibility.',
      footer: {
        signatoryName: admin.name,
        signatoryRole: 'Administrator',
        companyName: 'Diamond Solar Energy Pvt. Ltd.',
      },
    }

    // Determine next version number
    const { data: latestVersion } = await db
      .from('ApprovalLetterVersion')
      .select('version')
      .eq('approvalId', id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = (latestVersion?.version || 0) + 1

    // Create letter version record
    const { data: letterVersion, error: versionError } = await db
      .from('ApprovalLetterVersion')
      .insert({
        approvalId: id,
        version: nextVersion,
        content: JSON.stringify(letterContent),
        generatedBy: admin.id,
      })
      .select()
      .single()

    if (versionError) throw versionError

    // Update approval
    await db
      .from('Approval')
      .update({
        pdfGenerated: true,
        terms: terms || approval.terms,
        conditions: conditions || approval.conditions,
        validUntil: validUntil ? new Date(validUntil) : approval.validUntil,
      })
      .eq('id', id)

    // Record in history
    await db
      .from('ApprovalHistory')
      .insert({
        approvalId: id,
        action: nextVersion === 1 ? 'created' : 'updated',
        performedBy: admin.id,
        notes: `Approval letter v${nextVersion} generated`,
      })

    // Notify the user
    await db
      .from('Notification')
      .insert({
        userId: app.user.id,
        title: 'Approval Letter Generated',
        message: `Your approval letter (v${nextVersion}) has been generated for application "${app.applicantName}".`,
        type: 'success',
      })

    return NextResponse.json({
      message: 'Approval letter generated successfully',
      letterContent,
      version: letterVersion,
    })
  } catch (error) {
    console.error('Generate PDF error:', error)
    return NextResponse.json({ error: 'Failed to generate approval letter' }, { status: 500 })
  }
}
