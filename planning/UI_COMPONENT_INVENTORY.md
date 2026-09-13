# UI Component Inventory

## Existing Components to Preserve

These components already exist and implement the design system correctly. They should be preserved and potentially enhanced, not replaced.

| Component | File | Purpose | Modification Needed |
|---|---|---|---|
| `EyeMark` | `src/components/EyeMark.tsx` | SVG brand mark/logo | None — keep as-is |
| `FeatherDivider` | `src/components/FeatherDivider.tsx` | SVG decorative section divider | None — keep as-is |
| `ConcentricPortal` | `src/components/ConcentricPortal.tsx` | Animated SVG for processing screen | None — keep as-is |
| `Navigation` | `src/components/Navigation.tsx` | Top navigation bar | Needs refactoring for router links + expanded nav items |

---

## New Design System Primitives (src/components/ui/)

These are the foundational building blocks that all other components use. Every one must implement the design tokens from `index.css`.

### Button

```
Variants: primary, secondary, accent, ghost, destructive
Sizes: sm, md, lg
Props: icon (optional leading icon), loading state, disabled state
States: default, hover (double-outline effect), active, focus, disabled
```

### Card

```
Variants: default, elevated, interactive (clickable)
Props: padding size, hover effect toggle
States: default, hover (double-outline + lift), active
```

### ArtworkMat

```
Purpose: The cream-background artwork display frame
Props: imageUrl, alt, size (sm/md/lg/full), aspectRatio
Implements: The `artwork-mat` and `artwork-img-blend` CSS classes already in index.css
```

### Badge

```
Variants: match (with score), tag, status
Colors: accent, teal, secondary, muted
Props: label, icon (optional)
```

### Input

```
Variants: text, textarea, date, select
Props: label, hint text, error message, required
States: default, focus (double-outline), error, disabled
```

### TagInput

```
Purpose: Multi-value tag input with autocomplete
Props: value (string[]), suggestions, onAdd, onRemove
```

### Modal

```
Props: isOpen, onClose, title, size (sm/md/lg)
Implements: Plum-tinted scrim, larger corner radius (20px), warm shadow
```

### EmptyState

```
Props: artworkSrc (ART-01 or ART-09), headline, description, actionLabel, onAction
Implements: Centered artwork + message pattern used in FavoritesScreen
```

### PageHeader

```
Props: icon, eyebrowLabel, title, description, action (optional button)
Implements: The consistent header pattern across screens
```

### MatchBadge

```
Props: score (0-100), category (optional)
Implements: Color-coded pill with percentage text (never color-only)
```

### ProgressBar

```
Props: value (0-100), color, label
Implements: The dimension analysis bars from ArtworkDetailScreen
```

### LoadingSpinner

```
Purpose: Small inline loading indicator
Implements: Simplified ART-11 spiral animation (40-80px)
```

### DropZone

```
Props: onDrop, accept (mime types), maxSize
Implements: Ruled-notebook-page styling, drag-hover with double-outline
```

### ConfirmDialog

```
Props: title, message, confirmLabel, cancelLabel, variant (danger/warning/info)
```

---

## New Artwork Components (src/components/artwork/)

### ArtworkCard

```
Purpose: Grid card for gallery/results
Props: artwork, onSelect, onToggleFavorite, onToggleSave
Shows: Thumbnail in mat, title, artist/medium, date badge, favorite star
Hover: Double-outline + surface lift
```

### ArtworkGrid

```
Purpose: Responsive grid container with consistent gutters
Props: artworks, loading, emptyState, onCardClick
Implements: 2 columns mobile, 3-4 desktop, 24px+ gutters
```

### ArtworkMetadataPanel

```
Purpose: Detail view metadata display
Props: artwork
Shows: Title, medium, date, tags, description, notes, collection badges, material badges
```

### ArtworkEditForm

```
Purpose: Metadata editing form
Props: artwork, onSave, onCancel
Fields: Title, description, creation date, medium (select), tags (tag input), notes, status, collection assignment
```

### ArtworkComparison

```
Purpose: Side-by-side or overlay comparison of two images
Props: image1, image2, mode ('side-by-side' | 'overlay-slider')
Reuses: Existing comparison mode from ArtworkDetailScreen
```

### UploadPreview

```
Purpose: Post-upload preview with metadata entry form
Props: imageBlob, onConfirm, onCancel
Shows: Image preview + quick metadata form
```

---

## New Layout Components (src/components/layout/)

### AppShell

```
Purpose: Main layout wrapper with navigation and content area
Props: children
Includes: Navigation (sticky header), main content area, footer (optional)
```

### PageContainer

```
Purpose: Consistent page-level max-width and padding
Props: children, variant ('default' | 'narrow' | 'full-bleed')
Defaults: max-width 1280px, 24px horizontal padding
```

