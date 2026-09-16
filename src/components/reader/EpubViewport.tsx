import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ePub, { Book as EpubBook, Rendition, Contents, Location, NavItem } from 'epubjs';
import { ConcentricPortal } from '../ConcentricPortal';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { useTapZones } from '../../hooks/useTapZones';

export interface EpubViewportHandle {
  /** Turn one on-screen page backward/forward — the single source of truth for turning, used by
   *  the parent when a page-turn is requested from outside this component (e.g. a keyboard
   *  shortcut firing while focus is on the outer chrome, not the book's own iframe). */
  prev: () => void;
  next: () => void;
}

interface EpubViewportProps {
  fileUrl: string | null;
  /** 1-indexed spine section (EPUB has no fixed page — see epubTextExtractor.ts). Authoritative
   *  only for external navigation (resume, bookmarks, chapter select); page turns inside a
   *  section are handled internally and reported back via onPageChange. */
  currentPage: number;
  /** Precise epub.js CFI to jump to instead of the plain start of `currentPage`'s section —
   *  used for exact resume and precise bookmarks. Paired with `navToken`: incrementing the
   *  token forces the jump even when `currentPage` itself didn't change (e.g. a bookmark inside
   *  the section already on screen). */
  targetCfi?: string | null;
  navToken?: number;
  zoomScale: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  isChromeHidden?: boolean;
  nightMode?: boolean;
  /** Fires only when a page turn actually crosses into a different spine section, so callers can
   *  keep bookmarks/reading-session tracking (which is section-granular) in sync. */
  onPageChange: (page: number) => void;
  /** Fires on every relocation, including intra-section moves, with the precise CFI reached —
   *  for exact resume position and the recap spoiler guard. */
  onLocationChange?: (cfi: string, page: number) => void;
  /** One title per spine section, built from the book's table of contents, for a chapter picker. */
  onChaptersLoaded?: (titles: string[]) => void;
  /** Fired on every left/right tap that turns a page, even one that doesn't cross a section —
   *  callers use this for lightweight feedback (e.g. dismissing a one-time tap hint). */
  onLeftTap: () => void;
  onCenterTap: () => void;
  onRightTap: () => void;
  /** Any interaction inside the book's iframe (tap, key, touch) — iframe events never bubble to
   *  the outer window, so callers that track reading activity on window/document listeners need
   *  this to notice iframe-only activity. */
  onActivity?: () => void;
  /** A key the iframe's own keydown listener saw but doesn't handle itself (turning is handled
   *  internally) — e.g. 'b', '+', '-', '0', 'Escape' — forwarded so shortcuts still work while
   *  focus is inside the book's iframe rather than the outer document. */
  onKeyCommand?: (key: string) => void;
}

// Broad, !important selectors so these overrides win over an EPUB's own author CSS even when it
// targets specific elements (e.g. `p { color: #222 }`), which a plain override on `body` alone
// cannot beat — inheritance always loses to any rule specified directly on the element.
const ZOOM_NIGHT_SELECTOR =
  'body, p, div, span, li, td, th, blockquote, dd, dt, figcaption, a, h1, h2, h3, h4, h5, h6';

const NIGHT_THEME = {
  'html, body': { background: '#18181a !important', color: '#e4e0d8 !important' },
  [ZOOM_NIGHT_SELECTOR]: { color: '#e4e0d8 !important' },
  a: { color: '#d9a55c !important' },
};

/** `rem` (root-relative) rather than `%`/`em` avoids runaway compounding when the same broad
 *  selector matches nested elements (a `div` inside a `div` inside a `p`, etc.), and a unitless
 *  line-height scales proportionally with whatever font-size ends up applied. */
function zoomRules(scale: number) {
  return {
    [ZOOM_NIGHT_SELECTOR]: {
      'font-size': `${scale}rem !important`,
      'line-height': '1.5 !important',
    },
  };
}

const PAGE_TURN_MS = 140;
const TAP_ZONE_MOVE_THRESHOLD = 10;
const TAP_ZONE_DURATION_THRESHOLD = 400;
const SWIPE_THRESHOLD = 50;
const SWIPE_DURATION_MS = 350;
/** Mobile browsers fire a synthetic 'click' at touch-lift coordinates after a swipe; suppressing
 *  the click-driven tap-zone logic for this long after a recognized swipe stops that synthetic
 *  click from re-triggering navigation (often backward — see EPUB-029). */
const POST_SWIPE_CLICK_SUPPRESS_MS = 500;
const COMMAND_KEYS = new Set(['+', '=', '-', '_', '0', 'b', 'B', 'Escape']);

