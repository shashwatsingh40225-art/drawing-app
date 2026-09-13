# Gemini Implementation Playbook

## Purpose

This document is the operating manual for a future Gemini 3.8 Flash agent tasked with implementing the plan. Every task is specified at a granularity level where the agent can execute it without needing to make architectural decisions.

---

## How to Use This Playbook

1. **Execute phases in order.** Each phase builds on the previous one.
2. **Execute tasks within a phase in order.** Dependencies are explicit.
3. **After each task:** Run `npm run dev` and verify the app still loads. Run `npm run build` and verify no TypeScript errors.
4. **After each phase:** Create a git tag (e.g., `v0.5-foundation`).
5. **Read design docs before touching UI.** Every component and screen must comply with:
   - `planning/DESIGN_INTEGRITY_GUIDELINES.md`
   - `design/ANTIGRAVITY_UI_SPEC.md`
   - `design/DESIGN_SYSTEM.md`
6. **Never introduce colors not in `src/index.css`.** 
7. **Never delete existing screens.** Refactor or enhance them.
8. **When in doubt, check `planning/OPEN_QUESTIONS.md`** for documented decisions.

---

## Phase 1: Foundation

**Goal:** Install dependencies, create the architectural skeleton, and extract reusable components — all without breaking the existing prototype.

**Verification:** All 7 existing screens render correctly via URL routes.

### Task 1.1: Git Initialization

```
If not already initialized:
  git init
  Create .gitignore with: node_modules/, dist/, .env, *.log, .DS_Store
  git add -A
  git commit -m "feat: initial prototype state"
  git tag v0.0-prototype
```

### Task 1.2: Clean Up Redundant Files

```
Delete the root-level `artist-refrence/` directory (it's a misspelled duplicate of public/artist-reference/).
In `public/artist-reference/`, delete all files EXCEPT art-01.jpeg through art-20.jpeg.
Update any code that references WhatsApp_Image_... filenames to use art-NN.jpeg instead.
Verify: All artwork images still display correctly in the app.
Commit: "chore: clean up redundant artwork files"
```

### Task 1.3: Install New Dependencies

```
npm install react-router-dom@7 zustand idb browser-image-compression date-fns uuid
npm install -D @types/uuid
Verify: npm run dev still works, npm run build still passes.
Commit: "chore: add router, state, db, and utility dependencies"
```

### Task 1.4: Create Type System

```
Create src/types/artwork.ts:
  - Define PersonalArtwork interface (see DATA_MODEL.md, Artwork entity)
  - Keep the existing Artwork interface in src/data/artworks.ts for now (it's used by the discovery prototype)

Create src/types/collection.ts:
  - Define Collection interface (see DATA_MODEL.md)

Create src/types/project.ts:
  - Define Project interface (see DATA_MODEL.md)

Create src/types/material.ts:
  - Define Material interface (see DATA_MODEL.md)

Create src/types/reference.ts:
  - Define SavedReference interface (see DATA_MODEL.md)

Create src/types/search.ts:
  - Define DiscoveryResult interface (see ARTISTIC_DISCOVERY_ARCHITECTURE.md)
  - Define SearchSession interface (see DATA_MODEL.md)

Create src/types/index.ts:
  - Re-export all types

Verify: npm run build passes with no errors.
Commit: "feat: add TypeScript type definitions for all entities"
```

### Task 1.5: Create IndexedDB Service

```
Create src/services/db.ts:
  - Initialize IndexedDB database named 'kin-app' using the `idb` library
  - Define object stores: artworks, imageBlobs, collections, tags
  - Define indexes per DATA_MODEL.md
  - Export a getDB() function that returns the database connection
  - Handle schema versioning for future migrations

Verify: App loads without errors (database is created but not yet used).
Commit: "feat: initialize IndexedDB with schema"
```

### Task 1.6: Create Artwork Service

```
Create src/services/artworkService.ts:
  - Implement CRUD operations against IndexedDB:
    - getAll(): Promise<PersonalArtwork[]>
    - getById(id: string): Promise<PersonalArtwork | null>
    - create(data: CreateArtworkInput): Promise<PersonalArtwork>
    - update(id: string, data: Partial<PersonalArtwork>): Promise<PersonalArtwork>
    - softDelete(id: string): Promise<void>
    - getByDateRange(start: Date, end: Date): Promise<PersonalArtwork[]>
    - getFavorites(): Promise<PersonalArtwork[]>
    - search(query: string): Promise<PersonalArtwork[]>

Verify: Write a simple test in browser console that creates, reads, updates, deletes.
Commit: "feat: implement artwork CRUD service"
```

### Task 1.7: Create Image Service

