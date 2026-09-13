# Data Model

## Design Principles

1. **Local-first:** All tables map to IndexedDB object stores
2. **Soft deletion:** `deletedAt` timestamp instead of hard delete
3. **Timestamps on everything:** `createdAt`, `updatedAt` on every record
4. **UUIDs for IDs:** Globally unique, no auto-increment
5. **Denormalize where it helps reads:** Store thumbnail references inline
6. **Separate creation date from upload date:** Users photograph old drawings

---

## Entity Definitions

### Artwork

The core entity. Represents a single drawing, sketch, or painting.

```typescript
interface Artwork {
  id: string;                    // UUID
  title: string;                 // Required
  description?: string;          // Optional prose description
  
  // Dates
  creationDate: string;          // ISO date — when the artwork was created (user-entered)
  uploadDate: string;            // ISO datetime — when it was uploaded to the app
  updatedAt: string;             // ISO datetime — last metadata edit
  deletedAt?: string;            // ISO datetime — soft delete
  
  // Media
  imageId: string;               // Reference to ImageBlob
  thumbnailId: string;           // Reference to ImageBlob (thumbnail)
  originalImageId?: string;      // Reference to ImageBlob (original uncompressed)
  
  // Classification
  medium?: string;               // "Pencil", "Ink pen", "Marker", "Watercolor", etc.
  subject?: string;              // Brief subject description
  mood?: string;                 // "Whimsical", "Contemplative", etc.
  
  // Organization
  tags: string[];                // Free-form tags
  collectionIds: string[];       // References to Collection
  isFavorite: boolean;
  
  // Progress tracking
  projectId?: string;            // Reference to Project (if part of a progress series)
  versionNumber?: number;        // Version within a project (1, 2, 3...)
  versionNotes?: string;         // Notes about this version
  
  // Status
  status: 'completed' | 'in-progress' | 'abandoned' | 'study';
  
  // Materials used
  materialIds: string[];         // References to Material
  
  // Notes
  notes?: string;                // Free-form notes
  
  // AI-suggested metadata (always editable by user)
  aiSuggestedTags?: string[];
  aiSuggestedMedium?: string;
  aiSuggestedMood?: string;
  aiDescription?: string;
}
```

### ImageBlob

Stores binary image data in IndexedDB.

```typescript
interface ImageBlob {
  id: string;                    // UUID
  blob: Blob;                    // The actual image data
  mimeType: string;              // "image/jpeg", "image/webp", etc.
  width: number;                 // Pixel width
  height: number;                // Pixel height
  sizeBytes: number;             // File size
  variant: 'original' | 'display' | 'thumbnail';
  artworkId: string;             // Reference back to Artwork
  createdAt: string;
}
```

### Collection

Groups of related artworks (albums/folders).