/** Depth-first flatten of the TOC, in document order. Defensive against a missing/malformed
 *  navigation object (no NCX/NAV document, or a parse failure) instead of throwing. */
function flattenToc(items: NavItem[] | undefined | null, out: { href: string; label: string }[] = []) {
  if (!Array.isArray(items)) return out;
  for (const item of items) {
    if (!item || typeof item.href !== 'string') continue;
    out.push({ href: item.href, label: (item.label ?? '').trim() });
    if (Array.isArray(item.subitems) && item.subitems.length) flattenToc(item.subitems, out);
  }
  return out;
}

/** `spine.get(href)` only matches an exact, already-resolved href. A TOC document living in a
 *  subdirectory can carry relative hrefs (`../text/ch01.xhtml`) that don't match the spine's own
 *  normalized keys — fall back to matching by filename alone rather than losing the chapter. */
function resolveSpineSection(book: EpubBook, href: string) {
  const direct = book.spine.get(href);
  if (direct) return direct;
  const filename = href.split('#')[0].split('/').pop();
  if (!filename) return null;
  const items = (book.spine as unknown as { spineItems?: { href: string; index: number }[] }).spineItems;
  const match = items?.find((it) => it.href.split('/').pop() === filename);
  return match ? book.spine.get(match.href) : null;
}

/** One title per spine section: each TOC entry claims the spine section its href resolves to,
 *  and any section between two TOC anchors (a split content doc, an unlisted page) inherits the
 *  nearest preceding chapter's title, same as a real e-reader's chapter indicator would. The
 *  first TOC entry to claim a section wins — a later subheading anchored in the same document
 *  (e.g. `ch01.xhtml#part2`) must not overwrite the chapter's own title. */
