# FINAL EXECUTION PLAN — Kin

> **Status:** AUTHORITATIVE — The single source of truth for what to build next.
> **Date:** 2026-09-13

---

## Situation Summary

Kin is **~85% complete as an MVP.** The personal sketchbook — upload, gallery, detail, edit, favorites, collections, auth, navigation, design system — all work in demo mode. The only critical gap is that uploaded images are lost on page refresh in demo mode because `URL.createObjectURL()` produces session-only URLs.

**The remaining work is not a rewrite. It is 5-7 days of surgical fixes and polish.**

---

## Execution Phases

### Phase 0: Critical Fix — Image Persistence (1-2 days)

> **Goal:** Uploaded images survive page refresh in demo mode.

| Step | Task | Details |
|---|---|---|
| 0.1 | Install `idb` | `npm install idb` — IndexedDB wrapper (1.2KB gzipped) |
| 0.2 | Create `src/services/imageStore.ts` | IndexedDB database `kin-images` with an `images` object store. Key: artwork ID. Value: `{ displayBlob: Blob, thumbnailBlob: Blob }` |
| 0.3 | Modify `src/services/imageService.ts` | **Demo mode path only:** After compression, store blobs in IndexedDB instead of just creating object URLs. On `getImageUrl()`, read blob from IndexedDB and create a fresh object URL. |
| 0.4 | Update `artworkStore.ts` delete flow | When soft-deleting in demo mode, also remove the image blobs from IndexedDB |
| 0.5 | Test the full cycle | Upload → refresh page → image still visible → delete → image removed |

**Files changed:** 3 modified + 1 new
**Risk:** Low — isolated change to demo-mode image path only. Does not affect Supabase live mode.

---

### Phase 1: Stability & Error Handling (0.5 days)

> **Goal:** The app never shows a white screen on error.

| Step | Task | Details |
|---|---|---|
| 1.1 | Create `src/components/ErrorBoundary.tsx` | React error boundary component. Uses ART-09 (mushroom creature) as illustration. Shows "Something went wrong" with a "Return to Sketchbook" button. |
| 1.2 | Wrap routes in `router.tsx` | Add `errorElement` to route definitions so each major section has its own error boundary |
| 1.3 | Test with intentional error | Temporarily throw in a component to verify the boundary catches it |

**Files changed:** 1 new + 1 modified
**Risk:** Very low.

---

### Phase 2: Home Dashboard (1 day)

> **Goal:** Logged-in users see their recent work, not a marketing landing page.

| Step | Task | Details |
|---|---|---|
| 2.1 | Modify `HomeScreen.tsx` | If user is authenticated AND has artworks: show a dashboard with recent uploads (last 6), total artwork count, quick action buttons (Upload, Browse Sketchbook). If not authenticated: show existing landing page unchanged. |
| 2.2 | Add recent artworks query to `artworkStore` | `getRecentArtworks(limit: number)` — returns most recently uploaded, sorted by `upload_date` |
| 2.3 | Reuse existing `ArtworkCard` | Display recent work in a grid using the existing sketchbook card component |

**Files changed:** 2 modified
**Risk:** Low — additive change, existing landing page preserved for unauthenticated visitors.

---

### Phase 3: Responsive Layout (1-2 days)

> **Goal:** The app is usable on phone screens (many users photograph drawings on mobile).

| Step | Task | Details |
|---|---|---|
| 3.1 | Add responsive breakpoints to `index.css` | `@media (max-width: 768px)` rules for layout adjustments |
| 3.2 | Navigation mobile menu | Hamburger menu for mobile, slide-out nav |
| 3.3 | Gallery grid responsive | Single column on mobile, 2 columns on tablet |
| 3.4 | Detail screens stack vertically | Two-column layouts become single-column on mobile |
| 3.5 | Upload form responsive | Full-width inputs on mobile |
| 3.6 | FilterBar collapse | Collapsible filter panel on mobile |

**Files changed:** ~8 modified (CSS + component adjustments)
**Risk:** Medium — touches many files but changes are CSS-only in most cases.

---

### Phase 4: Data Export (1-1.5 days)

> **Goal:** Users can back up their data since there's no cloud sync yet.

