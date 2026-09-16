import { pdfjs } from '../lib/pdfWorker';

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
}

export interface ExtractedRangeResult {
  success: boolean;
  pages: ExtractedPageText[];
  charCount: number;
  error?: string;
}

const MAX_PAGE_CHARS = 8_000;
const MIN_TOTAL_CHARS = 80;

function failure(error: string): ExtractedRangeResult {
  return { success: false, pages: [], charCount: 0, error };
}

/**
 * Extracts the text of pages [startPage, endPage] and nothing else.
 *
 * Spoiler safety is structural: only pages inside the range are ever loaded, so nothing past
 * `endPage` can reach a recap. When a page range has no text layer (scanned books, image
 * placeholders) this fails instead of inventing content.
 */
export async function extractPdfTextRange(fileUrl: string, startPage: number, endPage: number): Promise<ExtractedRangeResult> {
  if (!Number.isInteger(startPage) || !Number.isInteger(endPage) || startPage < 1 || endPage < startPage) {
    return failure('Invalid page range.');
  }
  if (/\.(jpe?g|png|webp)$/i.test(fileUrl.split('?')[0])) {
    return failure('This book has no text to recap.');
  }

  const loadingTask = pdfjs.getDocument({
    url: fileUrl,
    // iPadOS/iOS WebKit silently stalls or throws on a range/streamed fetch of a cross-origin
    // signed URL (our Supabase storage links) — see ReaderViewport.tsx. Same fix here: one plain
    // full-body download instead of range requests.
    disableAutoFetch: true,
    disableStream: true,
    disableRange: true,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  });
  try {
    const doc = await loadingTask.promise;

    if (startPage > doc.numPages) return failure('These pages are outside the document.');
    const lastPage = Math.min(endPage, doc.numPages);

    const pages: ExtractedPageText[] = [];
    for (let pageNumber = startPage; pageNumber <= lastPage; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
        .join('')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n')
        .trim()
        .slice(0, MAX_PAGE_CHARS);
      page.cleanup();
      pages.push({ pageNumber, text });
    }

    const charCount = pages.reduce((n, p) => n + p.text.length, 0);
    if (charCount < MIN_TOTAL_CHARS) {
      return failure('No readable text on these pages (they may be scanned images).');
    }
    return { success: true, pages, charCount };
  } catch (err) {
    return failure((err as Error)?.message || 'Could not read the text of this book.');
  } finally {
    // Releases the worker-side document; this runs in the background after the reader leaves.
    void loadingTask.destroy();
  }
}
