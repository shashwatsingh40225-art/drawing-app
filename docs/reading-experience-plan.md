# Reading Experience Plan — Handoff

Follow-on planning session to [`reader-redesign-handoff.md`](reader-redesign-handoff.md). That
session settled the Reader's *structure* (chrome, navigation, panels) and explicitly deferred
visual design and any net-new capabilities. This session picks those back up now that a design
asset kit exists and EPUB has shipped. **No implementation code has been touched in this session
either** — this is the plan; a fresh session executes it.

Read, in order: [`CONTEXT.md`](../CONTEXT.md), `docs/adr/0001`–`0003`, `reader-redesign-handoff.md`,
then this document.

## Scope

**In scope:** reader correctness fixes, motion/feel, EPUB capability gaps, and a defined slice of
new capabilities — filtered by one rule the user set explicitly: **add a capability only if it
genuinely enhances the reading experience; don't add something just because it's addable.**

**Explicitly out of scope (decided, not just unstarted):**
- The 3 app-wide blockers in `mobile_audit_report.md` (nav header overflow, `ArtworkDetailScreen`
  two-column layout blowout, `ProcessingScreen` landscape trap) — not reader-specific, left for a
  separate pass.
- Text-to-speech — bigger lift than the rest of this list, no existing infrastructure, not what
  motivated this plan.
- A separate "highlight" annotation type distinct from Pin — see Decision 2 below.
- The Library screen — still deferred per the prior handoff; unchanged by this session.
- Commissioning new hand-drawn-style icons for reader chrome — see Decision 1.

## Decision 1 — Design asset kit: what it is and how to use it

The user provided `C:\Users\first\Desktop\drawing and read design sys\Design artifacts from
sketches\` (outside this repo — nothing from it has been copied in yet). Contents: a brand mark (2
variants), 2 general-purpose icons (eye orb, claw), 2 loading motifs (spiral, concentric discs), 9
illustrations, 2 tileable patterns, and `assets/asset-catalog.json` documenting intended use per
asset. The palette in that catalog is **byte-identical** to what's already in `src/index.css` — no
reconciliation needed.

**What it is not**: a reader-chrome icon set (no search/bookmark/pin/TOC/zoom/night-mode icons
exist in it), and every asset is a raster PNG, not a vector (the catalog itself flags this and
suggests vectorization as a future follow-up — not part of this plan).

**Decision**: keep `lucide-react` for all reader-chrome controls (bookmark, pin, search, zoom,
TOC, back, night-mode). Reserve the asset-kit illustrations/motifs/patterns for the uses the
catalog itself already earmarks — empty states, error states, splash/About, loading backdrops —
not for small functional buttons. `ConcentricPortal.tsx` already does this correctly (a hand-coded
SVG rendition of the "concentric discs" motif, ART-12) — use it as the reference pattern for any
new motif-based visual, rather than embedding the raster PNGs directly where a vector/animatable
version would look better.

Concrete design applications for this pass:
1. Reader empty/error states get the catalog's earmarked illustrations instead of plain
   text/icon placeholders — "Crane in top hat" (`art-01-card.png`) for empty states ("no
   bookmarks yet", "no pins yet"), "Mushroom creature" (`art-09-card.png`) for load/parse
   failures.
2. Reserve `--color-accent-teal` (`#2E8B72`, currently used almost nowhere) for reader-only
   "found/active" moments: search match highlighting (Decision 4, item 8 below), the active
   Tools-panel item.