### TwoColumnLayout

```
Purpose: Detail views with 60/40 split
Props: left, right
Collapses: To single column on mobile (left stacks on top)
```

### FilterBar

```
Purpose: Horizontal filter controls for galleries/timelines
Props: filters (array), onFilterChange, activeFilters
Supports: Dropdown selects, toggle chips, date range picker
```

---

## New Screen-Level Components (src/screens/)

### New Screens to Build

| Screen | Route | Priority | Complexity |
|---|---|---|---|
| `SketchbookScreen` | `/sketchbook` | Phase 2 | Medium |
| `ArtworkEditScreen` | `/sketchbook/:id/edit` | Phase 2 | Medium |
| `TimelineScreen` | `/timeline` | Phase 4 | High |
| `ProgressStudioScreen` | `/progress` | Phase 4 | High |
| `ProjectDetailScreen` | `/progress/:id` | Phase 4 | High |
| `DiscoverScreen` | `/discover` | Phase 5 | Low (refactor of Upload) |
| `CreativeSpaceScreen` | `/space` | Phase 6 | Medium |
| `SuppliesScreen` | `/space/supplies` | Phase 6 | Medium |
| `SavedReferencesScreen` | `/saved` | Phase 5 | Low (variant of Favorites) |

### Screens to Preserve and Modify

| Screen | Current Route | Modifications Needed |
|---|---|---|
| `HomeScreen` | `/` | Add recent artworks section, update CTAs |
| `UploadScreen` | `/upload` | Connect to real image service, add metadata form |
| `ProcessingScreen` | `/discover/processing` | Keep visual, connect to real service later |
| `ResultsScreen` | `/discover/results` | Connect to real service later |
| `ArtworkDetailScreen` | `/sketchbook/:id` | Refactor for personal artworks (not just results) |
| `FavoritesScreen` | (merged into filters) | May become a filtered view of sketchbook |
| `AboutScreen` | `/about` | Keep as-is |

---

## Component Dependency Graph

```
AppShell
├── Navigation
│   ├── EyeMark
│   └── Button
├── PageContainer
│   ├── PageHeader
│   └── [Screen Content]
│       ├── ArtworkGrid
│       │   ├── ArtworkCard
│       │   │   ├── ArtworkMat
│       │   │   ├── Badge
│       │   │   └── Button (icon)
│       │   └── EmptyState
│       ├── FilterBar
│       │   ├── Input (select)
│       │   └── Badge (toggle)
│       ├── ArtworkMetadataPanel
│       │   ├── Badge
│       │   ├── ProgressBar
│       │   └── FeatherDivider
│       ├── ArtworkEditForm
│       │   ├── Input
│       │   ├── TagInput
│       │   └── Button
│       ├── ArtworkComparison
│       │   └── ArtworkMat
│       ├── DropZone
│       └── Modal
│           └── ConfirmDialog
└── LoadingSpinner (inline)
```

---

## Reuse Audit: What Already Exists vs. What's New

| Capability | Existing Code | New Component | Migration Plan |
|---|---|---|---|
| Artwork display frame | Inline `artwork-mat` div in every screen | `ArtworkMat` component | Extract CSS class into component |
| Result card | Inline div in `ResultsScreen` (~80 lines each) | `ArtworkCard` component | Extract, parameterize |
| Match score badge | Inline span with `match-badge` class | `MatchBadge` component | Extract |
| Dimension progress bars | 4 inline divs in `ArtworkDetailScreen` (~40 lines each) | `ProgressBar` component | Extract, loop |
| Tag chips | Inline map in `ArtworkDetailScreen` | `Badge` component | Extract |
| Empty state | Inline div in `FavoritesScreen` (~30 lines) | `EmptyState` component | Extract, parameterize |
| Page headers | Inline divs at top of each screen | `PageHeader` component | Extract |
| Double-outline hover | CSS class `.double-outline-card` | Keep as CSS class, apply to `Card` | Already CSS-based |
| Navigation | `Navigation.tsx` (complete) | Modify for router | Refactor links |
| Upload dropzone | Inline div in `UploadScreen` (~80 lines) | `DropZone` component | Extract |

### Extraction Priority

1. **ArtworkMat** — used in 5+ screens, always the same pattern
2. **ArtworkCard** — used in Results + Favorites + will be used in Sketchbook
3. **EmptyState** — used in 2 screens, will be used in 3+ more
4. **PageHeader** — used in every screen
5. **Badge/MatchBadge** — used in Results, Detail, will be used widely
6. **ProgressBar** — used in Detail, will be used in comparison views
7. **DropZone** — used in Upload, will be used in Discover
