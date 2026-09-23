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
function extractReadableText(doc: Document, source?: Node): string {
  if (doc.getElementsByTagName('parsererror').length > 0) return '';
  const root = source ?? doc.body ?? doc.documentElement;
  if (!root) return '';

  const clone = root.cloneNode(true) as Element | DocumentFragment;
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
 * Restricts a section to the reader's known CFI boundaries. An invalid boundary returns null
 * so the caller can fail safely instead of including unread text.
 */
function extractTextBetweenCfis(
  doc: Document,
  sectionNumber: number,
  startCfi?: string | null,
  endCfi?: string | null
): string | null {
  const root = doc.body || doc.documentElement;
  if (!root) return null;
  try {
    const point = (cfi: string) => {
      const parsed = new EpubCFI(cfi);
      if (parsed.spinePos !== sectionNumber - 1) throw new Error('CFI belongs to another section');
      const resolved = parsed.toRange(doc);
      if (!resolved) throw new Error('CFI could not be resolved');
      return resolved;
    };
    if (startCfi && endCfi && new EpubCFI().compare(startCfi, endCfi) > 0) return null;
    const range = doc.createRange();
    range.selectNodeContents(root);
    if (startCfi) {
      const start = point(startCfi);
      if (!root.contains(start.startContainer)) return null;
      range.setStart(start.startContainer, start.startOffset);
    }
    if (endCfi) {
      const end = point(endCfi);
      if (!root.contains(end.endContainer)) return null;
      range.setEnd(end.endContainer, end.endOffset);
    }
    if (range.collapsed) return '';
    return extractReadableText(doc, range.cloneContents());
  } catch {
    // An invalid stop CFI must never reveal the unread remainder of the chapter.
    return null;
  }
}

/**
 * Extracts the text of spine sections [startSection, endSection] and nothing else.
 *
 * EPUB has no fixed page like a PDF, so a "page" here is one spine item (chapter/section) —
 * the book's own natural, stable unit, 1-indexed to line up with how pages are numbered
 * everywhere else in the app. This is coarser than a PDF page, but the spoiler guard is just
 * as structural: a spine item beyond `endSection` is never loaded. When known, CFIs further
 * restrict the first and last sections to the content actually seen by the reader.
 */
export async function extractEpubTextRange(
  fileUrl: string,
  startSection: number,
  endSection: number,
  /** Precise start position within startSection, if known. */
  startCfi?: string | null,
  /** Precise stop position within endSection. Required for spoiler-safe recaps. */
  endCfi?: string | null
): Promise<ExtractedRangeResult> {
  if (!Number.isInteger(startSection) || !Number.isInteger(endSection) || startSection < 1 || endSection < startSection) {
    return failure('Invalid section range.');
  }
  if (!endCfi) return failure('This session has no precise stopping place. Reopen the book and read a little more before requesting a recap.');

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
    if (endSection > total) return failure('These pages are outside the document.');
    const lastSection = endSection;

    const pages: ExtractedPageText[] = [];
    for (let sectionNumber = startSection; sectionNumber <= lastSection; sectionNumber++) {
      const section = book.spine.get(sectionNumber - 1); // spine is 0-indexed internally
      if (!section) return failure('Could not find one of the sections in this session.');
      try {
        // epub.js resolves Section.load() to the documentElement, despite its .d.ts claiming
        // Document. The actual parsed Document lives on section.document.
        await section.load(book.load.bind(book));
        const doc = section.document;
        if (!doc || doc.getElementsByTagName('parsererror').length > 0) {
          return failure('Could not parse one of the sections in this session.');
        }
        const bounded = (sectionNumber === startSection && startCfi) || (sectionNumber === lastSection && endCfi);
        const raw = bounded
          ? extractTextBetweenCfis(doc, sectionNumber,
              sectionNumber === startSection ? startCfi : null,
              sectionNumber === lastSection ? endCfi : null)
          : extractReadableText(doc);
        if (raw === null) return failure('Could not verify the reading position for this chapter. Reopen the book and try again.');
        const normalized = raw
          .replace(/[ \t]+/g, ' ')
          .replace(/\n\s*\n+/g, '\n')
          .trim();
        const text = sectionNumber === lastSection
          ? normalized.slice(-MAX_PAGE_CHARS)
          : normalized.slice(0, MAX_PAGE_CHARS);
        section.unload();
        pages.push({ pageNumber: sectionNumber, text });
      } catch {
        return failure('Could not read one of the sections in this session.');
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
