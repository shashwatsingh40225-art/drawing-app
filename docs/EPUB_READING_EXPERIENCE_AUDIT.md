# Comprehensive EPUB Reading Experience & Interaction Architecture Audit

**Document Version**: 2.0.0  
**Target Milestone**: EPUB Reading Experience & Defect Remediation  
**Date**: 2026-09-18  
**Author / Role**: Junior Dev / QA Lead / Senior Tester  
**Recipient**: Senior Core Systems Developer  
**System**: Kin Art Companion Reader Subsystem (`c:\Users\first\Desktop\drawing storing app`)  
**Scope**: End-to-end technical investigation of the EPUB reader engine, touch/click zone geometry, viewport resize dynamics, chapter boundary transitions, navigation state loops, session tracking, and recap text extraction.

---

## 1. Executive Summary & Field Tester Symptom Correlation

During recent field testing following commit `c951d6b`, QA testers reported critical degradations in the EPUB reading experience:

> *"Many times the function of tapping in the middle of page to get out of functions correctly and sometimes it doesn't, but automatically pages get changed and normal doesn't work, and even the reading experience is not smooth or maybe in working condition at all."*

Our forensic investigation confirms that the reported behavior is not an intermittent hardware anomaly, but the deterministic consequence of **five interconnected architectural and mathematical defects** currently present in the codebase:

1. **Center Tap Drift & Inversion (`event.clientX % width`)**: Coordinate math in `EpubViewport.tsx` relies on a naive modulo operation against `containerRef.current.clientWidth`. Because `epub.js` injects a non-zero CSS `column-gap` (~30px by default) into multi-column reflowable layouts, the visual page boundaries drift out of phase with the modulo divisor by 30px on every subsequent page. By page 3 or 4 of any multi-screen chapter, tapping dead center (50% screen width) evaluates to $> 66.7\%$ (next page) or $< 33.3\%$ (previous page), causing center taps to turn pages instead of toggling UI chrome.
2. **The `targetCfi` Infinite Navigation Bounce Loop**: When a book is opened with saved reading progress, `epubNav.cfi` is populated in `ReaderScreen.tsx`. When the reader advances across a chapter boundary, `onPageChange` updates `currentPage`, but `epubNav.cfi` is never cleared. `EpubViewport.tsx`'s `useEffect([currentPage, navToken])` intercepts the chapter change and unconditionally executes `rendition.display(targetCfi)`, forcibly jumping the user back to where they resumed in Chapter 1.
3. **Double Viewport Destruction on Chrome Toggle**: When a user taps center to toggle controls, `isChromeVisible` updates, altering flex container height by ~92px and viewport padding by 6px–14px. The `ResizeObserver` in `EpubViewport.tsx` triggers `rendition.resize()`, which executes `this.manager.clear()` in `epub.js`. This destroys the active iframe, flashes the screen, recalculates column breaks, and shifts the user's reading position mid-chapter. If native Fullscreen API is entered, a second resize occurs, causing two back-to-back iframe destructions.
4. **Jarring Cross-Fade Blink on Every Turn (`animateTurn`)**: Intra-section page turns trigger `animateTurn`, which forces container opacity to `0` over 140ms and waits for a 150ms fallback timeout. Instead of instantaneous column shifts, readers experience ~430ms of darkness and visual stutter on every page turn. Furthermore, cross-chapter transitions exceed 150ms, causing the view to snap back to opacity 1 before the new chapter DOM has finished applying night mode styles, creating a blinding white flash.
5. **Swipe Release Reverse Turn Race Condition**: In `EpubViewport.tsx`, touch gestures taking $\ge 350\text{ms}$ or moving $< 50\text{px}$ abort swipe recognition without asserting `suppressNextClickRef.current`. The mobile browser synthesizes a `click` event at touch lift-off; if the user dragged forward (right to left) and lifted in the left third, the click handler turns the book backward.

---

## 2. Bug Matrix & Severity Categorization

