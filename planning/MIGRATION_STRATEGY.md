# Migration Strategy

## Principle

Never destroy the existing prototype. Every modification should be additive or refactoring — the app should remain runnable after every commit. If a screen works today, it must continue to work (or work better) tomorrow.

---

## Phase 0: Pre-Migration Preparation

### 0.1 — Git Repository Setup

If not already initialized:
```bash
git init
echo "node_modules/\ndist/\n.env\n*.log" > .gitignore
git add -A
git commit -m "feat: initial prototype state"
```

**Tag the prototype state** so it can always be restored:
```bash
git tag v0.0-prototype
```

### 0.2 — Clean Up Redundant Files

| Action | Files | Reason |
|---|---|---|
| Delete | `artist-refrence/` (root directory, misspelled) | Redundant copy of `public/artist-reference/` |
| Delete | 40 duplicate files in `public/artist-reference/` | Keep only `art-01.jpeg` through `art-20.jpeg` |
| Update | `scripts/setup-assets.js` | No longer needed if originals are renamed |
| Delete | `dist/` from version control | Build output, should be .gitignored |

### 0.3 — Verify Dev Environment

```bash
npm install
npm run dev
# Confirm all 7 screens render correctly
```

---

## Phase 1: Foundation (Non-Destructive)

### Strategy: Add new infrastructure alongside existing code. Nothing breaks.

#### 1.1 — Install Dependencies

```bash
npm install react-router-dom zustand idb browser-image-compression date-fns uuid
npm install -D @types/uuid
```

#### 1.2 — Create Type System

**Action:** Create `src/types/` directory with new TypeScript interfaces.
**Impact on existing code:** None — new files only.

```
src/types/
├── artwork.ts        # New Artwork type (extends existing)
├── collection.ts     # Collection type
├── project.ts        # Project type
├── material.ts       # Material type
├── reference.ts      # SavedReference type
├── search.ts         # DiscoveryResult type
└── index.ts          # Re-exports
```

**Migration note:** The existing `Artwork` interface in `src/data/artworks.ts` must co-exist with the new `PersonalArtwork` type until the discovery feature is reconnected. Keep both, give them different names.

#### 1.3 — Create Data Layer

**Action:** Create `src/services/` directory with IndexedDB operations.
**Impact on existing code:** None — new files only.

```
src/services/
├── db.ts             # IndexedDB initialization + schema
├── artworkService.ts # CRUD operations
├── imageService.ts   # Blob storage + compression
└── index.ts
```

#### 1.4 — Create Zustand Stores

**Action:** Create `src/stores/` directory.
**Impact on existing code:** None — stores are created but not yet connected.

#### 1.5 — Install Router

**Action:** Create `src/router.tsx` with route definitions.
**Impact on existing code:** `App.tsx` must be modified to use `RouterProvider` instead of the manual `useState`-based screen switching.

**This is the first breaking change.** Handle it carefully:

```typescript
// OLD (in App.tsx):
const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
// ... switch(currentScreen) { case 'home': return <HomeScreen />; ... }

// NEW (in App.tsx):
return <RouterProvider router={router} />;
```

**Migration steps:**
1. Create `router.tsx` with routes mapping to existing screens
2. Modify each screen's navigation functions (`onBack`, `onGoDiscover`, etc.) to use `useNavigate()` instead of callback props
3. Remove `currentScreen` state from App.tsx
4. Pass shared state via Zustand stores instead of App.tsx props
5. Test every screen transition

#### 1.6 — Extract Reusable Components

**Action:** Create `src/components/ui/` with extracted primitives.
**Impact on existing code:** Screens continue using inline styles initially. Components are built and tested standalone. Screens migrate to using components one at a time.

**Order of extraction:**
1. `Button` — used everywhere
2. `Card` — used in results, favorites, about
3. `ArtworkMat` — used in 5 screens
4. `Badge` / `MatchBadge` — used in results, detail
5. `EmptyState` — used in favorites, (future: results, timeline)
6. `PageHeader` — used in every screen
7. `DropZone` — used in upload
8. `Input` / `TagInput` — needed for new edit forms

---

## Phase 2: Personal Sketchbook (Additive)

