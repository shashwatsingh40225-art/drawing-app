import React, { useEffect, useRef, useState } from 'react';
import ePub, { Book as EpubBook, Rendition, Contents, Location, NavItem } from 'epubjs';
import { ConcentricPortal } from '../ConcentricPortal';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { useTapZones } from '../../hooks/useTapZones';

interface EpubViewportProps {
  fileUrl: string | null;
  /** 1-indexed spine section (EPUB has no fixed page — see epubTextExtractor.ts). Authoritative
   *  only for external navigation (resume, bookmarks, chapter select); page turns inside a
   *  section are handled internally and reported back via onPageChange. */
  currentPage: number;
  zoomScale: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  isChromeHidden?: boolean;
  nightMode?: boolean;
  /** Fires only when a page turn actually crosses into a different spine section, so callers can
   *  keep bookmarks/reading-session tracking (which is section-granular) in sync. */
  onPageChange: (page: number) => void;
  /** One title per spine section, built from the book's table of contents, for a chapter picker. */
  onChaptersLoaded?: (titles: string[]) => void;
  /** Fired on every left/right tap that turns a page, even one that doesn't cross a section —
   *  callers use this for lightweight feedback (e.g. dismissing a one-time tap hint). */
  onLeftTap: () => void;
  onCenterTap: () => void;
  onRightTap: () => void;
}

const NIGHT_THEME = {
  body: { background: '#18181a !important', color: '#e4e0d8 !important' },
  a: { color: '#d9a55c !important' },
};

const PAGE_TURN_MS = 140;

/** Depth-first flatten of the TOC, in document order. */
function flattenToc(items: NavItem[], out: { href: string; label: string }[] = []) {
  for (const item of items) {
    out.push({ href: item.href, label: item.label.trim() });
    if (item.subitems?.length) flattenToc(item.subitems, out);
  }
  return out;
}

/** One title per spine section: each TOC entry claims the spine section its href resolves to,
 *  and any section between two TOC anchors (a split content doc, an unlisted page) inherits the
 *  nearest preceding chapter's title, same as a real e-reader's chapter indicator would. */
function buildChapterTitles(book: EpubBook, spineLength: number): string[] {
  const titles: string[] = new Array(spineLength).fill('');
  for (const { href, label } of flattenToc(book.navigation.toc)) {
    const section = book.spine.get(href);
    if (section && typeof section.index === 'number' && section.index >= 0 && section.index < spineLength) {
      titles[section.index] = label;
    }
  }
  let last = '';
  return titles.map((title, i) => {
    if (title) {
      last = title;
      return title;
    }
    return last || `Section ${i + 1}`;
  });
}

/**
 * EPUB rendering via epub.js, paginated one screen at a time (like ReaderViewport's PDF pages)
 * rather than a scrolling document. `currentPage` (a spine section) stays the unit that
 * bookmarks, reading sessions, and the recap spoiler guard track, but within a section the
 * reader can have several real on-screen pages; tapping/arrow-keying moves one screen at a time
 * via epub.js's own book-wide next()/prev(), which crosses section boundaries on its own —
 * onPageChange only fires when that crossing actually happens, to keep the coarser section
 * tracking in sync without recording every intra-section page turn as a "page change".
 */
