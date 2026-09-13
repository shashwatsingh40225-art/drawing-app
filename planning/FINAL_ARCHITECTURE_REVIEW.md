# FINAL ARCHITECTURE REVIEW — Kin

> **Status:** AUTHORITATIVE — Simplest viable architecture for Kin's actual needs.
> **Date:** 2026-09-12

---

## Architecture Principle

> **The simplest architecture that serves 10-100 hobby artists preserving their drawings.**

Every architectural decision must pass this filter: *Does this serve a casual hobby artist uploading sketches, or does this serve an engineer's desire for elegance?*

---

## Current Architecture (What Exists)

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│                                             │
│  React 19 + TypeScript + Vite               │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Screens │──│  Stores  │──│ Services  │  │
│  │ (13)    │  │ (zustand)│  │           │  │
│  └─────────┘  └──────────┘  └───────────┘  │
│       │            │              │         │
│       │            ▼              ▼         │
│       │     ┌─────────────────────────┐     │
│       │     │   Dual-Mode Switch      │     │
│       │     │   isSupabaseDemoMode    │     │
│       │     └──────┬──────────┬───────┘     │
│       │            │          │              │
│       │    ┌───────▼───┐ ┌───▼──────────┐   │
│       │    │localStorage│ │Supabase Client│  │
│       │    │(demo mode) │ │(live mode)    │  │
│       │    └───────────┘ └──────────────┘   │
│       │                                     │
│  ┌────▼──────────────────────────────────┐  │
│  │  HashRouter (react-router-dom)        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**This architecture is fundamentally sound.** The dual-mode pattern is clean, the store layer is well-abstracted, and the component hierarchy is reasonable.

---

## Architecture Assessment: What to Keep

| Decision | Verdict | Rationale |
|---|---|---|
| React 19 + TypeScript + Vite | ✅ Keep | Working well, no reason to change |
| HashRouter | ✅ Keep | Works with static hosting (GitHub Pages, Vercel), no server config needed |
| Zustand stores | ✅ Keep | Lightweight, already integrated, good abstraction layer |
| Dual-mode (demo/Supabase) | ✅ Keep | Excellent pattern — app works without backend |
| localStorage for demo metadata | ✅ Keep | Simple, sufficient for demo mode |
| Supabase client for live mode | ✅ Keep | Already wired up, just needs env vars |
| Client-side image compression | ✅ Keep | browser-image-compression working correctly |
| CSS custom properties design system | ✅ Keep | Well-defined, consistent, distinctive |
| lucide-react icons | ✅ Keep | Consistent, tree-shakeable |
| Google Fonts (Fraunces + Inter) | ✅ Keep | Core to Kin's visual identity |

---

## Architecture Assessment: What to Fix

### Fix 1: Demo-Mode Image Persistence (Critical)

**Problem:** `URL.createObjectURL()` creates session-only URLs. When the page refreshes, the image blobs are gone. Artwork metadata persists in localStorage but the images don't.

**Solution:** Use IndexedDB for image blob storage in demo mode.

```
Current:  File → compress → URL.createObjectURL → display
                                    ↓
                              (lost on refresh)

Fixed:    File → compress → store blob in IndexedDB → create object URL for display
                                    ↓
                              (survives refresh)
                              On load: read from IndexedDB → create new object URL
```

**Implementation:** Add `idb` package (1.2KB gzipped). Create an `imageStore` that wraps IndexedDB for blob read/write. Update `imageService.ts` demo-mode path to persist blobs.

**Effort:** 1-2 days.

### Fix 2: Error Boundaries

**Problem:** Any unhandled error in a component crashes the entire app with a white screen.

**Solution:** Add React error boundaries at the route level. Use ART-09 (mushroom creature) as the error illustration, consistent with the design system.

**Effort:** 0.5 days.

### Fix 3: Home Screen for Returning Users

**Problem:** The home screen is a marketing landing page. For a logged-in user who has uploaded artwork, it should show recent work.

**Solution:** Conditional rendering — if user is logged in and has artworks, show a dashboard with recent uploads, total count, and quick actions. If not logged in, show the existing landing page.

**Effort:** 1 day.

---

## Architecture Assessment: What NOT to Add

