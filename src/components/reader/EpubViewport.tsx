import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ePub, { Book as EpubBook, Rendition, Contents, Location, NavItem } from 'epubjs';
import { ConcentricPortal } from '../ConcentricPortal';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { useTapZones } from '../../hooks/useTapZones';

// epub.js's bundled RenditionOptions type omits `gap` (a real, documented rendition setting —
// see layout.js's `calculate(width, height, gap)`), so a plain object literal needs this widened
// type to pass it through `renderTo` without an excess-property error.
type EpubRenderOptions = Parameters<EpubBook['renderTo']>[1] & { gap?: number };

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
  /** Fires on every relocation with the reader's live position within the *current section* —
   *  epub.js reports this per-section pagination directly, so the progress UI can move smoothly
   *  between page turns instead of sitting frozen until a whole chapter finishes (spine sections
   *  are the only unit `currentPage`/`onPageChange` track). */
  onIntraSectionProgress?: (info: { sectionIndex: number; sectionCount: number; displayedPage: number; displayedTotal: number }) => void;
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

/** Every rule is scoped under `body.night` (the class epub.js's own `themes.select()` toggles on
 *  the iframe's <body>) so switching back to `themes.select('default')` — which only removes the
 *  class, never the injected <style> tag itself — makes these rules stop matching instead of
 *  staying latched on forever. */
const NIGHT_TEXT_SELECTOR = 'p, span, li, dd, dt, figcaption, h1, h2, h3, h4, h5, h6';
/** Containers that may carry an author-defined background (callouts, cards, tables) — forcing a
 *  light text color on them without also neutralizing their background would leave that text
 *  invisible against its own (unchanged) light box, so these get their background cleared instead
 *  of a forced color, letting the dark page background show through underneath. */
const NIGHT_CONTAINER_SELECTOR = 'div, td, th, blockquote';

function scoped(prefix: string, selectorList: string) {
  return selectorList
    .split(',')
    .map((s) => `${prefix} ${s.trim()}`)
    .join(', ');
}

const NIGHT_THEME = {
  'body.night': { background: '#18181a !important', color: '#e4e0d8 !important' },
  [scoped('body.night', NIGHT_TEXT_SELECTOR)]: { color: '#e4e0d8 !important' },
  [scoped('body.night', NIGHT_CONTAINER_SELECTOR)]: { 'background-color': 'transparent !important' },
  'body.night a': { color: '#d9a55c !important' },
};

const PAGE_TURN_MS = 140;
const TAP_ZONE_MOVE_THRESHOLD = 10;
const TAP_ZONE_DURATION_THRESHOLD = 400;
const SWIPE_THRESHOLD = 50;
const SWIPE_DURATION_MS = 350;
/** How long to wait for the theme/content hooks to finish on a newly rendered *section crossing*
 *  (via the 'rendered' event) before revealing it anyway — a safety net only, since a fresh
 *  section can take anywhere from ~100ms to well over a second to fetch and parse. Generous on
 *  purpose: firing before 'rendered' shows a flash of unstyled (non-night-mode) content, which is
 *  worse than a slightly longer fade. Same-section turns never go through animateTurn at all (see
 *  turnPrev/turnNext), so this only ever gates a real chapter load. */
