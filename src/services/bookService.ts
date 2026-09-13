import { supabase, isSupabaseDemoMode } from '../lib/supabase';

const BUCKET_NAME = 'user-books';
export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export interface PDFValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a file is a valid PDF within size constraints.
 */
export async function validatePDFFile(file: File): Promise<PDFValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `PDF file exceeds the 50MB limit (size: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  // Check MIME type or extension
  const isPdfMime = file.type === 'application/pdf';
  const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
  if (!isPdfMime && !isPdfExt) {
    return {
      valid: false,
      error: 'Only PDF files (.pdf) are supported in your library',
    };
  }

  // Read first 5 bytes to verify %PDF- magic signature
  try {
    const slice = file.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const header = new TextDecoder('ascii').decode(buffer);
    if (!header.startsWith('%PDF-')) {
      return {
        valid: false,
        error: 'File does not appear to be a valid PDF document',
      };
    }
  } catch (err) {
    return {
      valid: false,
      error: 'Could not read file header. Please try another file.',
    };
  }

  return { valid: true };
}

/**
 * Upload a PDF file to Supabase Storage in user-books bucket.
 * In demo mode, creates an object URL and keeps local reference.
 */
export async function uploadBookPDF(
  userId: string,
  bookId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ filePath: string; signedUrl?: string }> {
  const filePath = `${userId}/${bookId}/original.pdf`;

  if (isSupabaseDemoMode) {
    if (onProgress) {
      onProgress(30);
      await new Promise((r) => setTimeout(r, 150));
      onProgress(70);
      await new Promise((r) => setTimeout(r, 150));
      onProgress(100);
    }
    const localUrl = URL.createObjectURL(file);
    return { filePath, signedUrl: localUrl };
  }

  // Progress simulation since Supabase JS doesn't provide standard progress callback
  if (onProgress) onProgress(15);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload to storage failed: ${error.message}`);
  }

  if (onProgress) onProgress(85);

  // Generate signed URL for immediate reading
  const { data: signedData, error: signError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600);

  if (onProgress) onProgress(100);

  return {
    filePath,
    signedUrl: signError ? undefined : signedData?.signedUrl,
  };
}

/**
 * Get a temporary 1-hour signed URL for a book's PDF in storage.
 */
export async function getBookSignedUrl(filePath: string): Promise<string | null> {
  if (isSupabaseDemoMode) {
    return filePath.startsWith('blob:') || filePath.startsWith('http') || filePath.startsWith('/')
      ? filePath
      : null;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    console.error('Failed to create signed URL for book:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete a book file from storage.
 */
export async function deleteBookFile(filePath: string): Promise<void> {
  if (isSupabaseDemoMode) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) {
    console.warn('Error deleting book from storage:', error.message);
  }
}