| Defect ID | Category | Severity | Primary Files | Root Cause Summary |
|---|---|:---:|---|---|
| **EPUB-REV-01** | Interaction / Tap Zones | **P0 (Blocker)** | `src/components/reader/EpubViewport.tsx` (L429–441) | `event.clientX % width` drifts out of phase due to unmodeled `column-gap`, converting center taps to page turns on pages 2+. |
| **EPUB-REV-02** | Navigation / State Machine | **P0 (Blocker)** | `src/screens/ReaderScreen.tsx` (L179, L323–335), `EpubViewport.tsx` (L538–556) | Stale `targetCfi` is never cleared; advancing chapters triggers `useEffect([currentPage])` which forcibly jumps the user back to the resume position. |
| **EPUB-REV-03** | Viewport & Layout | **P1 (Critical)** | `src/components/reader/EpubViewport.tsx` (L295–301, L580–597) | Chrome show/hide resizes container, executing `rendition.resize()` -> `this.clear()`, wiping iframe DOM and reflowing pages. |
| **EPUB-REV-04** | Animation & Rendering | **P1 (Critical)** | `src/components/reader/EpubViewport.tsx` (L241–268) | `animateTurn` fades opacity to 0 on every intra-chapter page turn for 150ms; cross-chapter turns flash unstyled white content. |
| **EPUB-REV-05** | Touch & Gestures | **P1 (Critical)** | `src/components/reader/EpubViewport.tsx` (L464–493) | Swipes taking $>350\text{ms}$ fail to suppress synthetic click, triggering reverse page turns on forward gestures. |
| **EPUB-REV-06** | Engine Sizing & Margins | **P1 (Critical)** | `src/components/reader/EpubViewport.tsx` (L347–354, L605–620) | `renderTo` omits `gap: 0`; multi-column pagination desynchronizes scroll delta from visual columns. |
| **EPUB-REV-07** | Zoom & Pan Collision | **P2 (Major)** | `src/components/reader/EpubViewport.tsx` (L476–493, L558–574) | Touch handler ignores `zoomScale > 1.0`; horizontal panning while zoomed triggers unwanted page turns. |
| **EPUB-REV-08** | Desktop UI Collision | **P2 (Major)** | `src/screens/ReaderScreen.tsx` (L631), `ReaderToolsPanel.tsx` (L141–155) | Tools panel is in-flow (320px) on desktop, resizing viewport and reflowing book text; iframe clicks do not close panel. |
| **EPUB-REV-09** | Reading Sessions | **P2 (Major)** | `src/services/readingSessionLogic.ts` (L29–33), `src/screens/ReaderScreen.tsx` (L264–271) | Section-based `currentPage` means reading 20 visual pages in one chapter records `pagesCovered = 1`, failing the 3-page meaningful threshold. |
| **EPUB-REV-10** | Text Extraction | **P2 (Major)** | `src/services/epubTextExtractor.ts` (L84–97) | `TreeWalker` fails when `range.endContainer` is an Element, truncating recap text to 0 characters. |
| **EPUB-REV-11** | Bookmark Invalidation | **P2 (Major)** | `src/screens/ReaderScreen.tsx` (L412–428, L800) | Selecting a bookmark permanently locks `targetCfi`, preventing navigation past the bookmarked chapter. |

---

## 3. In-Depth Root Cause Analyses & Technical Evidence

### 3.1 Defect EPUB-REV-01: Broken Center-Tap Zone via Erroneous Modulo Arithmetic

#### Affected Code
`src/components/reader/EpubViewport.tsx` (Lines 429–441):
```tsx
const width = containerRef.current?.getBoundingClientRect().width;
if (!width) return;
// The section's iframe is sized to hold every one of its columns side by side (epub.js
// expands it to `pageCount * pageWidth`, not the on-screen viewport), so `event.clientX`
// is a position on that whole strip, not on the single visible page...
// Reducing modulo the single visible page's width recovers the on-screen tap
// position within that page before computing the left/center/right zone.
const fraction = ((event.clientX % width) + width) % width / width;
if (fraction < 1 / 3) turnPrev();
else if (fraction > 2 / 3) turnNext();
else handlersRef.current.onCenterTap();
```