```
Create src/services/imageService.ts:
  - processUpload(file: File): Promise<{ originalId, displayId, thumbnailId }>
    - Validate file type (JPEG, PNG, WebP)
    - Validate file size (max 20MB)
    - Generate UUID
    - Compress to display size (max 1920px, 80% quality) using browser-image-compression
    - Generate thumbnail (max 400px, 70% quality)
    - Store all three blobs in IndexedDB imageBlobs store
    - Return the three blob IDs
  - getImageUrl(blobId: string): Promise<string>
    - Read blob from IndexedDB
    - Create and return object URL
  - deleteImage(blobId: string): Promise<void>

Verify: Upload a test image via browser console, retrieve it, confirm quality.
Commit: "feat: implement image processing and storage service"
```

### Task 1.8: Create Zustand Stores

```
Create src/stores/artworkStore.ts:
  - State: artworks[], loading, error, filters
  - Actions: loadArtworks, createArtwork, updateArtwork, deleteArtwork, toggleFavorite
  - On init: load from IndexedDB
  - On mutation: write-through to IndexedDB

Create src/stores/uiStore.ts:
  - State: sidebarOpen, activeFilters, sortBy, viewMode
  - Actions: setFilter, clearFilters, setSortBy, setViewMode

Verify: Stores can be imported and used in a test component.
Commit: "feat: create Zustand state management stores"
```

### Task 1.9: Install React Router

```
Create src/router.tsx:
  - Define routes mapping to existing screen components:
    / → HomeScreen
    /upload → UploadScreen  
    /discover/processing → ProcessingScreen
    /discover/results → ResultsScreen
    /discover/results/:id → ArtworkDetailScreen
    /saved → FavoritesScreen
    /about → AboutScreen

Modify src/App.tsx:
  - Replace the useState-based screen switching with <RouterProvider router={router} />
  - Move shared state (uploadedDrawing, selectedArtwork, savedArtworks) to Zustand stores
  - Remove ScreenType and currentScreen state

Modify each screen component:
  - Replace callback props (onBack, onNavigate, etc.) with useNavigate() calls
  - Replace prop-based data with Zustand store hooks
  - Keep all visual rendering unchanged

Verify: Navigate to each route in the browser. Confirm all 7 screens render correctly.
         Browser back/forward buttons work.
         Direct URL entry works (e.g., /about loads the About screen).
Commit: "feat: add React Router with URL routing for all screens"
```

### Task 1.10: Extract Reusable UI Components

```
Create src/components/ui/Button.tsx:
  - Variants: primary, secondary, accent, ghost, destructive
  - Sizes: sm, md, lg
  - Props: icon, loading, disabled, children, onClick
  - Implements .btn-primary, .btn-secondary, .btn-accent CSS classes + double-outline hover
  - Use existing CSS classes from index.css, don't reinvent

Create src/components/ui/Card.tsx:
  - Variants: default, elevated, interactive
  - Props: children, className, onClick
  - Implements: --color-surface, --color-border, --radius-lg, --shadow-subtle
  - Interactive variant adds double-outline hover effect

Create src/components/artwork/ArtworkMat.tsx:
  - Props: imageUrl, alt, size (sm/md/lg/full)
  - Implements: cream background (#FAF5EC), rounded corners, padding, artwork-img-blend class
  - Extract the pattern used in 5+ existing screens

Create src/components/ui/Badge.tsx:
  - Variants: match (with score), tag, status
  - Colors: accent, teal, secondary, muted
  - Props: label, icon, variant, color

Create src/components/layout/EmptyState.tsx:
  - Props: artworkSrc, headline, description, actionLabel, onAction
  - Implements: The centered artwork + message pattern from FavoritesScreen

Create src/components/layout/PageHeader.tsx:
  - Props: icon, eyebrowLabel, title, description, action
  - Implements: The consistent header pattern across all screens

Verify: Import each component in a test and render it. Verify it matches the design.
Commit: "feat: extract reusable UI component library"
```

### Phase 1 Complete Checklist:
- [ ] All dependencies installed
- [ ] Type system created
- [ ] IndexedDB initialized
- [ ] Artwork and image services working
- [ ] Zustand stores created
- [ ] React Router installed, all routes working
- [ ] 6+ reusable components extracted
- [ ] All existing screens still render correctly
- [ ] `npm run build` passes with no errors
- [ ] Git tagged: `v0.5-foundation`

---

## Phase 2: Personal Sketchbook MVP

**Goal:** Users can upload, view, edit, organize, and persist their artwork.

**Verification:** Upload a drawing, add metadata, close the browser, reopen — artwork is still there.

### Task 2.1: Build Upload Flow