### Strategy: Build new screens that use the new data layer. Existing screens still work with mock data.

#### 2.1 — Upload Flow (Modify Existing)

**Current:** `UploadScreen` accepts a file, creates an object URL, passes to App.tsx state.
**New:** `UploadScreen` accepts a file, compresses it, stores in IndexedDB, creates an artwork record, navigates to edit form.

**Migration:**
1. Keep existing `UploadScreen` visual design
2. Replace `onUpload` callback with `imageService.processUpload()` + `artworkService.create()`
3. Navigate to new `ArtworkEditScreen` instead of processing screen
4. The "Discover Kindred" button becomes a separate flow (later)

#### 2.2 — New Screens (Additive)

Build these as new route destinations — they don't replace anything:

- `SketchbookScreen` at `/sketchbook` — gallery of personal artworks from IndexedDB
- `ArtworkEditScreen` at `/sketchbook/:id/edit` — metadata editing form

#### 2.3 — Modify HomeScreen

**Current:** Hero landing with single CTA "Upload a drawing"
**New:** If user has artworks → show recent work grid. If empty → show current hero.

**Migration:**
1. Add a conditional: `artworks.length > 0 ? <RecentWork /> : <HeroLanding />`
2. Preserve the existing hero as the empty state
3. Add "View Sketchbook" link to navigation

#### 2.4 — Modify Detail Screen

**Current:** `ArtworkDetailScreen` displays a discovery result with comparison to uploaded drawing.
**New:** Same component should also display a personal artwork from the sketchbook.

**Migration:**
1. Create a `PersonalArtworkDetail` variant that shows personal metadata instead of similarity analysis
2. Route `/sketchbook/:id` loads from IndexedDB
3. Route `/discover/results/:id` loads from search results (existing mock data)
4. Share the `ArtworkMat` and `Badge` components between both

---

## Phase 3: Polish (Non-Destructive)

- Add error boundaries around each screen
- Add responsive breakpoints to existing CSS
- Implement data export/import
- Add PWA support (service worker, manifest)

---

## Phase 4: Timeline + Progress (Additive)

New screens only — no modification of existing screens.

---

## Phase 5: Discovery (Modify Existing)

### Strategy: Reconnect the existing discovery prototype to the new data layer.

**Current flow:** Upload → Processing → Mock Results → Mock Detail
**New flow:** Upload → Processing → Real API → Filtered Results → Detail with Attribution

**Migration:**
1. Create `DiscoverScreen` at `/discover` — reuses `UploadScreen` layout
2. `ProcessingScreen` becomes `/discover/processing` — keep visual, add real API call
3. `ResultsScreen` becomes `/discover/results` — keep visual, swap mock data for API results
4. `ArtworkDetailScreen` for results becomes `/discover/results/:id` — keep visual, use real data
5. Add `SavedReferencesScreen` at `/saved` — variant of `FavoritesScreen`

---

## Phase 6-8: Creative Space + AI + Cloud (Additive)

New screens and services only. Minimal modification of existing code.

---

## Risk Mitigation

### What Could Break

| Change | Risk | Mitigation |
|---|---|---|
| Router introduction | All screen navigation breaks | Add routes one-by-one, test each transition |
| Removing App.tsx state | Screens that receive props will error | Create Zustand stores first, connect screens, then remove App.tsx props |
| Modifying UploadScreen | Current upload flow breaks | Keep existing `onUpload` working while adding new flow |
| Modifying HomeScreen | Current hero disappears | Conditional rendering preserves hero as empty state |
| Adding new dependencies | Bundle size increase | All recommended libraries are <15KB gzipped each |

### Rollback Points

After each phase, create a git tag:
```bash
git tag v0.5-foundation   # After Phase 1
git tag v1.0-sketchbook    # After Phase 2
git tag v1.0.1-polish      # After Phase 3
git tag v1.1-timeline      # After Phase 4
git tag v1.2-discovery     # After Phase 5
```

### Verification After Each Phase

1. All existing screens still render
2. No console errors
3. Navigation between all screens works
4. Design tokens are still applied correctly
5. Build (`npm run build`) succeeds with no TypeScript errors