#### The Underlying Mechanism
In `node_modules/epubjs/src/layout.js` (Lines 126–128), when `gap` is not explicitly passed to the rendition, `epub.js` calculates:
```javascript
if (this.name === "reflowable" && this._flow === "paginated" && !(_gap >= 0)) {
    gap = ((section % 2 === 0) ? section : section - 1);
}
```
Where `section = Math.floor(width / 12)`. For a container width of 380px, `gap = 30px`.

In `node_modules/epubjs/src/contents.js` (Lines 1097–1098), `epub.js` injects CSS multi-column styling:
- `column-width: 380px`
- `column-gap: 30px`
- `padding-left: 15px`, `padding-right: 15px`

The spatial stride of each column page inside the expanded iframe document is:
$$\text{Stride} = \text{ColumnWidth} + \text{ColumnGap} = 380\text{px} + 30\text{px} = 410\text{px}$$

When the reader is on visual page $P$ (where $P = 1, 2, 3, 4, \dots$):
- **Page 1**: Left boundary at $0\text{px}$. Tapping center ($X = 190\text{px}$) gives `event.clientX = 190px`.
  $$\text{fraction} = \frac{190 \pmod{380}}{380} = \frac{190}{380} = 0.50 \quad (\text{Center zone: } [0.33, 0.67] \implies \text{Passes})$$
- **Page 2**: Left boundary at $410\text{px}$. Tapping center ($X = 190\text{px}$ within the visible screen) yields `event.clientX = 410 + 190 = 600px`.
  $$\text{fraction} = \frac{600 \pmod{380}}{380} = \frac{220}{380} \approx 0.579 \quad (\text{Drifted right by } 30\text{px})$$
- **Page 3**: Left boundary at $820\text{px}$. Tapping center ($X = 190\text{px}$) yields `event.clientX = 820 + 190 = 1010px`.
  $$\text{fraction} = \frac{1010 \pmod{380}}{380} = \frac{250}{380} \approx 0.658 \quad (\text{Right at the } 0.667 \text{ boundary})$$
- **Page 4**: Left boundary at $1230\text{px}$. Tapping center ($X = 190\text{px}$) yields `event.clientX = 1230 + 190 = 1420px`.
  $$\text{fraction} = \frac{1420 \pmod{380}}{380} = \frac{280}{380} \approx 0.737 \quad (> 0.667 \implies \mathbf{Next\ Page\ Turned!})$$
- **Page 5**: Left boundary at $1640\text{px}$. Tapping center yields `event.clientX = 1830px`.
  $$\text{fraction} = \frac{1830 \pmod{380}}{380} = \frac{310}{380} \approx 0.816 \quad (\mathbf{Deep\ in\ Next\ Page\ Zone!})$$
- **Later Pages**: The modulo wraps around, yielding $\text{fraction} < 0.333$, which causes a center tap to **turn backward to the previous page**!

#### Outer Padding vs. Iframe Divergence
In `EpubViewport.tsx` (Lines 605–607):
```tsx
<div
  onPointerDown={tapZoneHandlers.onPointerDown}
  onPointerUp={tapZoneHandlers.onPointerUp}
```
If a user taps on the 10px–16px outer margin/padding, the event hits the outer div. `useTapZones` evaluates:
$$\text{fraction} = \frac{e.\text{clientX} - \text{rect}.\text{left}}{\text{rect}.\text{width}}$$
This uses the true screen viewport dimensions and correctly triggers `onCenterTap()`. However, if the tap lands 5 pixels further inward on the book text, it hits the iframe and routes through `event.clientX % width`, triggering a page turn! This explains why testers observed erratic, non-reproducible behavior.

---

### 3.2 Defect EPUB-REV-02: Stale `targetCfi` Infinite Navigation Trap Loop

#### Affected Code
`src/screens/ReaderScreen.tsx` (Lines 178–179, 322–330, 671):
```tsx
// 1. Initial Load:
setCurrentCfi(hasPageParam ? null : saved?.epub_cfi ?? null);
setEpubNav({ token: 0, cfi: hasPageParam ? null : saved?.epub_cfi ?? null });

// 2. handlePageChange callback:
const handlePageChange = useCallback(
  (targetPage: number, cfi?: string | null) => {
    const clamped = Math.max(1, Math.min(totalPages || 1, targetPage));
    userNavigatedRef.current = true;
    setCurrentPage(clamped);
    if (cfi !== undefined) {
      setCurrentCfi(cfi);
      setEpubNav((n) => ({ token: n.token + 1, cfi }));
    }
    // ...
  },
  [id, totalPages, zoomScale, saveProgress, closeBridge]
);

// 3. Viewport invocation:
<EpubViewport
  targetCfi={epubNav.cfi}
  navToken={epubNav.token}
  currentPage={currentPage}
  onPageChange={handlePageChange}
/>
```