```
Modify src/screens/UploadScreen.tsx:
  - Keep existing visual design (dropzone with ruled-paper texture)
  - On file selection:
    - Call imageService.processUpload(file)
    - Call artworkService.create({ imageId, thumbnailId, title: file.name, ... })
    - Navigate to /sketchbook/:newId/edit for metadata entry
  - Add loading state during compression

Verify: Upload an image. Confirm it's stored in IndexedDB (check DevTools > Application > IndexedDB).
Commit: "feat: connect upload to IndexedDB storage"
```

### Task 2.2: Build Artwork Edit Screen

```
Create src/screens/ArtworkEditScreen.tsx:
  - Route: /sketchbook/:id/edit
  - Layout: Two-column (image preview left, form right) or stacked on mobile
  - Form fields:
    - Title (text input, required)
    - Description (textarea, optional)
    - Creation date (date picker, defaults to today)
    - Medium (select with presets: Pencil, Ink pen, Marker, Watercolor, Acrylic, Digital, Mixed, Other)
    - Tags (tag input with autocomplete from existing tags)
    - Status (select: Completed, In progress, Study, Abandoned)
    - Notes (textarea, optional)
  - Save button → artworkService.update()
  - Cancel/Back → navigate to /sketchbook/:id
  - Uses: PageHeader, Button, Input, TagInput, Card, ArtworkMat components

DESIGN RULES:
  - Background: --color-background (cream)
  - Form card: --color-surface with --color-border
  - All inputs use --color-border, focus shows double-outline in --color-accent
  - Save button: --color-primary (plum) fill
  - Cancel: secondary outline button
  - No colors outside the design tokens

Verify: Edit metadata for an uploaded artwork. Close browser. Reopen. Metadata persists.
Commit: "feat: build artwork metadata editing screen"
```

### Task 2.3: Build Sketchbook Gallery Screen

```
Create src/screens/SketchbookScreen.tsx:
  - Route: /sketchbook
  - Components: PageHeader, FilterBar, ArtworkGrid, ArtworkCard, EmptyState
  - Layout:
    - Header with "My Sketchbook" title and upload CTA button
    - FilterBar with: medium filter (dropdown), favorites toggle, sort (newest/oldest/title)
    - ArtworkGrid showing all artworks as cards
    - Each card: thumbnail, title, medium badge, date, favorite star
    - Card click → navigate to /sketchbook/:id
    - Empty state: ART-01 crane + "Your sketchbook is empty" + upload CTA
  - Data source: artworkStore (loaded from IndexedDB)

DESIGN RULES:
  - Grid: 2 columns mobile, 3 desktop, 24px+ gaps
  - Cards: --color-surface, --color-border, --radius-lg
  - Card hover: double-outline effect + surface lift
  - Thumbnails in ArtworkMat component
  - Generous padding top and bottom

Verify: Upload 3+ artworks. View them in the gallery. Filter by medium. Toggle favorites.
Commit: "feat: build sketchbook gallery with filtering"
```

### Task 2.4: Build Personal Artwork Detail Screen

```
Create a variant of ArtworkDetailScreen for personal artworks:
  - Route: /sketchbook/:id
  - Layout: Two-column (image left, metadata right), existing design language
  - Shows: Full-size image in ArtworkMat, all metadata, tags as badges
  - Actions: Edit (→ /sketchbook/:id/edit), Favorite toggle, Delete (with confirmation)
  - Uses: ArtworkMat, Badge, Button, FeatherDivider, PageHeader

Verify: Navigate from gallery card to detail. All metadata displays correctly.
Commit: "feat: build personal artwork detail view"
```

### Task 2.5: Build Collections Feature

```
Create src/stores/collectionStore.ts
Create src/services/collectionService.ts (IndexedDB CRUD)

Add to SketchbookScreen:
  - "Collections" tab/section showing collection cards
  - Create collection modal (name + optional description)
  
Add to ArtworkEditScreen:
  - "Add to collection" multi-select dropdown

Create src/screens/CollectionDetailScreen.tsx:
  - Route: /sketchbook/collection/:id
  - Shows: Collection name, description, artwork grid filtered to collection

Verify: Create a collection. Add artworks to it. View collection. Remove artwork from collection.
Commit: "feat: implement collections/albums"
```

### Task 2.6: Modify Home Screen

