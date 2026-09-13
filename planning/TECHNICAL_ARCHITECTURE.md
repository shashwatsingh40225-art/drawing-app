# Technical Architecture

## Architecture Philosophy

**Local-first, progressively enhanced.** The MVP runs entirely in the browser with no server dependency. Data is stored in IndexedDB. Image files are stored as blobs in IndexedDB or via the Origin Private File System (OPFS). This enables:
- Zero hosting cost for the prototype
- Instant load times
- Full offline capability
- No authentication complexity for MVP
- Migration path to cloud storage later

---

## Recommended Stack

### Frontend (Keep Current)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 19 (keep) | Already in use, no reason to change |
| Language | TypeScript (keep) | Already in use |
| Build | Vite (keep) | Already in use, fast DX |
| Icons | lucide-react (keep) | Already in use, consistent stroke weight |
| Fonts | Fraunces + Inter via Google Fonts (keep) | Already loaded |

### New Frontend Dependencies

| Library | Purpose | Bundle Impact |
|---|---|---|
| `react-router-dom` v7 | URL routing, deep links, browser history | ~14KB gzipped |
| `zustand` | Lightweight state management | ~1.5KB gzipped |
| `idb` | IndexedDB wrapper (Promise-based) | ~1.2KB gzipped |
| `browser-image-compression` | Client-side image resize/compress | ~30KB gzipped |
| `date-fns` | Date formatting and manipulation | Tree-shakeable |
| `uuid` | Generate unique IDs | ~1KB |

### Storage (MVP — Local Only)

| Storage | Use |
|---|---|
| IndexedDB (via `idb`) | All structured data: artworks, projects, collections, tags, materials, references |
| IndexedDB Blob Storage | Artwork image files (compressed) |
| localStorage | User preferences, UI state |

### Future Backend (Post-MVP)

| Layer | Recommendation | Rationale |
|---|---|---|
| Backend | Supabase (free tier) | Auth, Postgres DB, file storage, realtime — all-in-one |
| Database | Supabase Postgres | Relational data with JSON fields for flexibility |
| File Storage | Supabase Storage | S3-compatible, 1GB free |
| Auth | Supabase Auth | Email/password, OAuth — built-in |
| Alternative | Firebase | Firestore + Storage + Auth — Google ecosystem |

---

## Frontend Architecture

### Folder Structure (Proposed)

```
src/
├── components/          # Shared, reusable components
│   ├── ui/              # Design system primitives (Button, Card, Input, Badge)
│   ├── artwork/         # Artwork-specific components (ArtworkCard, ArtworkMat, etc.)
│   ├── layout/          # Layout components (PageHeader, EmptyState, etc.)
│   └── icons/           # Custom SVG components (EyeMark, ConcentricPortal, etc.)
├── screens/             # Page-level components (one per route)
├── data/                # Mock data (progressively replaced)
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── services/            # Data access layer (IndexedDB operations, future API calls)
├── types/               # Shared TypeScript types
├── utils/               # Pure utility functions (image processing, date helpers)
├── constants/           # App-wide constants
├── App.tsx              # Root with RouterProvider
├── router.tsx           # Route definitions
├── index.css            # Design system tokens (keep)
└── main.tsx             # Entry point (keep)
```

### Routing Plan

| Route | Screen | Notes |
|---|---|---|
| `/` | HomeScreen | Dashboard with recent work |
| `/sketchbook` | SketchbookScreen | Gallery grid |
| `/sketchbook/:id` | ArtworkDetailScreen | Individual artwork |
| `/sketchbook/:id/edit` | ArtworkEditScreen | Metadata editing |
| `/upload` | UploadScreen | Add new drawing |
| `/timeline` | TimelineScreen | Calendar/chronological view |
| `/progress` | ProgressStudioScreen | Projects overview |
| `/progress/:id` | ProjectDetailScreen | Single project with versions |
| `/discover` | DiscoverScreen | Upload for similarity search |
| `/discover/results` | ResultsScreen | Search results |
| `/discover/results/:id` | ResultDetailScreen | Individual result |
| `/space` | CreativeSpaceScreen | Personal art room |
| `/space/supplies` | SuppliesScreen | Materials list |
| `/saved` | SavedReferencesScreen | Saved discovery references |
| `/about` | AboutScreen | Studio manifesto (keep) |

### State Management Architecture