`src/components/reader/EpubViewport.tsx` (Lines 538–556):
```tsx
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
  if (!tokenChanged && lastRelocatedIndexRef.current === currentPage - 1) return;
  const section = book.spine.get(clampIndex(currentPage - 1));
  if (section) animateTurn(() => rendition.display(section.href));
}, [currentPage, navToken]);
```

#### The Execution Trace
1. User opens a book with saved reading progress at Chapter 1 (`saved.epub_cfi = "epubcfi(/6/4[ch1]!/4/2/1:0)"`).
2. `epubNav.cfi` is initialized to this string. `targetCfi` in `EpubViewport` becomes `"epubcfi(...)"`.
3. The reader turns pages within Chapter 1. Taps call `rendition.next()`.
4. The user reaches the final page of Chapter 1 and turns right.
5. `epub.js` crosses the chapter boundary into Chapter 2 (`index: 1`).
6. `rendition.on('relocated')` fires in `EpubViewport.tsx:383`:
   - `lastRelocatedIndexRef.current` updates from `0` to `1`.
   - `handlersRef.current.onPageChange(2)` is called.
7. In `ReaderScreen.tsx`, `handlePageChange(2)` executes. Because `cfi` is omitted, `cfi !== undefined` is `false`.
   - `setCurrentPage(2)` is called.
   - `epubNav.cfi` **remains populated with Chapter 1's CFI**.
8. `ReaderScreen` re-renders and passes `currentPage = 2` and `targetCfi = "epubcfi(...)"` (Chapter 1) to `EpubViewport`.
9. In `EpubViewport.tsx`, `useEffect([currentPage, navToken])` executes because `currentPage` changed from 1 to 2.
10. Line 544 executes immediately:
    ```tsx
    if (targetCfi) {
      animateTurn(() => rendition.display(targetCfi));
      return;
    }
    ```
    There is no check for `tokenChanged`, no check whether `targetCfi` was already displayed, and no check if the section matches.
11. `rendition.display(targetCfi)` forcibly reloads Chapter 1 at the resume CFI!
12. `relocated` fires again for Chapter 1, updating `currentPage` back to 1.
13. **Result**: The reader is physically prevented from advancing past the initial resume chapter. Tapping forward to Chapter 2 causes an automatic reverse flip back to Chapter 1.

---

### 3.3 Defect EPUB-REV-03: Destructive Rendition Recreation on Chrome Toggle

#### Affected Code
`src/components/reader/EpubViewport.tsx` (Lines 295–301, 580–597):
```tsx
const resizeRendition = () => {
  const el = containerRef.current;
  const rendition = renditionRef.current as unknown as { resize?: (w?: number, h?: number) => void } | null;
  if (!el || !rendition?.resize) return;
  const { width, height } = el.getBoundingClientRect();
  if (width > 0 && height > 0) rendition.resize(width, height);
};

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
```

`node_modules/epubjs/src/managers/default/index.js` (Lines 224–237):
```javascript
resize(width, height, epubcfi){
    let stageSize = this.stage.size(width, height);
    // ...
    // Clear current views
    this.clear();

    // Update for new views
    this.viewSettings.width = this._stageSize.width;
    this.viewSettings.height = this._stageSize.height;

    this.updateLayout();

    this.emit(EVENTS.MANAGERS.RESIZED, {
        width: this._stageSize.width,
        height: this._stageSize.height
    }, epubcfi);
}
```

`node_modules/epubjs/src/rendition.js` (Lines 479–481):
```javascript
if (this.location && this.location.start) {
    this.display(epubcfi || this.location.start.cfi);
}
```

