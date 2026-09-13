# FINAL SCOPE CORRECTION — Kin

> **Status:** AUTHORITATIVE — Supersedes all previous scope documents.
> **Date:** 2026-09-12

---

## Scope Drift Diagnosis

The codebase and planning documents show evidence of **scope inflation** across multiple axes:

| Drift Area | What Happened | Correction |
|---|---|---|
| **Discovery as primary feature** | The original prototype centered the app around "kindred artistic expressions discovery" — finding art similar to yours online. Navigation, branding, and flow all orient around this. | Discovery is a **nice-to-have side feature**, not the core. The core is the personal sketchbook. |
| **"Creative Space" features** | Planning docs include supplies tracking, room setup checklists, inspiration walls, material-to-artwork linking | **Reject entirely for MVP.** These are v2+ features at best. |
| **AI features everywhere** | AI medium detection, style tagging, progress observations, tone detection, creative summaries, similarity explanations | **All AI features are post-MVP.** The app must be 100% functional without any AI. |
| **Cloud sync complexity** | Architecture docs describe realtime sync, offline queues, IndexedDB read caches, Supabase realtime subscriptions | **Massively overscoped.** For 10-100 users, Supabase demo mode + localStorage is sufficient for MVP. |
| **Progress Studio** | Multi-version projects with side-by-side and overlay slider comparison | **Post-MVP.** Good feature but not essential for first release. |
| **Calendar/Timeline** | Full calendar view with date grouping, timeline filters, backdated support | **Post-MVP.** Sorting by date in the sketchbook provides 80% of this value. |

---

## Corrected Feature Tiers

### Tier 1: Already Built ✅ (Preserve and Polish)

These features exist and work in demo mode. They need **polish, not reimplementation**:

| Feature | Current State | Polish Needed |
|---|---|---|
| Upload with compression | ✅ Working | Fix image persistence (images lost on refresh in demo mode) |
| Metadata form (title, desc, medium, status, tags, date, notes) | ✅ Working | Minor UX refinement |
| Personal gallery/sketchbook grid | ✅ Working | None significant |
| Filtering and sorting | ✅ Working | None significant |
| Artwork detail view | ✅ Working | None significant |
| Artwork metadata editing | ✅ Working | None significant |
| Favorites | ✅ Working | None significant |
| Collections CRUD | ✅ Working | Consider decomposing CollectionModal |
| Soft delete with undo | ✅ Working | None |
| Auth (login/signup/demo) | ✅ Working | None for demo mode |
| Navigation with auth guards | ✅ Working | None |
| Toast notifications | ✅ Working | None |
| Design system + styling | ✅ Working | None — preserve the visual identity |

### Tier 2: Must Fix 🔧 (Critical Gaps in Existing Features)

| Gap | Impact | Fix |
|---|---|---|
| **Demo-mode images lost on page refresh** | 🔴 Critical — defeats the purpose of a "personal sketchbook" | Store image blobs in IndexedDB instead of object URLs |
| **No error boundaries** | 🟡 Medium — unhandled errors crash the entire app | Add React error boundaries with artwork-based fallback UI |
| **Home screen is a landing page, not a dashboard** | 🟡 Medium — first-time vs returning user experience | Show recent uploads and stats for logged-in users |

### Tier 3: Should Build (Completes MVP) 🏗️

| Feature | Why It's Needed | Effort |
|---|---|---|
| **IndexedDB image persistence** (demo mode) | Images must survive page refresh | 2 days |
| **Home dashboard for logged-in users** | Users need to see recent work on arrival | 1 day |
| **Basic responsive layout** | Many users photograph drawings on phones | 2 days |
| **Data export (JSON + images)** | Users need a way to back up their data | 1.5 days |

### Tier 4: Nice to Have (v1.1) 🎯

| Feature | Value | Effort |
|---|---|---|
| Timeline/calendar view | See when you created things | 2-3 days |
| Progress studio (version comparison) | Watch a drawing evolve | 3-4 days |
| Discovery with mock data (already built) | Preserved as-is, connected to real service later | 0 days (already works) |
| Gemini Flash integration (optional) | AI-suggested tags, medium detection | 2 days |
| Supabase live mode | Cloud persistence, multi-device | 2 days (infrastructure exists) |

### Tier 5: Reject or Defer Indefinitely ❌

| Feature | Reason |
|---|---|
| Creative space page | Decorative, no core user value for MVP |
| Supplies/materials tracking | Niche feature, adds complexity |
| Room setup checklist | Extremely niche |
| Inspiration wall | Decorative feature |
| Material-to-artwork linking | Complex relationship management for modest value |
| Google Cloud Vision API | Requires credit card — violates $0 constraint |
| SerpApi / Bing Visual Search | Rejected — unnecessary |
| Social features | Violates Kin's intimate, personal identity |
| Gamification / achievements | Turns creative practice into a game |
| Numerical skill scores | Insulting |
| Streak tracking | Creates anxiety |
| AI art generation | Antithetical to celebrating human making |
| Complex inventory management | Wrong product for hobbyists |
| OAuth providers | Unnecessary complexity for 10-100 users |
| Realtime sync | Not needed for a personal app |
| PWA/offline support | Nice eventually but not MVP-critical |

---

## Corrected MVP Definition

The MVP is **what already exists, plus three fixes**:

1. ✅ Everything in Tier 1 (already built)
2. 🔧 Fix demo-mode image persistence (IndexedDB blobs)
3. 🔧 Add error boundaries
4. 🏗️ Convert home screen to dashboard for logged-in users
5. 🏗️ Basic responsive layout
6. 🏗️ Data export capability

**Total new work for a complete MVP: ~7 days of focused development.**

The app is much closer to MVP than the planning documents suggest. The critical gap is image persistence in demo mode — everything else is polish.

---

## What This Means for Implementation Priority

```
Priority 1 (Blocking):  Fix image persistence in demo mode
Priority 2 (Important):  Error boundaries + responsive layout
Priority 3 (Complete):   Home dashboard + data export
Priority 4 (Enhance):    Timeline, progress studio, Gemini integration
Priority 5 (Scale):      Supabase live mode, cloud sync
```