```
Modify src/screens/HomeScreen.tsx:
  - If artworkStore has 0 artworks: show existing hero landing
  - If artworkStore has artworks: show dashboard with:
    - "Recent additions" row (last 4 artworks as cards)
    - "Favorites" row (up to 4 favorites)
    - Quick actions: Upload new, View sketchbook, Discover kindred art
  - Keep existing hero visual as the empty state — do not delete

DESIGN RULES:
  - Same cream background, same typography hierarchy
  - Section titles in Fraunces serif
  - Cards use ArtworkCard component
  - Quick actions use Button component

Verify: With 0 artworks: see original hero. Upload 3 artworks: see dashboard.
Commit: "feat: add recent work dashboard to home screen"
```

### Task 2.7: Update Navigation

```
Modify src/components/Navigation.tsx:
  - Replace manual screen switching with React Router <Link> components
  - Nav items: Home (/), Sketchbook (/sketchbook), Discover (/discover), About (/about)
  - Highlight active route
  - Upload CTA button → navigates to /upload
  - Keep existing visual design (sticky header, EyeMark logo, warm background)

Verify: All nav links work. Active route is highlighted. Logo click goes home.
Commit: "feat: update navigation for React Router"
```

### Phase 2 Complete Checklist:
- [ ] Upload stores images in IndexedDB with compression
- [ ] Artwork editing form with all metadata fields
- [ ] Gallery grid with filtering and sorting
- [ ] Personal artwork detail view
- [ ] Collections CRUD
- [ ] Home screen shows recent work (or hero if empty)
- [ ] Navigation uses Router links
- [ ] Data persists across browser sessions
- [ ] `npm run build` passes
- [ ] Git tagged: `v1.0-sketchbook`

---

## Phase 3: Polish and Infrastructure

### Task 3.1: Error Boundaries

```
Create src/components/ErrorBoundary.tsx:
  - Catches render errors in child components
  - Shows ART-09 (mushroom creature) with error message
  - "Try again" button reloads the page

Wrap each route in an ErrorBoundary.
Commit: "feat: add error boundaries with artistic error states"
```

### Task 3.2: Responsive Layout

```
Add responsive breakpoints to all screens:
  - Mobile (< 640px): single column, stacked layouts
  - Tablet (640-1024px): two-column grids
  - Desktop (> 1024px): three-four column grids

Add responsive navigation:
  - Mobile: hamburger menu or bottom tab bar
  - Desktop: horizontal top nav (current)

Verify: Test at 375px, 768px, 1440px widths.
Commit: "feat: add responsive layout breakpoints"
```

### Task 3.3: Data Export/Import

```
Create src/services/exportService.ts:
  - exportAll(): Creates a ZIP containing:
    - artworks.json (all artwork records)
    - collections.json (all collections)
    - images/ directory with all display-size images
  - importAll(zipFile: File): Reads ZIP and restores all data

Add export/import buttons to a Settings section.
Commit: "feat: implement data export and import"
```

### Task 3.4: Loading States

```
Add loading states to:
  - SketchbookScreen (while loading from IndexedDB)
  - ArtworkDetailScreen (while loading image)
  - Upload flow (while compressing)

Use LoadingSpinner (ART-11 spiral) for inline loading.
Use existing ProcessingScreen aesthetic for full-screen loading.
Commit: "feat: add loading states with artistic loading indicators"
```

---

## Phases 4-8: Summary

### Phase 4: Timeline + Progress (see PRODUCT_SCOPE.md for features)
- Build CalendarView component
- Build TimelineScreen
- Build ProgressStudioScreen with version comparison
- Reuse existing side-by-side comparison from ArtworkDetailScreen

### Phase 5: Discovery (see ARTISTIC_DISCOVERY_ARCHITECTURE.md)
- Create discoveryService with mock → real API swap
- Build DiscoverScreen (refactor of UploadScreen)
- Connect ProcessingScreen to real API
- Build SavedReferencesScreen

### Phase 6: Creative Space
- Build CreativeSpaceScreen with inspiration wall
- Build SuppliesScreen with material CRUD
- Add material-to-artwork linking

### Phase 7: AI Enhancement (see AI_FEATURE_FEASIBILITY.md)
- Add Gemini API integration
- Add AI-suggested tags, medium, descriptions
- All AI output is always editable and dismissable

### Phase 8: Cloud + Auth
- Add Supabase authentication
- Migrate IndexedDB to Supabase Postgres + Storage
- Implement cross-device sync

---

## Error Prevention Checklist

Before submitting any code:

1. `npm run build` — passes with 0 TypeScript errors
2. `npm run dev` — app loads, all routes accessible
3. No `any` type assertions without explicit justification
4. No inline hex colors — all colors via CSS custom properties
5. No new font families — only Fraunces and Inter
6. No heavy drop shadows — only warm-tinted subtle shadows
7. All interactive elements have double-outline hover/focus
8. All images have appropriate alt text
9. All new screens have empty states with ART-01
10. All error states use ART-09