| Step | Task | Details |
|---|---|---|
| 4.1 | Create `src/services/exportService.ts` | Export all artworks as JSON + download images as a ZIP (using JSZip or manual Blob construction) |
| 4.2 | Add "Export Data" button | In settings or sketchbook header — downloads a `.zip` containing `artworks.json` + image files |
| 4.3 | Consider import | Parse exported JSON + images back into the app. More complex, can be deferred. |

**Files changed:** 1-2 new + 1 modified
**Risk:** Low-Medium — ZIP generation in browser can be memory-intensive for large collections.
**Alternative:** Export as individual JSON + image files without ZIP if JSZip is too heavy.

---

## Post-MVP Phases (Not Blocking Release)

### Phase 5: Supabase Live Mode (2 days, when ready)

| Step | Task |
|---|---|
| 5.1 | User creates Supabase project and provides URL + anon key |
| 5.2 | Run `supabase/schema.sql` in Supabase SQL editor |
| 5.3 | Create storage bucket with RLS policies |
| 5.4 | Set `.env` variables |
| 5.5 | Test full cycle: signup → upload → refresh → data persists in cloud |

**Note:** The code already supports this. The dual-mode switch is built. This is purely a configuration task.

---

### Phase 6: Gemini Flash Integration (2 days, optional)

| Step | Task |
|---|---|
| 6.1 | User provides Google AI Studio API key |
| 6.2 | Create `src/services/geminiService.ts` — API client for Gemini 2.0 Flash |
| 6.3 | Add "Suggest Tags" button on upload/edit forms — sends image to Gemini, returns tag suggestions |
| 6.4 | Add "Detect Medium" button — Gemini identifies the art medium |
| 6.5 | All AI features are optional — manual entry always available, works 100% without API key |

**Model:** Gemini 2.0 Flash (free tier: 15 RPM, 1,500/day)
**Cost:** $0

---

### Phase 7: Timeline View (2-3 days)

| Step | Task |
|---|---|
| 7.1 | Create `TimelineScreen` — group artworks by creation date |
| 7.2 | Monthly/weekly sections with thumbnail strips |
| 7.3 | Click to navigate to artwork detail |
| 7.4 | Add `/timeline` route |

---

### Phase 8: Progress Studio (3-4 days)

| Step | Task |
|---|---|
| 8.1 | Create project concept — a named group of artwork versions |
| 8.2 | Side-by-side comparison (existing component can be reused) |
| 8.3 | Version notes |
| 8.4 | Add `/progress` and `/progress/:id` routes |

---

## Effort Summary

| Phase | Work | Effort | Blocking MVP? |
|---|---|---|---|
| Phase 0: Image Persistence | Fix critical demo-mode gap | 1-2 days | ✅ Yes |
| Phase 1: Error Boundaries | Stability | 0.5 days | ✅ Yes |
| Phase 2: Home Dashboard | Returning user experience | 1 day | 🟡 Should |
| Phase 3: Responsive Layout | Mobile usability | 1-2 days | 🟡 Should |
| Phase 4: Data Export | Backup capability | 1-1.5 days | 🟡 Should |
| **MVP Total** | | **~5-7 days** | |
| Phase 5: Supabase Live | Cloud persistence | 2 days | ❌ No |
| Phase 6: Gemini AI | Optional AI features | 2 days | ❌ No |
| Phase 7: Timeline | Browse by date | 2-3 days | ❌ No |
| Phase 8: Progress Studio | Version comparison | 3-4 days | ❌ No |

---

## Recommended Execution Order

```
1. Phase 0  — Fix image persistence (unblocks everything)
2. Phase 1  — Error boundaries (safety net before adding more features)
3. Phase 2  — Home dashboard (first thing users see)
4. Phase 3  — Responsive layout (many users on mobile)
5. Phase 4  — Data export (peace of mind before going further)
   ── MVP COMPLETE ──
6. Phase 5  — Supabase live mode (when user is ready)
7. Phase 6  — Gemini integration (when user provides API key)
8. Phase 7  — Timeline view (high user value)
9. Phase 8  — Progress studio (compelling but complex)
```

---

## What I Need From You to Start

**Nothing.** I can begin Phase 0 (image persistence fix) immediately. The only prerequisite is:

```bash
npm install idb
```

No accounts, no API keys, no configuration, no money.

> [!TIP]
> **Say "proceed" and I will begin implementing Phase 0 — the critical image persistence fix.**
