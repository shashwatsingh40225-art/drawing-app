import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { savePDFToLocalCache, getPDFUrlFromLocalCache, deletePDFFromLocalCache } from '../utils/localPdfCache';

const BUCKET_NAME = 'user-books';
export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export interface PDFValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a file is a valid PDF within size constraints.
 * Checks first 1024 bytes per PDF ISO 32000 specification for '%PDF-'.
 */
export async function validatePDFFile(file: File): Promise<PDFValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: `PDF file exceeds the 25MB limit (size: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
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

  // Read first 1024 bytes to verify %PDF- magic signature (handles UTF-8 BOM or binary preambles)
  try {
    const slice = file.slice(0, Math.min(file.size, 1024));
    const buffer = await slice.arrayBuffer();
    const header = new TextDecoder('latin1').decode(buffer);
    if (!header.includes('%PDF-')) {
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
 * In demo mode or offline fallback, stores PDF into IndexedDB and keeps local reference.
 */
export async function uploadBookPDF(
  userId: string,
  bookId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ filePath: string; signedUrl?: string }> {
  const filePath = `${userId}/${bookId}/original.pdf`;
  const isDemo = isSupabaseDemoMode || userId.startsWith('demo-');

  if (isDemo) {
    if (onProgress) {
      onProgress(30);
      await new Promise((r) => setTimeout(r, 100));
      onProgress(70);
      await new Promise((r) => setTimeout(r, 100));
      onProgress(100);
    }
    // Save to browser's native IndexedDB so it persists across reloads
    await savePDFToLocalCache(filePath, file);
    const localUrl = URL.createObjectURL(file);
    return { filePath, signedUrl: localUrl };
  }

  // Live Supabase upload
  if (onProgress) onProgress(20);

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload failed, saving to local cache:', error.message);
      await savePDFToLocalCache(filePath, file);
      if (onProgress) onProgress(100);
      const localUrl = URL.createObjectURL(file);
      return { filePath, signedUrl: localUrl };
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
  } catch (err) {
    console.warn('Supabase upload exception, saving locally:', err);
    await savePDFToLocalCache(filePath, file);
    if (onProgress) onProgress(100);
    const localUrl = URL.createObjectURL(file);
    return { filePath, signedUrl: localUrl };
  }
}

/**
 * Get a temporary 1-hour signed URL for a book's PDF in storage or local cache.
 */
export async function getBookSignedUrl(filePath: string): Promise<string | null> {
  if (
    filePath.startsWith('blob:') ||
    filePath.startsWith('data:') ||
    filePath.startsWith('http://') ||
    filePath.startsWith('https://') ||
    filePath.startsWith('/')
  ) {
    return filePath;
  }

  // 1. Check local IndexedDB cache first
  const localUrl = await getPDFUrlFromLocalCache(filePath);
  if (localUrl) {
    return localUrl;
  }

  if (isSupabaseDemoMode || filePath.startsWith('demo-')) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      console.error('Failed to create signed URL for book:', error);
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Delete a book file from storage and local cache.
 */
export async function deleteBookFile(filePath: string): Promise<void> {
  await deletePDFFromLocalCache(filePath);

  if (isSupabaseDemoMode || filePath.startsWith('demo-')) return;

  try {
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  } catch (err) {
    console.warn('Error deleting book from storage:', err);
  }
}