export const EpubViewport: React.FC<EpubViewportProps> = ({
  fileUrl,
  currentPage,
  zoomScale,
  onLoadSuccess,
  onLoadError,
  isChromeHidden = false,
  nightMode = false,
  onPageChange,
  onChaptersLoaded,
  onLeftTap,
  onCenterTap,
  onRightTap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const tapZoneHandlers = useTapZones({ onLeftTap, onCenterTap, onRightTap });

  // epub.js renders each section into its own iframe, a separate browsing context whose clicks,
  // touches and keypresses never bubble to the outer div — so useTapZones above only ever sees
  // taps that land on the padding around the iframe, never on the book text itself. Kept fresh by
  // a ref since the mount effect below (which wires the iframe-side listeners) only re-runs when
  // the file changes, not on every render.
  const handlersRef = useRef({ onPageChange, onLeftTap, onCenterTap, onRightTap });
  useEffect(() => {
    handlersRef.current = { onPageChange, onLeftTap, onCenterTap, onRightTap };
  });

  // The last spine section epub.js told us it's showing, via 'relocated'. Lets the "jump to a
  // specific section" effect below tell an internal, boundary-crossing page turn (already
  // displaying the right thing) apart from an external one (bookmark, resume, chapter select)
  // that actually needs to force a jump.
  const lastRelocatedIndexRef = useRef<number | null>(null);

  // A quick cross-fade around a page turn — epub.js swaps content into the same iframe instantly,
  // so this is what stands in for a "turn" instead of a jarring instant cut.
  const animateTurn = (action: () => Promise<void> | void) => {
    const el = containerRef.current;
    if (!el) return void action();
    el.style.transition = `opacity ${PAGE_TURN_MS}ms ease`;
    el.style.opacity = '0';
    Promise.resolve(action()).finally(() => {
      requestAnimationFrame(() => {
        if (el) el.style.opacity = '1';
      });
    });
  };

  // Open the book and mount the rendition. Re-runs only when the file or an explicit retry changes.
  useEffect(() => {
    if (!fileUrl || !containerRef.current) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    lastRelocatedIndexRef.current = null;

    // epub.js's own URL-fetching (ePub(url)) silently hangs forever on a blob: URL (our
    // IndexedDB demo-mode cache path) and is extension-sniffed for everything else — fetching
    // the bytes ourselves and handing epub.js an ArrayBuffer sidesteps its request layer
    // entirely. Same fix in spirit as disabling range/stream fetching for the PDF path.
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not download this book (HTTP ${res.status}).`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        const book = ePub(buffer);
        bookRef.current = book;
        return book.ready.then(() => book);
      })
      .then((book) => {
        if (cancelled || !book || !containerRef.current) return;
        // epub.js's bundled .d.ts omits `Spine.length`, though it's set at runtime in spine.js.
        const spineLength = (book.spine as unknown as { length: number }).length ?? 0;
        onLoadSuccess(spineLength);
        if (onChaptersLoaded) onChaptersLoaded(buildChapterTitles(book, spineLength));

        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;

        rendition.themes.register('night', NIGHT_THEME);
        rendition.themes.select(nightMode ? 'night' : 'default');
        rendition.themes.fontSize(`${Math.round(100 * zoomScale)}%`);

        rendition.on('displayerror', (err: Error) => {
          if (cancelled) return;
          setIsLoading(false);
          setLoadError('Could not display this section of the book.');
          if (onLoadError) onLoadError(err);
        });
        rendition.on('rendered', () => {
          if (!cancelled) setIsLoading(false);
        });

        // The book-wide position after every display/next/prev, whatever triggered it. This is
        // the single source of truth for which section we're "on" — used to notify the parent
        // only when that section actually changes, and to stop the section-jump effect below
        // from re-displaying a section epub.js just navigated to on its own.
        rendition.on('relocated', (location: Location) => {
          const index = location.start.index;
          if (cancelled || index === lastRelocatedIndexRef.current) return;
          const isFirstLocation = lastRelocatedIndexRef.current === null;
          lastRelocatedIndexRef.current = index;
          if (!isFirstLocation) handlersRef.current.onPageChange(index + 1);
        });

        // Re-implement tap zones for clicks that land inside the section's iframe (see
        // handlersRef comment above). epub.js forwards the iframe's native DOM events onto the
        // rendition itself, `contents` being the Contents wrapper for the iframe that was clicked.
        // A tap turns one on-screen page via next()/prev(), which epub.js carries across a
        // section boundary on its own — 'relocated' above is what tells the parent about it.
        rendition.on('click', (event: MouseEvent, contents?: Contents) => {
          const selection = contents?.window?.getSelection?.();
          if (selection && selection.toString().trim().length > 0) return;
          const width = contents?.window?.innerWidth;
          if (!width) return;
          const fraction = event.clientX / width;
          if (fraction < 1 / 3) {
            handlersRef.current.onLeftTap();
            animateTurn(() => renditionRef.current?.prev());
          } else if (fraction > 2 / 3) {
            handlersRef.current.onRightTap();
            animateTurn(() => renditionRef.current?.next());
          } else {
            handlersRef.current.onCenterTap();
          }
        });

        // Same story for the keyboard shortcut in ReaderScreen: its window-level listener only
        // fires while the outer document has focus, which stops being true the moment the user
        // clicks into the iframe's content.
        rendition.on('keydown', (event: KeyboardEvent) => {
          if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
            event.preventDefault();
            handlersRef.current.onLeftTap();
            animateTurn(() => renditionRef.current?.prev());
          } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
            event.preventDefault();
            handlersRef.current.onRightTap();
            animateTurn(() => renditionRef.current?.next());
          }
        });

        const target = book.spine.get(Math.max(0, currentPage - 1));
        return rendition.display(target ? target.href : undefined);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setIsLoading(false);
        setLoadError(err?.message || 'This EPUB file could not be opened. It may be corrupted or unsupported.');
        if (onLoadError) onLoadError(err);
      });

    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      renditionRef.current = null;
      bookRef.current?.destroy();
      bookRef.current = null;
    };
    // Only the file itself (and an explicit retry) should tear down and recreate the rendition;
    // page/zoom/night-mode changes are handled by the effects below on the live instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, reloadKey]);

  // Jump to an externally-requested section (bookmark, resume, chapter select, or the keyboard
  // handler in ReaderScreen firing while focus is outside the iframe). Skipped when epub.js just
  // relocated there itself (an in-section or cross-section next()/prev()), so it doesn't undo an
  // in-progress page turn by re-displaying that section's first page.
  useEffect(() => {
    const rendition = renditionRef.current;
    const book = bookRef.current;
    if (!rendition || !book) return;
    if (lastRelocatedIndexRef.current === currentPage - 1) return;
    const section = book.spine.get(Math.max(0, currentPage - 1));
    if (section) animateTurn(() => rendition.display(section.href));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${Math.round(100 * zoomScale)}%`);
  }, [zoomScale]);

  useEffect(() => {
    renditionRef.current?.themes.select(nightMode ? 'night' : 'default');
  }, [nightMode]);

  const topPadding = isChromeHidden ? '10px' : '24px';
  const sidePadding = isChromeHidden ? '10px' : '16px';
  const bottomPadding = isChromeHidden ? '10px' : '16px';

  return (
    <div
      onPointerDown={tapZoneHandlers.onPointerDown}
      onPointerUp={tapZoneHandlers.onPointerUp}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: nightMode ? '#18181a' : 'var(--color-background)',
        padding: `${topPadding} ${sidePadding} ${bottomPadding} ${sidePadding}`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {fileUrl ? (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
          <BookOpen size={40} style={{ opacity: 0.5, marginBottom: '12px' }} />
          <div>No EPUB file provided for this book.</div>
        </div>
      )}

      {isLoading && fileUrl && !loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            backgroundColor: nightMode ? '#18181a' : 'var(--color-background)',
          }}
        >
          <ConcentricPortal size={70} />
          <span style={{ fontSize: '0.88rem', color: 'var(--color-primary)' }}>Opening chapter…</span>
        </div>
      )}

      {loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <AlertCircle size={36} color="var(--color-error)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', margin: '0 0 8px 0' }}>
              Unable to display this book
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
