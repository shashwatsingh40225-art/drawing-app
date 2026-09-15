import { pdfjs } from '../lib/pdfWorker';
import { getBookSignedUrl } from './bookService';

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
}

export interface ExtractedRangeResult {
  success: boolean;
  startPage: number;
  endPage: number;
  totalPages?: number;
  pages: ExtractedPageText[];
  combinedText: string;
  charCount: number;
  error?: string;
  isPlaceholder?: boolean;
}

const MAX_TOTAL_CHARS = 28000; // Keep prompt well within fast token range while capturing full session

/**
 * Checks if a file URL points to an image placeholder instead of a PDF.
 */
function isImagePlaceholderUrl(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.jpeg') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp')
  );
}

/**
 * Extracts exact text from a contiguous range of PDF pages [startPage, endPage].
 * Only the specified pages are retrieved and parsed.
 */
export async function extractPdfTextRange(
  fileUrlOrPath: string,
  startPage: number,
  endPage: number,
  fallbackMetadata?: { title?: string; description?: string; author?: string }
): Promise<ExtractedRangeResult> {
  const normStart = Math.min(startPage, endPage);
  const normEnd = Math.max(startPage, endPage);

  if (!fileUrlOrPath) {
    return {
      success: false,
      startPage: normStart,
      endPage: normEnd,
      pages: [],
      combinedText: '',
      charCount: 0,
      error: 'No file path or URL provided.',
    };
  }

  // Resolve signed URL or local cache URL if this is a storage path
  let resolvedUrl = fileUrlOrPath;
  if (!fileUrlOrPath.startsWith('http') && !fileUrlOrPath.startsWith('blob:') && !fileUrlOrPath.startsWith('data:') && !fileUrlOrPath.startsWith('/')) {
    const signed = await getBookSignedUrl(fileUrlOrPath);
    if (signed) {
      resolvedUrl = signed;
    }
  }

  // Handle demo image placeholder files (e.g. demo sketchbook plates)
  if (isImagePlaceholderUrl(resolvedUrl)) {
    const title = fallbackMetadata?.title || 'Visual Study Plate';
    const desc = fallbackMetadata?.description || 'Visual plate and sketchbook study notes.';
    const placeholderText = `[Visual Study Book: ${title}]\n${desc}\nStudied Plates ${normStart} through ${normEnd}.`;
    return {
      success: true,
      startPage: normStart,
      endPage: normEnd,
      totalPages: normEnd,
      pages: [{ pageNumber: normStart, text: placeholderText }],
      combinedText: placeholderText,
      charCount: placeholderText.length,
      isPlaceholder: true,
    };
  }

  try {
    const loadingTask = pdfjs.getDocument({
      url: resolvedUrl,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    const clampedStart = Math.max(1, Math.min(normStart, totalPages));
    const clampedEnd = Math.max(clampedStart, Math.min(normEnd, totalPages));

    const extractedPages: ExtractedPageText[] = [];

    for (let p = clampedStart; p <= clampedEnd; p++) {
      try {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ('str' in item ? (item as { str: string }).str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        extractedPages.push({
          pageNumber: p,
          text: pageText,
        });
      } catch (pageErr) {
        console.warn(`Failed to extract text from page ${p}:`, pageErr);
        extractedPages.push({
          pageNumber: p,
          text: '',
        });
      }
    }

    // Build structured text with page headers
    const textBlocks: string[] = [];
    let accumulatedLength = 0;

    for (const p of extractedPages) {
      if (p.text) {
        textBlocks.push(`[Page ${p.pageNumber}]\n${p.text}`);
        accumulatedLength += p.text.length;
      }
    }

    let combinedText = textBlocks.join('\n\n');

    // If session is very long, safely compress by keeping start, middle, and end portions
    if (combinedText.length > MAX_TOTAL_CHARS) {
      const budgetPerPage = Math.floor(MAX_TOTAL_CHARS / extractedPages.length);
      const trimmedBlocks = extractedPages.map((p) => {
        if (!p.text) return '';
        const trimmed = p.text.length > budgetPerPage
          ? p.text.slice(0, budgetPerPage) + ' ...[page section continued]'
          : p.text;
        return `[Page ${p.pageNumber}]\n${trimmed}`;
      }).filter(Boolean);
      combinedText = trimmedBlocks.join('\n\n');
    }

    // Check if pages contained extractable text
    if (combinedText.trim().length < 25) {
      return {
        success: false,
        startPage: clampedStart,
        endPage: clampedEnd,
        totalPages,
        pages: extractedPages,
        combinedText: '',
        charCount: 0,
        error: 'No readable text found in this page range (pages may contain scanned raster images).',
      };
    }

    return {
      success: true,
      startPage: clampedStart,
      endPage: clampedEnd,
      totalPages,
      pages: extractedPages,
      combinedText,
      charCount: combinedText.length,
    };
  } catch (err: any) {
    console.error('PDF text extraction error:', err);
    return {
      success: false,
      startPage: normStart,
      endPage: normEnd,
      pages: [],
      combinedText: '',
      charCount: 0,
      error: err?.message || 'Failed to parse PDF document for text extraction.',
    };
  }
}
