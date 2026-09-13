# Master Implementation Plan

## Kin — Personal Creative Companion App

### From Prototype to Product

---

## Vision

Turn a visual-only React prototype of an artistic similarity discovery tool into a complete personal creative companion — a digital sketchbook where hobby artists can preserve, organize, explore, and celebrate their drawings.

---

## Current State

The project is a **well-executed visual prototype** built with React 19, TypeScript, and Vite. It demonstrates a single user flow (upload → process → view similar art → save favorites) using mock data. The design system is distinctive and carefully implemented — warm ink-and-paper aesthetic derived from 20 real artist drawings. See [CODEBASE_AUDIT.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/CODEBASE_AUDIT.md) for the complete technical audit.

**What works:** 7 screens render correctly, design tokens are well-implemented, artwork assets are deployed, the visual identity is strong.

**What doesn't exist yet:** Data persistence, URL routing, real image storage, metadata editing, personal gallery, timeline, progress tracking, real similarity search, authentication.

---

## Architecture Decision: Local-First

The app will use **browser-local storage (IndexedDB)** for all data in the MVP, with a migration path to cloud storage (Supabase) in Phase 8. This means:

- ✅ Zero hosting cost
- ✅ Full offline capability  
- ✅ No authentication complexity for MVP
- ✅ Complete privacy — artwork never leaves the device
- ⚠️ Data locked to one browser (mitigated by export/import in Phase 3)
- ⚠️ Storage limits (~1-2GB practical, sufficient for ~500 artworks)

See [TECHNICAL_ARCHITECTURE.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/TECHNICAL_ARCHITECTURE.md) for the full architecture.

---

## Phased Implementation

### Phase 1: Foundation (~7 days)

**Goal:** Install the architectural skeleton without breaking the existing prototype.

| Task | What It Does | Dependencies |
|---|---|---|
| Git init + cleanup | Version control, remove redundant files | None |
| Install dependencies | react-router-dom, zustand, idb, browser-image-compression, date-fns, uuid | None |
| Create type system | TypeScript interfaces for all entities | None |
| Create IndexedDB layer | Database initialization, schema, CRUD services | idb |
| Create image service | Upload compression, thumbnail generation, blob storage | browser-image-compression |
| Create Zustand stores | State management for artworks, UI, collections | zustand |
| Install React Router | URL routing for all 7 existing screens | react-router-dom |
| Extract reusable components | Button, Card, ArtworkMat, Badge, EmptyState, PageHeader | None |

**Output:** All existing screens work via URL routes. New infrastructure is created but not yet surfaced to users.

**Detailed tasks:** [GEMINI_IMPLEMENTATION_PLAYBOOK.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/GEMINI_IMPLEMENTATION_PLAYBOOK.md), Phase 1

---

### Phase 2: Personal Sketchbook MVP (~15 days)

**Goal:** Users can upload, view, edit, organize, and persist their artwork.

| Task | What It Does | Dependencies |
|---|---|---|
| Connect upload to storage | Real image compression + IndexedDB storage | Phase 1 services |
| Build artwork edit screen | Metadata form (title, date, medium, tags, notes) | Phase 1 components |
| Build sketchbook gallery | Grid view with filtering and sorting | Phase 1 stores, components |
| Build personal artwork detail | Full detail view for personal artworks | ArtworkMat, Badge |
| Build collections | Albums/folders for organizing artwork | CollectionService |
| Modify home screen | Dashboard with recent work (hero if empty) | ArtworkStore |
| Update navigation | Router links, active route highlighting | React Router |

**Output:** A functional personal digital sketchbook. Users can upload drawings, add metadata, browse their gallery, organize into collections, and all data persists.

**Detailed tasks:** [GEMINI_IMPLEMENTATION_PLAYBOOK.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/GEMINI_IMPLEMENTATION_PLAYBOOK.md), Phase 2

---

### Phase 3: Polish + Infrastructure (~7 days)

**Goal:** Production-quality error handling, responsive design, data safety.

| Task | What It Does |
|---|---|
| Error boundaries | Graceful error handling with ART-09 mushroom creature |
| Responsive layout | Mobile, tablet, desktop breakpoints |
| Data export/import | ZIP file backup and restore |
| Loading states | Artistic loading indicators (ART-11 spiral) |
| Accessibility pass | WCAG AA contrast, focus states, alt text, keyboard nav |
| PWA support | Service worker for offline, manifest for install |

**Output:** A polished, production-ready personal sketchbook that works on all devices.

---

### Phase 4: Timeline + Progress (~13 days)

**Goal:** Users can see when they created things and track how drawings evolve.

| Task | What It Does |
|---|---|
| Calendar view | Month grid with artwork thumbnails on active days |
| Timeline screen | Chronological browsing with filters |
| Progress studio | Projects overview with version tracking |
| Version upload | Add new versions to a project |
| Side-by-side comparison | Compare versions (reuses existing comparison UI) |
| Overlay slider comparison | Drag slider to compare overlaid versions |

**Output:** A creative timeline and progress tracking system.

---

### Phase 5: Discovery (~10 days)

**Goal:** Connect the existing discovery prototype to real search APIs.

| Task | What It Does |
|---|---|
| Client-side palette extraction | Extract dominant colors using Canvas API |
| Discovery service (mock → real) | Swap mock data for Google Cloud Vision results |
| Artwork vs photo filtering | Label-based + URL-based filtering of results |
| Source attribution | Display source website, link to original page |
| Saved references | Save discovered artworks for later inspiration |
| Serverless proxy | Secure API key handling via edge function |

