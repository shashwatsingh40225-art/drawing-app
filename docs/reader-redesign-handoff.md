# Reader Redesign — Handoff

This captures a structured planning session for redesigning Kin's reading experience (the Reader
screen and its chrome). **No implementation code has been touched.** The only artifacts produced
are this document, [`CONTEXT.md`](../CONTEXT.md), and two ADRs in `docs/adr/`. A fresh session
should read those three before writing any code.

## Scope

**In scope (decided here):** the Reader screen's structure and behavior — chrome, navigation
gestures, zoom, bookmarks/pins, and the Kin Archive / Memory Bridge panels.

**Explicitly out of scope (not started):**
- The Library screen (the "Reading Now" list and its overflow menu) — deliberately set aside to
  do after the Reader is settled.
- Any visual design — colors, typography, spacing, icon graphics, motion easing. That's blocked
  on the design system the user is bringing to this next session, in a separate folder.
- Which specific sketches/artifacts become which functional icons (search, bookmark, add-pin,
  etc.) — blocked on the cleaned-up asset set, also not yet provided.

**How this was derived:** the user shared five ReadEra screenshots (library list, overflow menu,
nav drawer, and the reader itself) as *layout/structure reference only* — colors, fonts, and icon
style were explicitly discarded, only the skeleton (what's persistent chrome vs. what's tucked
into panels, what's collapsible, gesture zones) was kept. The explicit instruction was: **don't
invent new features — integrate Kin's existing feature set into that structural rhythm**, adapting
the structure wherever Kin's existing features go beyond what ReadEra's reference shows.

## Existing feature inventory (grounded in code, as of this session)

| Feature | Where it lives |
|---|---|
| PDF page rendering | `src/components/reader/ReaderViewport.tsx` (via `react-pdf`) |
| Zoom + fit width/page | `ReaderToolbar.tsx` |
| Bookmark (page-level, no position) | `types/book.ts` `Bookmark`, `bookmarkStore.ts` |
| Positioned note / archive-ref pin | `types/book.ts` `PageAnnotation`, rendered in `AnnotationOverlay.tsx` |
| Kin Archive (20 studio artworks, pinnable to a page) | `data/kinArchive.ts`, `ReaderSidebar.tsx` (`archive` mode) |
| Memory Bridge / "Previously…" recap | `MemoryBridgeCard.tsx`, `services/readingSessionLogic.ts` |
| Reading session auto-tracking | `types/book.ts` `ReadingSession`, `readingSessionLogic.ts` |
| ~~Focus Mode~~ / ~~Quiet Reading~~ / idle chrome-fade | superseded — see ADR 0001 |

## Settled decisions

1. **Chrome model** — a single tap-to-toggle mechanism replaces the three previous overlapping
   ones (Focus Mode, Quiet Reading, idle-fade). Tapping the page's center shows/hides all chrome
   (top bar, metadata strip, Tools launcher) as one unit — no dimmed or partial state. Focus
   Mode's old fullscreen-canvas behavior (fixed position, full viewport) is absorbed into what
   "chrome hidden" does technically, not kept as a separate toggle. See ADR 0001.

2. **Tap-zone navigation** — tapping the page is zone-based: left third = previous page, right
   third = next page, center = toggle chrome. Swipe gestures (already implemented via
   `useSwipeGesture`) continue to work everywhere as an alternative to zone taps.

3. **Primary persistent bar** — capped at exactly 3 one-tap controls: **Back**, **Bookmark**, and
   a single **Tools** launcher. Nothing else — including Kin Archive — gets its own persistent
   primary-bar icon, deliberately, to keep the reading surface uncluttered.

4. **Zoom** — lives in its own small collapsible chevron/strip, in the structural slot ReadEra
   used for its brightness slider. It's outside the Tools group (not nested inside it), because
   it's reached for often enough mid-read to want faster access than opening a full panel.

5. **Tools group** — bundles Thumbnails, Bookmarks list, Add Pin, Kin Archive browsing, and
   manual access to past Memory Bridge recaps. Ordered by actual use frequency, not by brand
   significance — Thumbnails/Bookmarks near the top, Kin Archive and recap history lower. (Visual
   prominence for the Kin Archive/sketch identity should come from *how things look* once the
   design system lands, not from artificially prioritizing a rarely-used panel.)

6. **Add Pin flow** — one entry point replaces the previously separate "Add Note" and "Pin
   Archive Asset" actions. Tapping **Add Pin** shows a brief chooser first (write a note / pick
   from Kin Archive) before anything is placed on the page — it does not drop a default pin that
   gets edited into the other kind afterward. **Bookmark stays fully separate**, since it's a
   different kind of thing (no position, page-level only) and is used constantly enough to merit
   its own always-reachable button.

7. **Memory Bridge behavior** — the existing `MemoryBridgeCard` (proactive "Previously…" card
   with summary text, one-tap "Continue reading," and boundary-editing via "Not the right
   pages?") is the right shape already and stays as-is behaviorally. The one change: its
   surfacing threshold is decoupled from the 30-minute session-break threshold — it needs a
   distinct, longer gap (on the order of hours, or "read on a different calendar day") before it
   proactively appears, so a short reading break doesn't trigger it. See ADR 0002. **The exact
   numeric threshold was deliberately left open** — pick one when implementing.

## Terminology

Use the terms defined in [`CONTEXT.md`](../CONTEXT.md) consistently: **Chrome**, **Tools**,
**Bookmark**, **Pin**, **Kin Archive**, **Reading Session**, **Memory Bridge**. Each entry also
lists near-synonyms to avoid (e.g. don't call a Bookmark a Pin, or vice versa — they're
structurally different).

## Next steps for whoever picks this up

1. Read `CONTEXT.md` and `docs/adr/0001-*` / `docs/adr/0002-*` for vocabulary and rationale.
2. Get the design system and cleaned-up sketch/icon assets from the user (separate deliverables,
   not part of this session).
3. Treat this document as the settled **structure** — the reskin/implementation pass applies the
   design system *onto* this structure; it does not re-decide it. If something here genuinely
   doesn't work once real content/assets are in hand, that's worth flagging explicitly rather than
   silently deviating.
4. The Library screen has not been through this process yet — do the same structural mapping pass
   for it before styling it, if/when it's in scope.