#### The Chain of Failure
1. User taps the center zone to reveal the toolbar and page strip.
2. `isChromeVisible` changes from `false` to `true`.
3. In `ReaderScreen.tsx`:
   - `ReaderToolbar` (height 56px) and `ReaderPageStrip` (height 36px) mount into the flex container.
   - Root layout container switches from `position: fixed; inset: 0` to `position: relative`.
   - Main viewport height decreases by ~92px.
   - `EpubViewport.tsx` padding switches from `10px` to `24px` top, `16px` sides.
4. `containerRef.current` dimensions change.
5. The `ResizeObserver` fires and schedules `resizeRendition` after 150ms.
6. `rendition.resize(width, height)` executes.
7. `DefaultViewManager.prototype.resize` calls `this.clear()`, **completely wiping the current iframe and view from the DOM**.
8. `Rendition.prototype.onResized` catches the event and invokes `this.display(this.location.start.cfi)`.
9. The book chapter must now be re-fetched, re-parsed, re-laid-out into columns, re-injected with CSS, and re-rendered.
10. **Consequences**:
    - The screen goes blank/white for 300ms–1000ms.
    - Because available height shrank by 92px, the text reflows with fewer lines per column.
    - The previous CFI anchor may now map to a different visual column, causing the visible text to shift or jump by 1–2 pages.
    - A second tap to hide chrome reverses this, triggering a second complete view destruction and re-render.
    - If `requestImmersive()` is called on chrome hide, entering native Fullscreen changes window height again, triggering a third `resize()` cycle!

---

### 3.4 Defect EPUB-REV-04: Jarring Cross-Fade Blink on Every Turn (`animateTurn`)

#### Affected Code
`src/components/reader/EpubViewport.tsx` (Lines 241–268, 273–280):
```tsx
const animateTurn = (action: () => Promise<void> | void) => {
  const el = containerRef.current;
  if (!el) { /* ... */ return; }
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

const turnPrev = () => {
  handlersRef.current.onLeftTap();
  animateTurn(() => renditionRef.current?.prev());
};
const turnNext = () => {
  handlersRef.current.onRightTap();
  animateTurn(() => renditionRef.current?.next());
};
```

#### Why This Breaks Smooth Reading
1. In `epub.js`, an intra-section page turn (`prev()` or `next()` within the same chapter) is an instantaneous DOM operation: `this.container.scrollBy(delta, 0)`. It requires 0 network requests, 0 DOM parsing, and takes $< 2\text{ms}$.
2. `animateTurn` intercepts this and forces `el.style.opacity = '0'` with a 140ms CSS transition.
3. Because the iframe is not re-created during intra-section turns, no `rendered` event ever fires.
4. The view remains at `opacity: 0` until the `setTimeout(reveal, 150)` fallback fires.
5. Then `reveal()` restores `opacity = '1'`, which takes another 140ms ease transition to become visible.
6. The user is subjected to a jarring **430ms black blink on every single page turn**.
7. If a user taps twice in succession (skimming), callbacks pile up in `revealWaitersRef.current`, causing erratic opacity flickering.
8. Conversely, on a true chapter boundary crossing, `rendition.next()` takes 400ms–1500ms to parse the next XHTML file. The fallback timer fires at 150ms and sets `opacity = '1'` prematurely. The user sees an empty white screen while the new chapter is being parsed, followed by unstyled content before night-mode CSS attaches.

---

### 3.5 Defect EPUB-REV-05: Touch Release Synthetic Click Reverse Turns

#### Affected Code
`src/components/reader/EpubViewport.tsx` (Lines 476–493, Lines 407–442):
```tsx
rendition.on('touchend', (event: TouchEvent, contents?: Contents) => {
  const start = swipeStartRef.current;
  swipeStartRef.current = null;
  if (!start || event.touches.length > 0) return;
  const duration = Date.now() - start.t;
  if (duration >= SWIPE_DURATION_MS) return; // SWIPE_DURATION_MS = 350
  const selection = contents?.window?.getSelection?.();
  if (selection && selection.toString().trim().length > 0) return;
  const touch = event.changedTouches[0];
  if (!touch) return;
  const dx = touch.clientX - start.x;
  const dy = touch.clientY - start.y;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) { // 50px
    suppressNextClickRef.current = true;
    if (dx > 0) turnPrev();
    else turnNext();
  }
});
```

