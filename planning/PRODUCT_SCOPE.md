# Product Scope

## Target User

**Consistent hobby artists** — people who draw, sketch, or paint regularly as a personal creative practice. Not professional artists, art students in formal programs, or studio managers. They may use pencils, pens, markers, watercolors, acrylics, or digital tools. They want to preserve, organize, and celebrate their creative work without judgment.

---

## Core User Journeys

### Journey 1: "I just finished a drawing and want to preserve it"
Upload → Add basic metadata (title, date, medium) → See it in gallery → Done

### Journey 2: "I want to browse my drawings"
Open sketchbook → Scroll/filter gallery → Click to view detail → Edit metadata → Done

### Journey 3: "When did I draw this? What else did I draw that week?"
Open timeline/calendar → Browse by date → See thumbnails per date → Click to view

### Journey 4: "I want to see how this drawing evolved"
Open progress studio → Select project → Upload new version → Compare before/after

### Journey 5: "I want to find art that looks like mine"
Upload drawing → Search → Browse results → Save interesting references

### Journey 6: "What supplies do I use?"
Open creative space → Browse/add supplies → Link to artworks → Done

---

## Feature Classification

### Must-Have (MVP — Phase 1-3)

| Feature | User Value | Rationale |
|---|---|---|
| Artwork upload with image storage | Critical | Core action — without this nothing else works |
| Client-side image compression | High | Files from phone cameras can be 5-15MB |
| Artwork metadata (title, creation date, medium, tags, notes) | Critical | Users need to record context about each piece |
| Creation date vs upload date distinction | High | Many users photograph old drawings |
| Personal gallery/sketchbook view | Critical | Primary browsing experience |
| Artwork detail page | Critical | Full view with all metadata |
| Edit artwork metadata | High | Users will want to correct/update |
| Favorite/star artwork | Medium | Quick way to mark important pieces |
| Basic filtering (by medium, favorites, date range) | High | Gallery becomes unusable without filters |
| Collections/albums | Medium | Group related work |
| Local data persistence | Critical | Data must survive page refresh |
| URL routing | Critical | Deep links, browser back/forward, shareable URLs |
| Basic responsive layout | High | Many users will photograph drawings on phone |
| Home screen with recent work | High | Welcoming entry point |
| Empty states with original artwork | Medium | Design system requires this |
| Loading and error states | High | Real data means real failures |

### Should-Have (v1.1 — Phase 4-5)

| Feature | User Value | Rationale |
|---|---|---|
| Creative timeline/calendar | High | Users want to see when they created things |
| Calendar grouping by creation date | High | Multiple drawings per day |
| Backdated artwork support | High | Uploading older work |
| Timeline filters | Medium | Browse by medium, collection, status |
| Progress studio — projects with versions | High | Watching a drawing evolve is deeply satisfying |
| Before/after comparison (side-by-side) | High | The existing prototype already has this interaction |
| Overlay comparison (slider) | Medium | More advanced comparison |
| Version notes | Medium | Record what changed |
| Discover/similarity search | High | Unique differentiator, already prototyped |
| Search results with save-to-references | High | Complete the discovery loop |
| Saved references collection | Medium | Recall discovered inspiration |

### Later Features (v2 — Phase 6-8)

| Feature | User Value | Rationale |
|---|---|---|
| Creative space page | Medium | Nice-to-have, not core |
| Inspiration wall/virtual display | Medium | Decorative feature |
| Supplies/materials list | Medium | Lightweight, useful for tracking |
| Material-to-artwork linking | Low | Complex relationship for modest value |
| Room setup checklist | Low | Very niche |
| AI-suggested tags | Medium | Helpful but must be editable |
| AI medium detection | Medium | Saves manual entry |
| AI tone/vibe suggestions | Low | Subjective, may frustrate users |
| AI progress observations | Medium | Interesting but unreliable |
| AI similarity explanations | Medium | Already mocked in prototype |
| AI creative summaries | Low | Novelty value only |
| Authentication/user accounts | High (for persistence) | Required for cloud storage |
| Cloud sync | High (eventually) | Data safety |
| Full accessibility audit | High | Ethical requirement |

### Features to Reject or Avoid

| Feature | Reason |
|---|---|
| Numerical skill scores | Insulting; no objective measure of artistic talent |
| Streak tracking / missed-day punishment | Creates anxiety, not joy |
| Social features / sharing gallery publicly | This is a personal space, not social media |
| Professional portfolio management | Different user, different product |
| Art marketplace / selling | Completely different product |
| AI art generation | Antithetical — this celebrates human making |
| Complex inventory management | Users are casual hobbyists |
| Expert art terminology requirements | Must be approachable |
| Gamification / achievements | Turns creative practice into a game |
| Automatic quality assessment | Insulting and unreliable |

---

## MVP Definition

The MVP is **a personal digital sketchbook** where a hobby artist can:

1. Upload drawings with basic metadata
2. Browse their collection in a beautiful gallery
3. View each drawing's details and edit metadata
4. Organize with favorites and collections
5. See a timeline of when they created things
6. Have all data persist locally in the browser

**The MVP does NOT include:** similarity search, AI features, progress studio, creative space, supplies, authentication, cloud storage, or mobile app.

The similarity search feature (which the prototype demonstrates) should be **mocked** in the MVP and connected to real services in v1.1.

---

## Version Roadmap

### v0.5 — Foundation (2-3 weeks)
Router, data layer, state management, core types, reusable components

### v1.0 — Personal Sketchbook MVP (3-4 weeks)
Upload, gallery, detail, edit, favorites, collections, basic filtering, persistence

### v1.1 — Timeline + Progress (2-3 weeks)
Calendar view, timeline, progress studio with version comparison

### v1.2 — Discovery (3-4 weeks)
Real similarity search pipeline, results UI (already prototyped), saved references

### v2.0 — Creative Space + AI (4-6 weeks)
Creative space page, supplies, AI-assisted metadata, cloud storage, auth
