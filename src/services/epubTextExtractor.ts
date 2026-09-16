import ePub, { EpubCFI } from 'epubjs';

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

/** Elements whose boundary should force a line break, so text doesn't fuse across tags like
 *  `<h1>Title</h1><p>First paragraph.</p>` -> "TitleFirst paragraph.". */
const BLOCK_TAGS = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BR', 'TR', 'TD', 'TH', 'BLOCKQUOTE',
  'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'UL', 'OL', 'TABLE', 'FIGURE', 'FIGCAPTION', 'DD', 'DT', 'HR',
]);

function failure(error: string): ExtractedRangeResult {
  return { success: false, pages: [], charCount: 0, error };
}

/**
 * Extracts readable prose from a parsed section document: strips `<style>`/`<script>` content
 * (which `.textContent` otherwise includes verbatim), falls back to `documentElement` for
 * SVG-rooted spine items (comics/poetry with no `<body>`) instead of returning nothing, and
 * inserts line breaks at block-element boundaries so adjacent tags don't fuse into one word.
 * Returns '' for a document the browser's XML parser failed on (a `<parsererror>` node) rather
 * than forwarding that parser-error text as if it were book content.
 */
function extractReadableText(doc: Document): string {
  if (doc.getElementsByTagName('parsererror').length > 0) return '';
  const root = doc.body || doc.documentElement;
  if (!root) return '';

  const clone = root.cloneNode(true) as Element;
  clone.querySelectorAll('style, script').forEach((el) => el.remove());

  const walker = doc.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
  const blockEls: Element[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (BLOCK_TAGS.has((node as Element).tagName)) blockEls.push(node as Element);
  }
  for (const el of blockEls) el.insertAdjacentText('beforebegin', '\n');

  return clone.textContent || '';
}

/**
 * Extracts text only up to a CFI position within a section — used to cut the final section of a
 * recap range off exactly where the reader stopped, instead of including the rest of the chapter
 * they never read. Returns null (caller falls back to the full section) if the CFI doesn't
 * resolve against this document.
 */
function extractTextUpToCfi(doc: Document, cfiStr: string): string | null {
  let range: Range;
  try {
    range = new EpubCFI(cfiStr).toRange(doc);
  } catch {
    return null;
  }
  if (!range) return null;

  const root = doc.body || doc.documentElement;
  if (!root) return null;

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n: Node) {
      const parent = n.parentElement;
      if (parent && (parent.tagName === 'STYLE' || parent.tagName === 'SCRIPT')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let result = '';
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node === range.endContainer) {
      result += (node.textContent || '').slice(0, range.endOffset);
      break;
    }
    const position = node.compareDocumentPosition(range.endContainer);
    // eslint-disable-next-line no-bitwise
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      result += node.textContent || '';
    } else {
      break;
    }
  }
  return result;
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
export async function extractEpubTextRange(
  fileUrl: string,
  startSection: number,
  endSection: number,
  /** Precise stop position within endSection, if known — see extractTextUpToCfi. */
  endCfi?: string | null
): Promise<ExtractedRangeResult> {
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
        let raw: string | null = null;
        if (sectionNumber === lastSection && endCfi) {
          raw = extractTextUpToCfi(doc, endCfi);
        }
        if (raw === null) raw = extractReadableText(doc);
        const text = raw
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