#### Failure Scenario
1. A reader on mobile touches the right side of the screen ($X = 320\text{px}$) and swipes left toward $X = 80\text{px}$ to advance to the next page.
2. The gesture takes 365ms (slightly slow swipe).
3. In `touchend`:
   - `duration = 365ms >= 350ms`.
   - The handler immediately returns without setting `suppressNextClickRef.current = true`.
   - The swipe is ignored.
4. Mobile WebKit/Blink synthesizes a `click` event at the coordinates where the finger lifted off ($X = 80\text{px}$).
5. `rendition.on('click')` catches the synthetic click:
   - `suppressNextClickRef.current` is `false`.
   - `event.clientX = 80px`.
   - Modulo math evaluates:
     $$\text{fraction} = \frac{80}{380} \approx 0.21 < \frac{1}{3}$$
   - Line 439 executes: `turnPrev()`!
6. **Result**: A forward swipe that was slightly slow causes the book to **turn backward to the previous page**!

---

### 3.6 Defect EPUB-REV-06: Missing `gap: 0` in `book.renderTo`

#### Affected Code
`src/components/reader/EpubViewport.tsx` (Lines 347–353):
```tsx
const rendition = book.renderTo(containerRef.current, {
  width: '100%',
  height: '100%',
  flow: 'paginated',
  spread: 'none',
  allowScriptedContent: false,
});
```

#### Failure Mechanism
When options omit `gap`, `epub.js` defaults to calculating an internal column gap:
```javascript
gap = ((section % 2 === 0) ? section : section - 1);
```
In paginated single-spread mode (`spread: 'none'`), `epub.js` scrolls by `this.layout.delta` (which equals container width). However, CSS columns are spaced at `container.width + gap`. On each page turn, the horizontal scroll position lags behind the true column position by an additional `gap` (30px). By page 4, lines of text are sliced vertically down the middle between columns, creating cut-off words and unreadable pages.

---

### 3.7 Defect EPUB-REV-07: Zoom Scale and Pan Collision

#### Affected Code
`src/components/reader/EpubViewport.tsx` (Lines 476–493):
The swipe handler in `EpubViewport.tsx` checks only `Math.abs(dx) > SWIPE_THRESHOLD`. Unlike `ReaderScreen.tsx:555` (which checks `if (zoomScale <= 1.0)` for PDF), `EpubViewport` performs no check against `zoomScale`. If a user increases font zoom to 150% or 200% and drags horizontally to pan across widened text, any movement $> 50\text{px}$ triggers `turnNext()` or `turnPrev()`.

---

### 3.8 Defect EPUB-REV-08: Desktop Tools Panel Viewport Squeeze

#### Affected Code
`src/screens/ReaderScreen.tsx` (Line 631):
```tsx
<div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
  {/* EpubViewport has flex: 1 */}
  {toolsOpen && (
    <ReaderToolsPanel ... />
  )}
</div>
```

`src/components/reader/ReaderToolsPanel.tsx` (Lines 141–155):
```tsx
position: isMobile ? 'fixed' : 'relative',
width: isMobile ? 'min(320px, 85vw)' : '320px',
```

On desktop viewports ($> 768\text{px}$), opening the Tools panel renders a 320px sidebar in-flow inside the flex container. `EpubViewport`'s container immediately shrinks by 320px. This triggers `ResizeObserver`, which invokes `rendition.resize()`, clears the view, destroys the iframe, and reflows all chapter text. Furthermore, because there is no backdrop on desktop, clicking inside the book content while Tools is open fails to close the panel; instead, it triggers a page turn!

---

### 3.9 Defect EPUB-REV-09: Reading Session Active Time & Meaningful Threshold Failure

#### Affected Code
`src/services/readingSessionLogic.ts` (Lines 29–33):
```typescript
/** Meaningful: at least this many new pages with at least MEANINGFUL_MIN_ACTIVE_MS of reading… */
MEANINGFUL_MIN_PAGES: 3,
MEANINGFUL_MIN_ACTIVE_MS: 2 * 60_000,
/** …or this much reading regardless of page count (a dense page or two). */
DEEP_READ_MIN_ACTIVE_MS: 6 * 60_000,
```