3. Low-opacity pattern backdrop (`pattern-feather.png` / `pattern-rings.png`, 5–8% opacity — the
   catalog's own stated usage) behind the Tools panel and/or Memory Bridge card.
4. The page-turn transition (Decision 3) may take a subtle visual cue from the same hand-coded
   motif linework `ConcentricPortal` already uses, as a stretch goal — not blocking.

## Decision 2 — Pin stays, with a specific bug fixed

Pin (positioned note or Kin Archive reference, x/y on a page) stays as-is conceptually — it's a
stated product differentiator (`PRODUCT_ONE_PAGER.md`) and the user confirmed keeping it rather
than simplifying or cutting it. No separate "highlight" annotation type is being added; Pin remains
the one annotation mechanism.

**Diagnosed bug** (found by reading the code, not by reproduction): in
[`ReaderScreen.tsx:431-462`](../src/screens/ReaderScreen.tsx#L431) `handlePlacePin` creates the
annotation immediately on tap with placeholder content — literally `"Observation on page " +
currentPage` for a note pin — and nothing opens the editor afterward.
[`AnnotationOverlay.tsx`](../src/components/reader/AnnotationOverlay.tsx)'s `activeAnnotationId`
(which controls the edit popover) is local state with no prop letting a parent force it open. The
result: tapping once to place a note leaves a pin permanently labeled "Observation on page 5"
unless the user knows to tap it again.

**Decision**: auto-open the text editor immediately after a note pin is placed, so placing and
writing are one continuous motion. Implementation shape: lift `activeAnnotationId` (or add an
`autoEditId` prop) so `ReaderScreen` can tell `AnnotationOverlay` "open the editor for the
annotation `handlePlacePin` just created" using the returned `newAnn.id`. Archive-ref pins don't
need this (their content is the archive title, not free text) — only the `type === 'note'` path.

## Decision 3 — PDF/EPUB parity (see [ADR 0003](adr/0003-pdf-epub-feature-parity.md))

Both formats are fully first-class going forward; neither leads. A capability gap between them is
a gap to close, not a difference to preserve.

## Decision 4 — Prioritized backlog

Ordering: **correctness → feel → new capabilities → visual polish**, per the user's own stated
priority (a broken/jank experience undermines trust more than missing polish), with "we have
time" meaning thoroughness over speed, not a license to reorder for convenience.

### Phase 1 — Correctness
5. Fix Pin note placement per Decision 2.
6. **EPUB-007** — [`EpubViewport.tsx:318-321`](../src/components/reader/EpubViewport.tsx#L318)
   loads the entire EPUB file into one in-memory `ArrayBuffer` via `fetch(fileUrl).arrayBuffer()`.
   Fine for small files, a real memory-spike/crash risk on large ones. Fix: open via URL/streaming
   instead of a full in-memory buffer (check whether the epub.js version in use supports
   `book.open(url)` directly, or chunked/Range-based fetching consistent with how `bookService.ts`
   already handles range requests elsewhere).
7. **EPUB-010** — [`EpubViewport.tsx:363,565`](../src/components/reader/EpubViewport.tsx#L363)
   `rendition.themes.override('line-height', '1.5')` has no priority flag, so it's not
   `!important` and can lose to author CSS. Fix the same way `NIGHT_THEME` already scopes
   `!important` rules (`:64-83`) — don't leave line-height as the one theme override that can be
   silently overridden.
8. **Zoom chevron touch target** — [`ReaderZoomStrip.tsx:122`](../src/components/reader/ReaderZoomStrip.tsx#L122)
   is still 36px wide (only `minHeight` was bumped to 48px in the earlier mobile-audit pass). Bump
   width to match, ≥44px per WCAG 2.5.5.

### Phase 2 — Feel (this session's opening topic)
9. Replace the page-turn transition's flat opacity-only fade
   ([`index.css:997-1008`](../src/index.css#L997) for PDF,
   [`EpubViewport.tsx`](../src/components/reader/EpubViewport.tsx) `PAGE_TURN_MS = 140` inline
   `opacity` mutation for EPUB) with a `translateX` (~16–24px, direction of travel) + `opacity`
   transition, 200–250ms `ease-out`. Both properties are compositor-only — no layout/paint cost.
   - **PDF**: currently gated on the `key={currentPage}` remount in
     [`ReaderViewport.tsx:311-313`](../src/components/reader/ReaderViewport.tsx#L311), which forces
     a synchronous canvas redraw underneath a 90ms fade — the redraw usually isn't done when the
     fade finishes, producing a pop instead of a glide. Decouple: crossfade old/new layers, or
     delay the reveal until the new page's `onRenderSuccess` actually fires, rather than fading on
     a fixed timer regardless of render state.
   - **EPUB**: keep the same `animateTurn` structure but switch the animated properties from
     opacity-only to translateX+opacity, and move it from raw inline-style mutation to a CSS
     class/transition for consistency with the PDF path.

### Phase 3 — New capabilities (parity-driven; both formats where applicable)
10. **EPUB typography controls** — decouple font size from the shared zoom slider (currently
    `rendition.themes.fontSize` is driven straight off `zoomScale`,
    [`EpubViewport.tsx:362,565`](../src/components/reader/EpubViewport.tsx#L362)). Add independent
    controls for font family (toggle between the brand's own Fraunces/Inter, already loaded), size,
    line-height, and margins. Likely lives in the Tools panel or the existing zoom-strip slot.
11. **Reading themes beyond night/day** — extend EPUB's `rendition.themes.register` pattern and
    add an equivalent for PDF (check how night mode currently applies to the PDF canvas — likely a
    CSS filter — and extend that mechanism) to add at least a sepia/paper option.
12. **In-book text search** — new for both formats. EPUB: epub.js's own `book.locations`/section
    `.find()` search API. PDF: iterate `react-pdf`'s per-page text content (a similar pattern to
    the text-extraction work already built for the Memory Bridge spoiler guard). Surface it in the
    existing Tools panel; per the prior handoff's own rule ("ordered by actual use frequency, not
    significance"), place it by observing real usage once built rather than guessing a fixed slot
    now.

### Phase 4 — Visual polish
13. Reader empty/error states → catalog illustrations (Decision 1, item 1).
14. Reserve `--color-accent-teal` for reader "found/active" states (Decision 1, item 2) — depends
    on item 12 (search) for its main use case.
15. Low-opacity pattern backdrops (Decision 1, item 3).

## Next steps for whoever picks this up

1. Read this doc plus the files it points to before writing code.
2. Copy the specific asset-kit files actually needed (per Decision 1's four applications) from
   `C:\Users\first\Desktop\drawing and read design sys\Design artifacts from sketches\assets\processed\`
   into this repo (e.g. `public/design-kit/` or `src/assets/`) — nothing has been copied in yet.
3. Work the phases in order; each phase's items are independent of each other within the phase.