```typescript
interface Collection {
  id: string;                    // UUID
  name: string;                  // Required
  description?: string;
  coverImageId?: string;         // Reference to ImageBlob (thumbnail of representative artwork)
  sortOrder: number;             // For manual ordering
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

### Project

A progress tracking project containing multiple versions of a drawing.

```typescript
interface Project {
  id: string;                    // UUID
  title: string;                 // Required
  goal?: string;                 // What the user is trying to achieve
  startDate: string;             // ISO date
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  reflections?: string;          // Personal reflections
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

### Tag

Normalized tag for consistent filtering.

```typescript
interface Tag {
  id: string;                    // UUID
  name: string;                  // Lowercase, trimmed
  color?: string;                // Optional display color
  usageCount: number;            // How many artworks use this tag
  createdAt: string;
}
```

### Material

A supply or material the user owns or wants.

```typescript
interface Material {
  id: string;                    // UUID
  name: string;                  // Required — "Prismacolor pencil set"
  category: string;              // "Pencil" | "Pen" | "Marker" | "Paint" | "Paper" | "Brush" | "Other"
  color?: string;                // Hex color if relevant
  imageId?: string;              // Optional photo
  quantity?: string;             // "Full set", "3 remaining", etc.
  storageLocation?: string;      // "Top drawer", "Desk", etc.
  status: 'have' | 'want-to-try' | 'maybe-later' | 'retired';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
```

### SavedReference

An externally discovered artwork saved for inspiration.

```typescript
interface SavedReference {
  id: string;                    // UUID
  title: string;
  artist?: string;
  sourceDomain: string;          // "metmuseum.org"
  sourcePageUrl: string;         // Full URL to original page
  sourceImageUrl: string;        // URL of the image
  thumbnailBlob?: Blob;          // Locally cached thumbnail
  similarityScore?: number;      // 0-100, from search
  similarityCategory?: string;   // "linework", "palette", etc.
  similarityExplanation?: string;
  dominantColors?: string[];
  medium?: string;
  tags: string[];
  notes?: string;                // User's personal notes
  relatedArtworkId?: string;     // The user artwork that prompted this discovery
  createdAt: string;
  deletedAt?: string;
}
```

### SearchSession

Records a similarity search session.

```typescript
interface SearchSession {
  id: string;                    // UUID
  sourceArtworkId?: string;      // Reference to user's Artwork (if from sketchbook)
  sourceImageId: string;         // Reference to ImageBlob (the searched image)
  resultCount: number;
  timestamp: string;
  provider: 'mock' | 'google-vision' | 'bing-visual';
}
```

### CalendarEntry

Derived/computed — not stored directly. Generated by querying artworks by `creationDate`.

```typescript
interface CalendarEntry {
  date: string;                  // ISO date
  artworkIds: string[];          // Artworks created on this date
  count: number;
}
```

### CreativeSpaceSettings

User's personal art room configuration.

```typescript
interface CreativeSpaceSettings {
  id: 'singleton';               // Only one record
  roomName?: string;             // "My Art Corner"
  currentFocus?: string;         // "Learning watercolor techniques"
  displayWallArtworkIds: string[];  // Artworks pinned to virtual display
  inspirationBoardReferenceIds: string[];  // Saved references on inspiration board
  setupChecklist: { item: string; done: boolean }[];
  roomPhotoId?: string;          // Optional room photo
  updatedAt: string;
}
```

---

## IndexedDB Schema

### Object Stores

| Store Name | Key Path | Indexes |
|---|---|---|
| `artworks` | `id` | `creationDate`, `uploadDate`, `medium`, `status`, `isFavorite`, `projectId`, `deletedAt` |
| `imageBlobs` | `id` | `artworkId`, `variant` |
| `collections` | `id` | `name`, `sortOrder`, `deletedAt` |
| `projects` | `id` | `status`, `startDate`, `deletedAt` |
| `tags` | `id` | `name` (unique) |
| `materials` | `id` | `category`, `status`, `deletedAt` |
| `savedReferences` | `id` | `sourceDomain`, `relatedArtworkId`, `deletedAt` |
| `searchSessions` | `id` | `timestamp`, `sourceArtworkId` |
| `settings` | `id` | (none needed) |

### Migration Order

1. Create `artworks` + `imageBlobs` stores (Phase 2)
2. Create `collections` + `tags` stores (Phase 2)
3. Create `projects` store (Phase 4)
4. Create `materials` store (Phase 6)
5. Create `savedReferences` + `searchSessions` stores (Phase 5)
6. Create `settings` store (Phase 6)

---

## Relationships

```
Artwork ──┬── has many → ImageBlob (original, display, thumbnail)
          ├── belongs to many → Collection (via collectionIds array)
          ├── has many → Tag (via tags array)
          ├── uses many → Material (via materialIds array)
          ├── optionally belongs to → Project (via projectId)
          └── prompted → SavedReference (via relatedArtworkId)

Project ── has many → Artwork (versions, via projectId)

Collection ── has many → Artwork (via artwork.collectionIds)

Material ── used in many → Artwork (via artwork.materialIds)

SavedReference ── related to → Artwork (via relatedArtworkId)

SearchSession ── searched with → Artwork (via sourceArtworkId)
```

---

## Storage Estimates

| Entity | Expected Count (1 year) | Avg Record Size | Total |
|---|---|---|---|
| Artwork records | 200-500 | 1KB | 0.5MB |
| ImageBlobs (display) | 200-500 | 200KB | 100MB |
| ImageBlobs (thumbnails) | 200-500 | 30KB | 15MB |
| ImageBlobs (originals) | 200-500 | 2MB | 1GB |
| Collections | 10-30 | 0.5KB | 15KB |
| Projects | 5-20 | 0.5KB | 10KB |
| Tags | 50-200 | 0.1KB | 20KB |
| Materials | 20-100 | 0.5KB | 50KB |
| SavedReferences | 50-200 | 2KB | 400KB |
| **Total** | | | **~1.1GB** |

IndexedDB storage limit in Chrome: typically 60% of available disk space (6-60GB). A year of hobby art storage is well within limits.