`src/screens/ReaderScreen.tsx` (Lines 264–271):
```tsx
useReadingSessionTracker({
  bookId: id,
  currentPage,
  enabled: Boolean(id && book && docLoaded),
  getFrontier,
  onSessionClosed: handleSessionClosed,
  onHidden: flushProgress,
});
```

Because EPUB reading sessions track coarse spine sections (`currentPage`), a user reading 15–20 visual pages within Chapter 1 is recorded as having read `pagesCovered = 1`. Unless they remain in that single chapter for a full 6 minutes (`DEEP_READ_MIN_ACTIVE_MS`), the session is flagged as `is_meaningful: false` and discarded. When the user returns after a break, no "Previously..." recap is ever offered because no meaningful session was recorded.

---

### 3.10 Defect EPUB-REV-10: Truncated Recap Extraction in `extractTextUpToCfi`

#### Affected Code
`src/services/epubTextExtractor.ts` (Lines 84–97):
```tsx
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
```

`TreeWalker` is created with `NodeFilter.SHOW_TEXT`. In standard DOM Range objects generated by `EpubCFI.toRange(doc)`, `range.endContainer` frequently resolves to an `Element` node (e.g., `<p>` or `<div>`). Because `walker` only yields `Text` nodes, `node === range.endContainer` is never true. Furthermore, when `node` is a child text node of `range.endContainer`, `compareDocumentPosition` returns `DOCUMENT_POSITION_CONTAINS` (8), which does not contain `DOCUMENT_POSITION_FOLLOWING` (4). The loop hits `else { break; }` on the very first text node and terminates, returning an empty string.

---

## 4. Senior Developer Remediation Blueprint

The following technical recommendations outline the precise architectural corrections required to achieve a production-grade reading experience:

### 4.1 Recommendation 1: Unified, Scroll-Aware Tap Zone Geometry
**Eliminate modulo math entirely.** The visible on-screen region of an `epub.js` iframe is governed by `stage.container.scrollLeft`. Taps inside the iframe should be mapped using:
```typescript
// Determine visible on-screen coordinate inside the iframe
const containerEl = (rendition as any).manager?.container;
const scrollLeft = containerEl?.scrollLeft ?? 0;
const visualPageWidth = containerEl?.clientWidth || containerRef.current?.clientWidth || 1;

// The tap coordinate within the currently visible page:
const pageX = event.clientX - scrollLeft;
const fraction = pageX / visualPageWidth;

if (fraction < 0.30) {
  turnPrev();
} else if (fraction > 0.70) {
  turnNext();
} else {
  handlersRef.current.onCenterTap();
}
```
Alternatively, configure `rendition` with `spread: 'none'` and `gap: 0`, and measure tap coordinates against `event.screenX` or the iframe's `getBoundingClientRect()`.

### 4.2 Recommendation 2: Robust Navigation State Machine & One-Shot CFI Consumption
`targetCfi` must be treated as a **one-shot navigation intent**, not persistent state:
1. When `EpubViewport` successfully navigates to `targetCfi` (or on the first `relocated` event), notify the parent via a callback (e.g. `onTargetCfiConsumed()`).
2. In `ReaderScreen.tsx`, reset `epubNav.cfi = null`.
3. In `EpubViewport.tsx`'s navigation effect:
   ```typescript
   useEffect(() => {
     if (targetCfi && navToken !== lastHandledNavTokenRef.current) {
       lastHandledNavTokenRef.current = navToken;
       rendition.display(targetCfi);
       return;
     }
     if (navToken !== lastHandledNavTokenRef.current || currentPage - 1 !== lastRelocatedIndexRef.current) {
       lastHandledNavTokenRef.current = navToken;
       const section = book.spine.get(clampIndex(currentPage - 1));
       if (section) rendition.display(section.href);
     }
   }, [currentPage, navToken, targetCfi]);
   ```
4. Update `handlePageChange` in `ReaderScreen.tsx` so that an internal chapter turn sets `epubNav.cfi = null` and increments `token`.

