import ePub from 'epubjs';

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
 * Extracts the text of spine sections [startSection, endSection] and nothing else.
 *
 * EPUB has no fixed page like a PDF, so a "page" here is one spine item (chapter/section) —
 * the book's own natural, stable unit, 1-indexed to line up with how pages are numbered
 * everywhere else in the app. This is coarser than a PDF page, but the spoiler guard is just
 * as structural: a spine item beyond `endSection` is never loaded, so nothing past it can
 * reach a recap. The one caveat (shared with the PDF extractor, which also always includes the
 * full text of the last page even if the reader stopped partway down it) is that a very long
 * final chapter is included in full even if the reader only read part of it.
 */
export async function extractEpubTextRange(fileUrl: string, startSection: number, endSection: number): Promise<ExtractedRangeResult> {
  if (!Number.isInteger(startSection) || !Number.isInteger(endSection) || startSection < 1 || endSection < startSection) {
    return failure('Invalid section range.');
  }

  // epub.js's own URL-fetching (ePub(url)) silently hangs forever on a blob: URL (our IndexedDB
  // demo-mode cache path) and is extension-sniffed for everything else — fetching the bytes
  // ourselves and handing epub.js an ArrayBuffer sidesteps its request layer entirely. Same fix
  // in spirit as disabling range/stream fetching for the PDF path.
  let buffer: ArrayBuffer;
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) return failure(`Could not download this book (HTTP ${res.status}).`);
    buffer = await res.arrayBuffer();
  } catch (err) {
    return failure((err as Error)?.message || 'Could not download this book.');
  }

  const book = ePub(buffer);
  try {
    await book.ready;

    // epub.js's bundled .d.ts omits `Spine.length`, though it's set at runtime in spine.js.
    const total = (book.spine as unknown as { length: number }).length ?? 0;
    if (total === 0) return failure('This book has no readable sections.');
    if (startSection > total) return failure('These pages are outside the document.');
    const lastSection = Math.min(endSection, total);

    const pages: ExtractedPageText[] = [];
    for (let sectionNumber = startSection; sectionNumber <= lastSection; sectionNumber++) {
      const section = book.spine.get(sectionNumber - 1); // spine is 0-indexed internally
      if (!section) continue;
      try {
        const doc: Document = await section.load(book.load.bind(book));
        const text = (doc.body?.textContent || '')
          .replace(/[ \t]+/g, ' ')
          .replace(/\n\s*\n+/g, '\n')
          .trim()
          .slice(0, MAX_PAGE_CHARS);
        section.unload();
        pages.push({ pageNumber: sectionNumber, text });
      } catch {
        // A single unreadable section (e.g. an embedded SVG cover page) shouldn't fail the whole range.
        continue;
      }
    }

    const charCount = pages.reduce((n, p) => n + p.text.length, 0);
    if (charCount < MIN_TOTAL_CHARS) {
      return failure('No readable text on these pages (they may be images or markup-only sections).');
    }
    return { success: true, pages, charCount };
  } catch (err) {
    return failure((err as Error)?.message || 'Could not read the text of this book.');
  } finally {
    book.destroy();
  }
}