function buildChapterTitles(book: EpubBook, spineLength: number): string[] {
  const titles: string[] = new Array(spineLength).fill('');
  for (const { href, label } of flattenToc(book.navigation?.toc)) {
    if (!label) continue;
    const section = resolveSpineSection(book, href);
    if (section && typeof section.index === 'number' && section.index >= 0 && section.index < spineLength) {
      if (!titles[section.index]) titles[section.index] = label;
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

/** Safe wrapper around buildChapterTitles: a malformed TOC must degrade to generic section
 *  labels, never abort loading the book itself. */
function safeBuildChapterTitles(book: EpubBook, spineLength: number): string[] {
  try {
    return buildChapterTitles(book, spineLength);
  } catch {
    return Array.from({ length: spineLength }, (_, i) => `Section ${i + 1}`);
  }
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
export const EpubViewport = forwardRef<EpubViewportHandle, EpubViewportProps>(({
  fileUrl,
  currentPage,
  targetCfi = null,
  navToken = 0,
  zoomScale,
  onLoadSuccess,
  onLoadError,
  isChromeHidden = false,
  nightMode = false,
  onPageChange,
  onLocationChange,
  onChaptersLoaded,
  onLeftTap,
  onCenterTap,
  onRightTap,
  onActivity,
  onKeyCommand,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // epub.js renders each section into its own iframe, a separate browsing context whose clicks,
  // touches and keypresses never bubble to the outer div — so the outer tap zone below only ever
  // sees taps that land on the padding around the iframe, never on the book text itself. Kept
  // fresh by a ref since the mount effect below (which wires the iframe-side listeners) only
  // re-runs when the file changes, not on every render.
  const handlersRef = useRef({ onPageChange, onLocationChange, onLeftTap, onCenterTap, onRightTap, onActivity, onKeyCommand });
  useEffect(() => {
    handlersRef.current = { onPageChange, onLocationChange, onLeftTap, onCenterTap, onRightTap, onActivity, onKeyCommand };
  });

  // The last spine section epub.js told us it's showing, via 'relocated'. Lets the "jump to a
  // specific section" effect below tell an internal, boundary-crossing page turn (already
  // displaying the right thing) apart from an external one (bookmark, resume, chapter select)
  // that actually needs to force a jump.
  const lastRelocatedIndexRef = useRef<number | null>(null);
  const spineLengthRef = useRef<number>(0);
  const lastSwipeAtRef = useRef<number>(0);
  const swipeStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const clampIndex = (index: number) => {
    const max = Math.max(0, spineLengthRef.current - 1);
    return Math.min(Math.max(0, index), max);
  };

  // A quick cross-fade around a page turn — epub.js swaps content into the same iframe instantly,
  // so this is what stands in for a "turn" instead of a jarring instant cut. Always resolves (a
  // rejected `action`, e.g. a section that fails to parse, must not surface as an unhandled
  // promise rejection or leave the view stuck at opacity 0).
  const animateTurn = (action: () => Promise<void> | void) => {
    const el = containerRef.current;
    if (!el) {
      try {
        void action();
      } catch (err) {
        console.warn('Page turn failed:', err);
      }
      return;
    }
    el.style.transition = `opacity ${PAGE_TURN_MS}ms ease`;
    el.style.opacity = '0';
    Promise.resolve()
      .then(action)
      .catch((err) => console.warn('Page turn failed:', err))
      .finally(() => {
        requestAnimationFrame(() => {
          if (el) el.style.opacity = '1';
        });
      });
  };

  // The single place turning happens, regardless of source (outer margin tap, iframe tap,
  // iframe keyboard, iframe swipe, or an outer keyboard shortcut via the imperative ref below) —
  // avoids the double-turn bugs that come from multiple independent paths each trying to turn.
  const turnPrev = () => {
    handlersRef.current.onLeftTap();
    animateTurn(() => renditionRef.current?.prev());
  };
  const turnNext = () => {
    handlersRef.current.onRightTap();
    animateTurn(() => renditionRef.current?.next());
  };

  useImperativeHandle(ref, () => ({ prev: turnPrev, next: turnNext }), []);

  const tapZoneHandlers = useTapZones(
    { onLeftTap: turnPrev, onCenterTap, onRightTap: turnNext },
    TAP_ZONE_MOVE_THRESHOLD,
    TAP_ZONE_DURATION_THRESHOLD
  );

  const resizeRendition = () => {
    (renditionRef.current as unknown as { resize?: (w?: number, h?: number) => void } | null)?.resize?.();
  };

  // Open the book and mount the rendition. Re-runs only when the file or an explicit retry changes.
  useEffect(() => {
    if (!fileUrl || !containerRef.current) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    lastRelocatedIndexRef.current = null;
    spineLengthRef.current = 0;
    // Captured once, at the render that opened this file — the position to restore to, if any.
    const openCfi = targetCfi;

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
        if (cancelled) {
          // The component unmounted (or the file changed again) while this book was still
          // opening — release it even though nothing here ever displayed it.
          try {
            book?.destroy();
          } catch {
            // already torn down
          }
          return;
        }
        if (!book || !containerRef.current) return;
        // epub.js's bundled .d.ts omits `Spine.length`, though it's set at runtime in spine.js.
        const spineLength = (book.spine as unknown as { length: number }).length ?? 0;
        spineLengthRef.current = spineLength;
        onLoadSuccess(spineLength);
        if (onChaptersLoaded) onChaptersLoaded(safeBuildChapterTitles(book, spineLength));

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
        rendition.themes.registerRules('default', zoomRules(zoomScale));

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
          if (cancelled) return;
          const index = location.start.index;
          if (location.start.cfi) handlersRef.current.onLocationChange?.(location.start.cfi, index + 1);
          if (index === lastRelocatedIndexRef.current) return;
          const isFirstLocation = lastRelocatedIndexRef.current === null;
          lastRelocatedIndexRef.current = index;
          if (!isFirstLocation) handlersRef.current.onPageChange(index + 1);
        });

        // Re-implement tap zones for clicks that land inside the section's iframe (see
        // handlersRef comment above). epub.js forwards the iframe's native DOM events onto the
        // rendition itself, `contents` being the Contents wrapper for the iframe that was clicked.
        rendition.on('click', (event: MouseEvent, contents?: Contents) => {
          handlersRef.current.onActivity?.();
          // A synthetic click follows a recognized swipe on mobile at the touch-lift coordinates —
          // letting it also run tap-zone logic can turn the page a second time, backwards.
          if (Date.now() - lastSwipeAtRef.current < POST_SWIPE_CLICK_SUPPRESS_MS) return;
          const targetEl = event.target as HTMLElement | null;
          // A footnote or reference link in the outer thirds must navigate, not turn the page.
          if (targetEl?.closest?.('a[href]')) return;
          const selection = contents?.window?.getSelection?.();
          if (selection && selection.toString().trim().length > 0) return;
          const width = contents?.window?.innerWidth;
          if (!width) return;
          const fraction = event.clientX / width;
          if (fraction < 1 / 3) turnPrev();
          else if (fraction > 2 / 3) turnNext();
          else handlersRef.current.onCenterTap();
        });

        // Same story for the keyboard shortcut in ReaderScreen: its window-level listener only
        // fires while the outer document has focus, which stops being true the moment the user
        // clicks into the iframe's content. Non-navigation shortcuts (bookmark, zoom, escape) are
        // forwarded to the parent instead of being dead while focus is inside the book.
        rendition.on('keydown', (event: KeyboardEvent) => {
          handlersRef.current.onActivity?.();
          if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
            event.preventDefault();
            turnPrev();
          } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
            event.preventDefault();
            turnNext();
          } else if (COMMAND_KEYS.has(event.key)) {
            event.preventDefault();
            handlersRef.current.onKeyCommand?.(event.key);
          }
        });

        // Touch-only activity (no click/keydown) — e.g. a long-press or a swipe that ends outside
        // any tap zone — still counts as reading activity for the session tracker.
        rendition.on('touchstart', (event: TouchEvent) => {
          handlersRef.current.onActivity?.();
          if (event.touches.length !== 1) {
            swipeStartRef.current = null;
            return;
          }
          const t = event.touches[0];
          swipeStartRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
        });
        rendition.on('touchmove', (event: TouchEvent) => {
          if (event.touches.length > 1) swipeStartRef.current = null;
        });
        rendition.on('touchend', (event: TouchEvent, contents?: Contents) => {
          const start = swipeStartRef.current;
          swipeStartRef.current = null;
          if (!start || event.touches.length > 0) return;
          const duration = Date.now() - start.t;
          if (duration >= SWIPE_DURATION_MS) return;
          const selection = contents?.window?.getSelection?.();
          if (selection && selection.toString().trim().length > 0) return;
          const touch = event.changedTouches[0];
          if (!touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
            lastSwipeAtRef.current = Date.now();
            if (dx > 0) turnPrev();
            else turnNext();
          }
        });
        rendition.on('mousedown', () => handlersRef.current.onActivity?.());

        const startIndex = clampIndex(currentPage - 1);
        const target = book.spine.get(startIndex);
        return rendition.display(openCfi || (target ? target.href : undefined));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setIsLoading(false);
        setLoadError(err?.message || 'This EPUB file could not be opened. It may be corrupted or unsupported.');
        if (onLoadError) onLoadError(err);
      });

    return () => {
      cancelled = true;
      const rendition = renditionRef.current;
      const book = bookRef.current;
      renditionRef.current = null;
      bookRef.current = null;
      try {
        rendition?.destroy();
      } catch {
        // already torn down
      }
      try {
        book?.destroy();
      } catch {
        // already torn down
      }
    };
    // Only the file itself (and an explicit retry) should tear down and recreate the rendition;
    // page/zoom/night-mode changes are handled by the effects below on the live instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, reloadKey]);

  // Jump to an externally-requested position (bookmark, resume, chapter select). Skipped when
  // epub.js just relocated there itself (an in-section or cross-section next()/prev()) and no
  // precise CFI was requested, so it doesn't undo an in-progress page turn by re-displaying that
  // section's first page. `navToken` forces the jump even when `currentPage` alone didn't change
  // (e.g. a bookmark inside the section already on screen).
  useEffect(() => {
    const rendition = renditionRef.current;
    const book = bookRef.current;
    if (!rendition || !book) return;
    if (targetCfi) {
      animateTurn(() => rendition.display(targetCfi));
      return;
    }
    if (lastRelocatedIndexRef.current === currentPage - 1) return;
    const section = book.spine.get(clampIndex(currentPage - 1));
    if (section) animateTurn(() => rendition.display(section.href));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, navToken]);

  useEffect(() => {
    renditionRef.current?.themes.registerRules('default', zoomRules(zoomScale));
  }, [zoomScale]);

  useEffect(() => {
    renditionRef.current?.themes.select(nightMode ? 'night' : 'default');
  }, [nightMode]);

  // The container can change size for reasons that never fire a window 'resize' event — chrome
  // show/hide changes only the flex child's height, and a device rotation on some browsers
  // resizes the container before (or without) a matching window event. epub.js does not observe
  // this on its own, so its column layout goes stale and clips or misjudges page breaks.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => resizeRendition());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const topPadding = isChromeHidden ? 'max(10px, env(safe-area-inset-top))' : '24px';
  const rightPadding = isChromeHidden ? 'max(10px, env(safe-area-inset-right))' : '16px';
  const bottomPadding = isChromeHidden ? 'max(10px, env(safe-area-inset-bottom))' : '16px';
  const leftPadding = isChromeHidden ? 'max(10px, env(safe-area-inset-left))' : '16px';

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
        padding: `${topPadding} ${rightPadding} ${bottomPadding} ${leftPadding}`,
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
});

EpubViewport.displayName = 'EpubViewport';