**Output:** Real artistic similarity search. See [ARTISTIC_DISCOVERY_ARCHITECTURE.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/ARTISTIC_DISCOVERY_ARCHITECTURE.md).

---

### Phase 6: Creative Space (~9 days)

**Goal:** A personal art room page with supplies and inspiration.

### Phase 7: AI Enhancement (~6 days)

**Goal:** AI-suggested metadata (always optional, always editable). See [AI_FEATURE_FEASIBILITY.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/AI_FEATURE_FEASIBILITY.md).

### Phase 8: Cloud + Auth (~12 days)

**Goal:** Cross-device access and data safety via Supabase.

---

## New Dependencies

| Library | Purpose | Size (gzipped) |
|---|---|---|
| react-router-dom v7 | URL routing | ~14KB |
| zustand | State management | ~1.5KB |
| idb | IndexedDB wrapper | ~1.2KB |
| browser-image-compression | Client-side image processing | ~30KB |
| date-fns | Date formatting | Tree-shakeable |
| uuid | Unique ID generation | ~1KB |
| **Total new** | | **~48KB** |

---

## Data Model Summary

6 core entities, all stored in IndexedDB:

- **Artwork** — drawings with metadata, images, tags, collections
- **ImageBlob** — compressed images (original, display, thumbnail)
- **Collection** — albums/folders for organizing
- **Project** — progress tracking with versions
- **Material** — supplies and art materials
- **SavedReference** — discovered artworks saved for inspiration

See [DATA_MODEL.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/DATA_MODEL.md) for complete type definitions.

---

## Design Integrity

The artistic identity is the project's most valuable asset. Every new screen must:

- Use only colors from the CSS custom properties in `index.css`
- Use only Fraunces (display) and Inter (body/UI) fonts
- Implement the double-outline hover/focus signature
- Use ART-01 for empty states, ART-09 for error states
- Maintain generous negative space around artwork
- Avoid generic SaaS patterns

See [DESIGN_INTEGRITY_GUIDELINES.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/DESIGN_INTEGRITY_GUIDELINES.md) for the complete checklist.

---

## Key Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Data loss (browser-only storage) | 🔴 Critical | Export/import in Phase 3 |
| API key security (discovery feature) | 🔴 Critical | Serverless proxy in Phase 5 |
| Design system drift | 🟠 High | Design guidelines + component library |
| Feature creep | 🟠 High | Strict MVP definition |
| IndexedDB storage limits | 🟠 High | Monitor + warn users |

See [RISK_REGISTER.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/RISK_REGISTER.md) for the complete register.

---

## Open Questions for User

1. **Storage:** IndexedDB (local-first, recommended) or Supabase from day one?
2. **Discovery:** Real API in-app, or external Google Lens link?
3. **Navigation:** How to scale nav for 7+ sections?
4. **Deletion:** Soft delete with 30-day recovery (recommended)?

See [OPEN_QUESTIONS.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/OPEN_QUESTIONS.md) for details.

---

## Planning Document Index

| Document | Purpose |
|---|---|
| [MASTER_IMPLEMENTATION_PLAN.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/MASTER_IMPLEMENTATION_PLAN.md) | This document — executive summary and roadmap |
| [CODEBASE_AUDIT.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/CODEBASE_AUDIT.md) | Complete audit of existing prototype |
| [PRODUCT_SCOPE.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/PRODUCT_SCOPE.md) | User journeys, MVP definition, feature classification |
| [TECHNICAL_ARCHITECTURE.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/TECHNICAL_ARCHITECTURE.md) | Stack, folder structure, routing, state, storage |
| [DATA_MODEL.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/DATA_MODEL.md) | Entity definitions, IndexedDB schema, relationships |
| [UI_COMPONENT_INVENTORY.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/UI_COMPONENT_INVENTORY.md) | Existing + planned components, extraction priorities |
| [FEATURE_FEASIBILITY_MATRIX.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/FEATURE_FEASIBILITY_MATRIX.md) | Difficulty/effort ratings for every feature |
| [ARTISTIC_DISCOVERY_ARCHITECTURE.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/ARTISTIC_DISCOVERY_ARCHITECTURE.md) | Similarity search pipeline, APIs, filtering |
| [AI_FEATURE_FEASIBILITY.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/AI_FEATURE_FEASIBILITY.md) | AI feature assessment by reliability/mockability |
| [DESIGN_INTEGRITY_GUIDELINES.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/DESIGN_INTEGRITY_GUIDELINES.md) | Rules to prevent design system drift |
| [MIGRATION_STRATEGY.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/MIGRATION_STRATEGY.md) | How to evolve the prototype without breaking it |
| [RISK_REGISTER.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/RISK_REGISTER.md) | Top risks with severity and mitigations |
| [SCREEN_FLOW_MAP.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/SCREEN_FLOW_MAP.md) | Navigation architecture, user flows, screen states |
| [OPEN_QUESTIONS.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/OPEN_QUESTIONS.md) | Questions requiring user decisions, assumptions log |
| [GEMINI_IMPLEMENTATION_PLAYBOOK.md](file:///c:/Users/first/Desktop/drawing%20storing%20app/planning/GEMINI_IMPLEMENTATION_PLAYBOOK.md) | Task-level instructions for the implementing agent |