const REVEAL_FALLBACK_MS = 1500;
// Long enough to coalesce a chrome-visibility toggle and the native Fullscreen transition it can
// trigger (requestImmersive) into a single resize — those two dimension changes don't always land
// in the same animation frame, and without this a toggle could still cost two destructive
// iframe resizes back to back instead of one debounced one.
const RESIZE_DEBOUNCE_MS = 250;
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
  onIntraSectionProgress,
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
  const handlersRef = useRef({ onPageChange, onLocationChange, onIntraSectionProgress, onLeftTap, onCenterTap, onRightTap, onActivity, onKeyCommand });
  useEffect(() => {
    handlersRef.current = { onPageChange, onLocationChange, onIntraSectionProgress, onLeftTap, onCenterTap, onRightTap, onActivity, onKeyCommand };
  });

  // Read inside the iframe's own event listeners (registered once, on file load), which would
  // otherwise close over the zoomScale from that render forever.
  const zoomScaleRef = useRef(zoomScale);
  useEffect(() => {
    zoomScaleRef.current = zoomScale;
  }, [zoomScale]);

  // The last spine section epub.js told us it's showing, via 'relocated'. Lets the "jump to a
  // specific section" effect below tell an internal, boundary-crossing page turn (already
  // displaying the right thing) apart from an external one (bookmark, resume, chapter select)
  // that actually needs to force a jump.
  const lastRelocatedIndexRef = useRef<number | null>(null);
  // The `navToken` this component last acted on — lets the section-jump effect below tell
  // "user re-selected the chapter already on screen" (token bumped, index unchanged; must still
  // navigate) apart from "epub.js relocated here on its own" (index unchanged, token didn't bump).
  const lastHandledNavTokenRef = useRef<number>(0);
  const spineLengthRef = useRef<number>(0);
  const currentCfiRef = useRef<string | null>(null);
  // Set right after a real swipe turns the page; consumed (and cleared) by the very next 'click'
  // event, which on mobile is the browser's synthetic click at touch-lift — a fixed time window
  // instead of this one-shot flag would also swallow a genuine tap the user makes shortly after.
  const suppressNextClickRef = useRef(false);
  // Captured on 'mousedown', before the browser clears any active selection ahead of the 'click'
  // that follows — see the click handler's selection check for why 'click' time is too late.
  const selectionAtMouseDownRef = useRef(false);
  const swipeStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  // The current section's on-screen pagination as of the last 'relocated' event — lets
  // turnPrev/turnNext tell whether the next turn will stay inside this section (instant, no fresh
  // iframe) or cross into a new one (needs the fade — see animateTurn), without waiting for the
  // turn itself to find out.
  const lastDisplayedRef = useRef<{ page: number; total: number } | null>(null);
  // Callbacks waiting on the next 'rendered' event (theme/content hooks finished) before it's
  // safe to reveal a section that was just turned to, so night-mode CSS is already applied and a
  // freshly-opened iframe's default white background never flashes through.
  const revealWaitersRef = useRef<(() => void)[]>([]);
  const resizeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clampIndex = (index: number) => {
    const max = Math.max(0, spineLengthRef.current - 1);
    return Math.min(Math.max(0, index), max);
  };

  // A quick cross-fade around a page turn — epub.js swaps content into the same iframe instantly,
  // so this is what stands in for a "turn" instead of a jarring instant cut. Always resolves (a
  // rejected `action`, e.g. a section that fails to parse, must not surface as an unhandled
  // promise rejection or leave the view stuck at opacity 0). Revealing waits for the next
  // 'rendered' event rather than firing immediately after `action` settles: epub.js resolves
  // `rendition.display()` as soon as the section's DOM is in place, before its theme/content
  // hooks (which inject the night-mode stylesheet) have actually run — revealing right away shows
  // a flash of the unstyled section first. A same-section turn never fires a fresh 'rendered'
  // (no new iframe is created), so a short fallback timer reveals it instead.
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
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      requestAnimationFrame(() => {
        if (el) el.style.opacity = '1';
      });
    };
    revealWaitersRef.current.push(reveal);
    Promise.resolve()
      .then(action)
      .catch((err) => console.warn('Page turn failed:', err))
      .finally(() => {
        setTimeout(reveal, REVEAL_FALLBACK_MS);
      });
  };

  // The single place turning happens, regardless of source (outer margin tap, iframe tap,
  // iframe keyboard, iframe swipe, or an outer keyboard shortcut via the imperative ref below) —
  // avoids the double-turn bugs that come from multiple independent paths each trying to turn.
  // Only a turn that crosses into a new spine section goes through animateTurn's fade: epub.js
  // swaps columns inside the same iframe instantly for an in-section turn (no new DOM, no
  // 'rendered' event to reveal on), so fading it out and back in adds a ~280ms blink for no
  // reason. A cross-section turn genuinely needs it — the fresh iframe starts unstyled.
  const turnPrev = () => {
    handlersRef.current.onLeftTap();
    const displayed = lastDisplayedRef.current;
    if (displayed && displayed.page > 1) {
      try {
        void renditionRef.current?.prev();
      } catch (err) {
        console.warn('Page turn failed:', err);
      }
    } else {
      animateTurn(() => renditionRef.current?.prev());
    }
  };
  const turnNext = () => {
    handlersRef.current.onRightTap();
    const displayed = lastDisplayedRef.current;
    if (displayed && displayed.page < displayed.total) {
      try {
        void renditionRef.current?.next();
      } catch (err) {
        console.warn('Page turn failed:', err);
      }
    } else {
      animateTurn(() => renditionRef.current?.next());
    }
  };

  useImperativeHandle(ref, () => ({ prev: turnPrev, next: turnNext }), []);

  const tapZoneHandlers = useTapZones(
    { onLeftTap: turnPrev, onCenterTap, onRightTap: turnNext },
    TAP_ZONE_MOVE_THRESHOLD,
    TAP_ZONE_DURATION_THRESHOLD
  );

  // Passing no arguments makes epub.js fall back to its internal `settings.width`/`height`
  // (undefined the first time resize() is ever called this way), which it then writes straight
  // into the container/iframe's inline `style.width`/`height` — wiping the 100% sizing this
  // component relies on and collapsing the column layout. Measuring and passing real pixel
  // dimensions keeps every resize() call self-contained.
  const resizeRendition = () => {
    const el = containerRef.current;
    const rendition = renditionRef.current as unknown as { resize?: (w?: number, h?: number) => void } | null;
    if (!el || !rendition?.resize) return;
    // Integer pixels (clientWidth/clientHeight), not the fractional getBoundingClientRect —
    // passing a fractional width here would make epub.js lay its columns out against that
    // fractional step while the click handler above measures the integer clientWidth, drifting
    // the two apart the same way a stale getBoundingClientRect read did before (see its comment).
    const { clientWidth: width, clientHeight: height } = el;
    if (width > 0 && height > 0) rendition.resize(width, height);
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
          // Without this, epub.js defaults to a non-zero inter-column gap (derived from the
          // viewport width) for the CSS `column-gap` it injects, but scrolls between pages by
          // the viewport width alone — the two disagree, so the on-screen page and the scroll
          // position drift further apart on every turn. A fresh iframe's own clientX (used by the
          // tap-zone handler below) is a position on that same drifting column strip, so the
          // drift also creeps the center tap zone into a turn zone within a few pages. Forcing
          // the gap to 0 keeps both in lockstep.
          gap: 0,
          allowScriptedContent: false,
        } as EpubRenderOptions);
        renditionRef.current = rendition;

        rendition.themes.register('night', NIGHT_THEME);
        rendition.themes.select(nightMode ? 'night' : 'default');
        // `fontSize`/`override` set a plain (non-!important) inline style on the section's <body>,
        // so relative author sizing (the normal case — em/%/rem headings) keeps scaling
        // proportionally from that new base instead of every element being forced to one literal
        // size, which is what wiping out heading hierarchy amounts to.
        rendition.themes.fontSize(`${Math.round(zoomScale * 100)}%`);
        rendition.themes.override('line-height', '1.5');

        rendition.on('displayerror', (err: Error) => {
          if (cancelled) return;
          setIsLoading(false);
          setLoadError('Could not display this section of the book.');
          if (onLoadError) onLoadError(err);
        });
        rendition.on('rendered', () => {
          if (cancelled) return;
          setIsLoading(false);
          const waiters = revealWaitersRef.current;
          revealWaitersRef.current = [];
          waiters.forEach((fn) => fn());
        });

        // The book-wide position after every display/next/prev, whatever triggered it. This is
        // the single source of truth for which section we're "on" — used to notify the parent
        // only when that section actually changes, and to stop the section-jump effect below
        // from re-displaying a section epub.js just navigated to on its own.
        rendition.on('relocated', (location: Location) => {
          if (cancelled) return;
          const index = location.start.index;
          if (location.start.cfi) {
            currentCfiRef.current = location.start.cfi;
            handlersRef.current.onLocationChange?.(location.start.cfi, index + 1);
          }
          if (location.start.displayed) {
            lastDisplayedRef.current = { page: location.start.displayed.page, total: location.start.displayed.total };
            handlersRef.current.onIntraSectionProgress?.({
              sectionIndex: index,
              sectionCount: spineLengthRef.current,
              displayedPage: location.start.displayed.page,
              displayedTotal: location.start.displayed.total,
            });
          }
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
          if (event.button !== 0) return; // ignore right/middle click — the browser doesn't
          // normally route these through 'click', but epub.js's own listener isn't guaranteed to
          // filter it upstream, and this is a one-line guard against a stray page turn either way.
          // The single synthetic click a real swipe's touch-lift generates on mobile — letting it
          // also run tap-zone logic would turn the page a second time, backwards.
          if (suppressNextClickRef.current) {
            suppressNextClickRef.current = false;
            return;
          }
          const targetEl = event.target as HTMLElement | null;
          // A footnote or reference link in the outer thirds must navigate, not turn the page.
          if (targetEl?.closest?.('a[href]')) return;
          // The browser collapses a text selection on `mousedown`, before `click` fires — so by
          // the time this handler runs, a click that's purely dismissing a selection always
          // reads as "nothing selected" and would otherwise fall through to a page turn. What
          // actually matters is whether there *was* a selection when this gesture started.
          if (selectionAtMouseDownRef.current) {
            selectionAtMouseDownRef.current = false;
            return;
          }
          // Must match the integer width epub.js itself laid columns out against (stage.js sizes
          // its scroll container from `container.clientWidth`, an integer, and layout.js's
          // `calculate()` uses that same integer as the page step) — NOT the fractional
          // `getBoundingClientRect().width` a flex/percentage layout can report (e.g. 812.4px).
          // Using the fractional value here used to drift the modulo below against the real,
          // integer page step by a fraction of a pixel per page, and that error is multiplied by
          // the page index: ~10 pages into a section the accumulated drift was large enough to
          // flip a dead-center tap into a left/right turn zone.
          const width = containerRef.current?.clientWidth;
          if (!width) return;
          // The section's iframe is sized to hold every one of its columns side by side (epub.js
          // expands it to `pageCount * pageWidth`, not the on-screen viewport), so `event.clientX`
          // is a position on that whole strip, not on the single visible page — e.g. on page 1 of
          // a 5-page section, tapping dead center lands around clientX ≈ 0.5 * pageWidth, which as
          // a fraction of the full 5-page-wide strip is ~0.1, always reading as the leftmost
          // third. Reducing modulo the single visible page's width recovers the on-screen tap
          // position within *that* page before computing the left/center/right zone.
          const fraction = ((event.clientX % width) + width) % width / width;
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
          const touch = event.changedTouches[0];
          if (!touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          const isDrag = Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD;
          // A real drag always ends in a synthetic 'click' at lift-off, no matter how long it
          // took or which direction it ended up not turning — leaving that click unsuppressed is
          // what let a slightly slow forward swipe fall through to the tap-zone handler and turn
          // the page backward instead.
          if (isDrag) suppressNextClickRef.current = true;
          // Zoomed in, a horizontal drag pans the enlarged text, not a turn —
          // matches the zoom check the PDF path applies to its own swipe gesture.
          if (zoomScaleRef.current > 1) return;
          const duration = Date.now() - start.t;
          if (duration >= SWIPE_DURATION_MS) return;
          const selection = contents?.window?.getSelection?.();
          if (selection && selection.toString().trim().length > 0) return;
          if (isDrag) {
            if (dx > 0) turnPrev();
            else turnNext();
          }
        });
        rendition.on('mousedown', (_event: MouseEvent, contents?: Contents) => {
          handlersRef.current.onActivity?.();
          const selection = contents?.window?.getSelection?.();
          selectionAtMouseDownRef.current = Boolean(selection && selection.toString().trim().length > 0);
        });

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
    const tokenChanged = navToken !== lastHandledNavTokenRef.current;
    lastHandledNavTokenRef.current = navToken;
    if (targetCfi) {
      animateTurn(() => rendition.display(targetCfi));
      return;
    }
    // Without the token check, re-selecting the chapter already on screen (e.g. from the chapter
    // picker while a few pages into it) would silently no-op: the spine index matches what
    // epub.js already relocated to on its own, even though the user explicitly asked to jump back
    // to its start.
    if (!tokenChanged && lastRelocatedIndexRef.current === currentPage - 1) return;
    const section = book.spine.get(clampIndex(currentPage - 1));
    if (section) animateTurn(() => rendition.display(section.href));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, navToken]);

  // Re-anchors to the CFI the reader was actually at after changing zoom: font-size changes
  // reflow every column, so without this the viewport stays at the same *scroll offset* while the
  // text underneath it has shifted — landing mid-sentence, sometimes with a line sliced across the
  // old and new column boundary.
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    rendition.themes.fontSize(`${Math.round(zoomScale * 100)}%`);
    rendition.themes.override('line-height', '1.5');
    if (currentCfiRef.current) {
      const cfi = currentCfiRef.current;
      requestAnimationFrame(() => {
        if (renditionRef.current === rendition) rendition.display(cfi);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomScale]);

  useEffect(() => {
    renditionRef.current?.themes.select(nightMode ? 'night' : 'default');
  }, [nightMode]);

  // The container can change size for reasons that never fire a window 'resize' event — chrome
  // show/hide changes only the flex child's height, and a device rotation on some browsers
  // resizes the container before (or without) a matching window event. epub.js does not observe
  // this on its own, so its column layout goes stale and clips or misjudges page breaks. Debounced
  // since a drag-resize or an animated chrome show/hide fires this repeatedly in quick succession.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
      resizeDebounceRef.current = setTimeout(resizeRendition, RESIZE_DEBOUNCE_MS);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
    };
  }, []);

  // Constant regardless of chrome visibility: the chrome now floats over the content as an
  // overlay (see ReaderScreen) rather than sharing flex space with this viewport, so varying
  // this padding by isChromeHidden would defeat that — it resizes this component's own
  // container just the same as the flex-sizing it replaced, still triggering the expensive
  // ResizeObserver → rendition.resize() → full column reflow on every chrome toggle.
  const topPadding = 'max(10px, env(safe-area-inset-top))';
  const rightPadding = 'max(10px, env(safe-area-inset-right))';
  const bottomPadding = 'max(10px, env(safe-area-inset-bottom))';
  const leftPadding = 'max(10px, env(safe-area-inset-left))';

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