```
stores/
├── artworkStore.ts      # Artworks CRUD, filtering, favorites
├── collectionStore.ts   # Collections CRUD
├── projectStore.ts      # Progress projects and versions
├── materialStore.ts     # Supplies and materials
├── referenceStore.ts    # Saved discovery references
├── uiStore.ts           # UI state: active filters, modal state, sidebar
└── searchStore.ts       # Discovery search state and results
```

Each store follows the pattern:
- Load from IndexedDB on init
- In-memory state for fast reads
- Write-through to IndexedDB on mutations
- Optimistic updates for UI responsiveness

---

## Image Handling Pipeline

### Upload Flow

```
User selects image
  → Validate file type (JPEG, PNG, WebP, TIFF)
  → Validate file size (max 20MB)
  → Read as ArrayBuffer
  → Generate UUID for artwork
  → Compress to display size (max 1920px, ~80% quality, WebP if supported)
  → Generate thumbnail (max 400px, ~70% quality)
  → Store original blob in IndexedDB
  → Store display blob in IndexedDB
  → Store thumbnail blob in IndexedDB
  → Create artwork record with metadata
  → Navigate to artwork detail for metadata editing
```

### Image Compression Strategy

| Size | Max Dimension | Quality | Format | Use |
|---|---|---|---|---|
| Thumbnail | 400px | 70% | WebP/JPEG | Gallery grid, timeline |
| Display | 1920px | 80% | WebP/JPEG | Detail view, comparison |
| Original | As uploaded | 100% | Original | Archive, download, zoom |

### Storage Estimates (IndexedDB)

- Average compressed display image: ~200KB
- Average thumbnail: ~30KB
- Average original: ~2MB
- Per artwork total: ~2.3MB
- For 100 artworks: ~230MB
- For 500 artworks: ~1.15GB
- IndexedDB limit (Chrome): 60% of disk space (typically 6-60GB)

---

## Data Access Layer

### Service Pattern

```typescript
// services/artworkService.ts
export const artworkService = {
  getAll: () => Promise<ArtworkRecord[]>,
  getById: (id: string) => Promise<ArtworkRecord | null>,
  create: (data: CreateArtworkInput) => Promise<ArtworkRecord>,
  update: (id: string, data: UpdateArtworkInput) => Promise<ArtworkRecord>,
  delete: (id: string) => Promise<void>,
  getByCollection: (collectionId: string) => Promise<ArtworkRecord[]>,
  getByDateRange: (start: Date, end: Date) => Promise<ArtworkRecord[]>,
  getFavorites: () => Promise<ArtworkRecord[]>,
  search: (query: string) => Promise<ArtworkRecord[]>,
}
```

This pattern allows swapping IndexedDB for Supabase later by changing only the service implementation.

---

## Security and Privacy

### MVP (Local-Only)
- All data stays in the user's browser
- No network requests for personal data
- No analytics or tracking
- Images never leave the device

### Future (Cloud)
- Authentication required before cloud sync
- End-to-end encryption for stored images (Supabase supports this)
- User controls what is synced
- GDPR-compliant data export/deletion
- No third-party access to artwork without explicit consent

---

## API Boundaries

### Internal APIs (Services)
- `artworkService` — CRUD for artworks and images
- `collectionService` — CRUD for collections
- `projectService` — CRUD for progress projects and versions
- `materialService` — CRUD for supplies
- `referenceService` — CRUD for saved references
- `searchService` — Similarity search (mock initially)
- `imageService` — Compression, thumbnail generation, blob management
- `calendarService` — Date grouping, timeline queries

### External APIs (Future)
- Google Cloud Vision Web Detection — similarity search
- Gemini API — AI metadata suggestions
- Supabase — auth, database, storage

---

## Error Handling Strategy

| Layer | Pattern |
|---|---|
| Service layer | Return `Result<T, Error>` or throw typed errors |
| Store layer | Catch errors, set error state, provide retry |
| Component layer | Error boundaries + fallback UI (ART-09 mushroom creature) |
| Network (future) | Retry with exponential backoff, offline queue |
| Image processing | Graceful degradation (skip compression if it fails) |

---

## Performance Considerations

- **Lazy load screens** via React.lazy + Suspense
- **Virtualize long lists** (gallery with 100+ artworks) using `react-window` or similar
- **Lazy load images** with IntersectionObserver
- **Debounce search/filter operations** 
- **Web Workers** for image compression (keep UI thread responsive)
- **Progressive image loading** — show thumbnail first, then full image