### 4.3 Recommendation 3: Decouple Chrome Toggling from Viewport Rendition Destruction
1. **Float Chrome Over the Viewport**: Instead of in-flow flex layout that resizes the book container on every toggle, keep the book viewport sized to `100dvh` constantly. Render `ReaderToolbar`, `ReaderPageStrip`, and `ReaderZoomStrip` as absolutely/fixed positioned overlays (`pointer-events: none` on wrapper, `pointer-events: auto` on buttons).
2. Toggling chrome visibility will then cause **zero DOM reflows**, zero resize events, and zero calls to `rendition.resize()`. Tapping center will toggle chrome with 60 FPS fluidity.
3. Debounce `ResizeObserver` only for true device rotations and window resize events, and never invoke `manager.clear()` on height-only shifts.

### 4.4 Recommendation 4: Remove Opacity Blanking on Intra-Chapter Page Turns
1. Intra-section page turns (`prev()` and `next()`) must execute instantaneously without fading the container to `opacity: 0`.
2. Apply `animateTurn` (or cross-fade opacity transitions) **only when crossing spine section boundaries** where asynchronous XML parsing occurs.
3. For chapter transitions, display a subtle loading indicator or maintain the previous section's image until the `rendered` hook completes.

### 4.5 Recommendation 5: Bulletproof Touch & Swipe State Machine
1. In `rendition.on('touchend')`, track gesture velocity and displacement.
2. If a horizontal movement exceeds 20px, **always** set `suppressNextClickRef.current = true`, regardless of whether duration exceeded 350ms, so deliberate drags never fall through to synthetic clicks.
3. Check `if (zoomScale > 1.0) return;` at the top of the touch handler to preserve horizontal panning when zoomed.

### 4.6 Recommendation 6: Pass Explicit `gap: 0` to `renderTo`
In `EpubViewport.tsx`:
```typescript
const rendition = book.renderTo(containerRef.current, {
  width: '100%',
  height: '100%',
  flow: 'paginated',
  spread: 'none',
  gap: 0, // CRITICAL: prevents cumulative multi-column spacing drift
  allowScriptedContent: false,
});
```

### 4.7 Recommendation 7: Repair Range Traversal in `extractTextUpToCfi`
In `epubTextExtractor.ts`, normalize `range.endContainer`:
```typescript
let endNode = range.endContainer;
let endOffset = range.endOffset;
if (endNode.nodeType === Node.ELEMENT_NODE) {
  const childNodes = (endNode as Element).childNodes;
  if (childNodes.length > 0) {
    endNode = childNodes[Math.min(endOffset, childNodes.length - 1)];
  }
}
```
Use `Range.intersectsNode(node)` or a normalized text range extraction to prevent premature termination.

---

## 5. Remaining Questions & Gaps

1. **iOS WebKit Iframe Viewport Auto-Expansion**: On older iOS WebKit versions (iOS 15–16), iframes with `scrolling="no"` can auto-expand to their full content height, bypassing container bounds. Testing is needed on physical iPad/iPhone devices to determine if `-webkit-overflow-scrolling: touch` or explicit `fixed` height attributes are required on the iframe element.
2. **Pre-paginated (Fixed-Layout) EPUBs**: The current reader assumes reflowable EPUBs (`flow: 'paginated'`). Manga, graphic novels, and art books often use fixed-layout EPUB 3 metadata (`rendition:layout: pre-paginated`). Further testing is required to verify whether `rendition.themes` overrides or `layout.delta` logic collision occurs on fixed-layout files.
3. **Session Meaningful Threshold for Spine Sections**: A product decision is required: Should EPUB reading sessions continue to track coarse spine sections, or should `ReadingSessionTracker` track visual on-screen page turns reported by `onIntraSectionProgress`? Tracking visual page turns would allow reading sessions in long chapters (e.g. 50-page single-file chapters) to correctly satisfy `MEANINGFUL_MIN_PAGES: 3`.
4. **Offline Service Worker / Blob Caching on Mobile PWA**: Verify whether large ArrayBuffer allocations (`fetch(fileUrl) -> arrayBuffer()`) on mobile devices with $< 3\text{GB}$ RAM cause WebKit/Blink tab drops during background/foreground switching.
