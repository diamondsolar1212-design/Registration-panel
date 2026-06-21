import { db } from '@/lib/db'

// Use the shared singleton Supabase client for storage operations
const supabase = db

// Storage bucket name
export const STORAGE_BUCKET = 'uploads'

/**
 * Upload a file to Supabase Storage
 * Returns the public URL of the uploaded file
 */
export async function uploadToStorage(
  file: File | Buffer,
  fileName: string,
  folder: string = 'documents'
): Promise<{ url: string; path: string }> {
  const timestamp = Date.now()
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${folder}/${timestamp}-${safeName}`

  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file
  const uint8Array = arrayBuffer instanceof ArrayBuffer ? new Uint8Array(arrayBuffer) : arrayBuffer
  const buffer = Buffer.from(uint8Array)

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file instanceof File ? file.type : undefined,
      upsert: false,
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath)

  return {
    url: urlData.publicUrl,
    path: storagePath,
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromStorage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])

  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Get public URL for a file in Supabase Storage
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}