| Proposed Addition | Verdict | Rationale |
|---|---|---|
| **IndexedDB for ALL data** (replacing localStorage) | ❌ Skip for now | localStorage works fine for metadata at this scale. IndexedDB only needed for blobs. |
| **Service Worker / PWA** | ❌ Skip for MVP | Nice-to-have but adds complexity without critical user value |
| **React.lazy / code splitting** | ❌ Skip for MVP | 13 screens at ~5-20KB each is not a performance problem |
| **react-window / virtualization** | ❌ Skip for MVP | Nobody has 1000+ artworks yet. Solve when it's a real problem. |
| **Web Workers for compression** | ✅ Already done | browser-image-compression uses `useWebWorker: true` |
| **Complex caching layer** | ❌ Skip | Premature optimization for 10-100 users |
| **Realtime subscriptions** | ❌ Skip | Personal app, single user per session |
| **Edge functions** | ❌ Skip | No server-side logic needed |
| **Complex state sync** | ❌ Skip | Supabase handles persistence; no need for sync engines |

---

## Simplest Viable Architecture for MVP Completion

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│                                             │
│  React 19 + TypeScript + Vite               │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Screens │──│  Stores  │──│ Services  │  │
│  │ (13)    │  │ (zustand)│  │           │  │
│  └─────────┘  └──────────┘  └───────────┘  │
│                     │              │         │
│              ┌──────▼──────────────▼──────┐  │
│              │   Dual-Mode Switch         │  │
│              └──────┬──────────┬──────────┘  │
│                     │          │             │
│              ┌──────▼────┐ ┌──▼───────────┐ │
│              │  Demo Mode │ │  Live Mode   │ │
│              │            │ │              │ │
│              │ localStorage│ │ Supabase    │ │
│              │ (metadata) │ │ (Postgres + │ │
│              │            │ │  Storage +  │ │
│              │ IndexedDB  │ │  Auth)      │ │
│              │ (images)   │ │              │ │
│              └───────────┘ └──────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  HashRouter + Error Boundaries        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Changes from current architecture:**
1. Add IndexedDB for image blobs in demo mode (new)
2. Add error boundaries at route level (new)
3. Everything else stays exactly as-is

---

## Dependency Inventory

### Current Dependencies (Keep All)

| Package | Purpose | Size (gzipped) | Verdict |
|---|---|---|---|
| `react` | UI framework | ~40KB | ✅ Keep (core) |
| `react-dom` | DOM rendering | ~40KB | ✅ Keep (core) |
| `react-router-dom` | URL routing | ~14KB | ✅ Keep (critical) |
| `zustand` | State management | ~1.5KB | ✅ Keep (well-integrated) |
| `@supabase/supabase-js` | Backend client | ~30KB | ✅ Keep (dual-mode) |
| `browser-image-compression` | Image resize/compress | ~30KB | ✅ Keep (core feature) |
| `lucide-react` | Icons | Tree-shakeable | ✅ Keep (design system) |

### New Dependencies Needed

| Package | Purpose | Size (gzipped) | Verdict |
|---|---|---|---|
| `idb` | IndexedDB wrapper | ~1.2KB | ✅ Add (for image blob persistence) |

### Dependencies NOT Needed

| Package | Was Proposed In | Why Not Needed |
|---|---|---|
| `date-fns` | TECHNICAL_ARCHITECTURE.md | Custom `utils/dates.ts` already handles formatting. `date-fns` is overkill for the current needs. |
| `uuid` | TECHNICAL_ARCHITECTURE.md | `crypto.randomUUID()` is available in all modern browsers. No package needed. |
| `react-window` | TECHNICAL_ARCHITECTURE.md | Premature optimization. Not needed until 500+ artworks. |

---

## File Changes Required for MVP Completion

| File | Change Type | Purpose |
|---|---|---|
| `src/services/imageStore.ts` | **NEW** | IndexedDB wrapper for image blobs |
| `src/services/imageService.ts` | **MODIFY** | Use IndexedDB instead of object URLs in demo mode |
| `src/components/ErrorBoundary.tsx` | **NEW** | Route-level error boundary |
| `src/router.tsx` | **MODIFY** | Wrap routes in error boundaries |
| `src/screens/HomeScreen.tsx` | **MODIFY** | Add dashboard view for logged-in users |
| `package.json` | **MODIFY** | Add `idb` dependency |

**Total files changed: 6 (2 new, 4 modified)**

This is not a major refactor. It's surgical fixes to an already-functional application.
