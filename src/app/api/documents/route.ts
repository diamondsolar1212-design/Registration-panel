import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { uploadToStorage, getPublicUrl } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const docType = searchParams.get('docType')

    // Build query
    let query = db
      .from('Document')
      .select('*, user:User!userId(id, name, email), application:Application!applicationId(id, applicantName, status)')

    // Regular users can only see their own documents
    if (user.role !== 'admin') {
      query = query.eq('userId', user.id)
    }

    if (applicationId) query = query.eq('applicationId', applicationId)
    if (docType) query = query.eq('docType', docType)

    const { data: documents, error } = await query
      .order('createdAt', { ascending: false })

    if (error) throw error

    // Add computed fileUrl to each document
    const documentsWithUrl = (documents || []).map((doc: Record<string, unknown>) => ({
      ...doc,
      fileUrl: doc.filePath ? getPublicUrl(doc.filePath as string) : null,
    }))

    return NextResponse.json({ documents: documentsWithUrl })
  } catch (error) {
    console.error('List documents error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docType = formData.get('docType') as string | null
    const applicationId = formData.get('applicationId') as string | null
    const remarks = formData.get('remarks') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!docType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 })
    }

    // Validate docType
    const validDocTypes = ['identity', 'address_proof', 'property_ownership', 'electricity_bill', 'payment_screenshot', 'other']
    if (!validDocTypes.includes(docType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // If applicationId is provided, verify it belongs to the user
    if (applicationId) {
      const { data: application, error: findError } = await db
        .from('Application')
        .select('*')
        .eq('id', applicationId)
        .single()

      if (findError || !application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }
      if (user.role !== 'admin' && application.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Upload to Supabase Storage
    const { url: fileUrl, path: storagePath } = await uploadToStorage(file, file.name, 'documents')

    // Save document record
    const { data: document, error: insertError } = await db
      .from('Document')
      .insert({
        userId: user.id,
        applicationId: applicationId || null,
        docType,
        fileName: file.name,
        filePath: storagePath,
        fileSize: file.size,
        mimeType: file.type,
        verified: false,
        remarks: remarks || null,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Add computed fileUrl to response
    const documentWithUrl = document
      ? { ...document, fileUrl: getPublicUrl(storagePath) }
      : null

    return NextResponse.json(
      { message: 'Document uploaded successfully', document: documentWithUrl },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
