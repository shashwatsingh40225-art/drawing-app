# Kin — Unified Implementation Playbook

> **STATUS: AUTHORITATIVE** — This is the single source of truth for implementation.  
> **Execute tasks in order. Do not skip. Do not reorder. Do not add scope.**  
> **When in doubt, check DECISIONS_AND_ASSUMPTIONS.md.**

---

## Document Map

| Document | Purpose | Read When |
|---|---|---|
| **This file** (UNIFIED_PLAYBOOK.md) | Task-by-task implementation instructions | Always — primary instruction set |
| DECISIONS_AND_ASSUMPTIONS.md | Resolved design/tech decisions | When a task says "See D-XX" |
| DESIGN_INTEGRITY_GUIDELINES.md | Visual design rules | Before creating any component or screen |
| UI_COMPONENT_INVENTORY.md | Component specifications | When building new components |
| FREE_TIER_AND_COST_AUDIT.md | Budget constraints | If considering any external service |

---

## Prerequisites

Before starting any task:
1. Run `npm run dev` — verify the prototype still works
2. Read `DESIGN_INTEGRITY_GUIDELINES.md` once (it's short)
3. Have the Supabase project URL and anon key ready
4. Have the Vercel project connected to the GitHub repo

---

## Phase 1: Foundation (Tasks 1.1 – 1.8)

> **Goal:** Install dependencies, set up Supabase, routing, state management, and auth. No visual changes to existing screens yet.

---

### Task 1.1: Install Dependencies

**Objective:** Add the 4 new runtime dependencies.

**Command:**
```bash
npm install react-router-dom zustand @supabase/supabase-js browser-image-compression
```

**Acceptance criteria:**
- [ ] `npm run dev` still works after install
- [ ] `npm run build` produces no TypeScript errors
- [ ] `package.json` shows 7 runtime dependencies

---

### Task 1.2: Create Supabase Client

**Objective:** Set up the Supabase client singleton.

**Files to create:**
- `src/lib/supabase.ts`

**Implementation:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Files to create:**
- `.env.local` (add to `.gitignore`)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Files to modify:**
- `.gitignore` — add `.env.local` if not already present

**Acceptance criteria:**
- [ ] `import { supabase } from '@/lib/supabase'` resolves without error
- [ ] `.env.local` is in `.gitignore`

---

### Task 1.3: Set Up Supabase Database Schema

**Objective:** Create the database tables in the Supabase dashboard (or via SQL editor).

**SQL to execute in Supabase SQL Editor:**

```sql
-- ========================================
-- Artworks table
-- ========================================
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  medium TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'in-progress', 'study', 'abandoned')),
  notes TEXT DEFAULT '',
  image_path TEXT,
  thumbnail_path TEXT,
  collection_ids UUID[] DEFAULT '{}'
);

-- RLS
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own artworks"
  ON artworks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own artworks"
  ON artworks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own artworks"
  ON artworks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own artworks"
  ON artworks FOR DELETE
  USING (auth.uid() = user_id);

-- Index for common queries
CREATE INDEX idx_artworks_user_id ON artworks(user_id);
CREATE INDEX idx_artworks_creation_date ON artworks(user_id, creation_date DESC);
CREATE INDEX idx_artworks_deleted_at ON artworks(user_id, deleted_at);

-- ========================================
-- Collections table
-- ========================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_collections_user_id ON collections(user_id);
```

**Supabase Storage setup (via Dashboard):**
1. Create bucket: `artwork-images`
2. Set to **Private** (not public)
3. Add storage policy: Users can access files in their own folder

```sql
-- Storage RLS policy
CREATE POLICY "Users can access own files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'artwork-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'artwork-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Acceptance criteria:**
- [ ] Tables `artworks` and `collections` exist in Supabase
- [ ] RLS policies are enabled and tested
- [ ] Storage bucket `artwork-images` exists with RLS

---

### Task 1.4: Create Utility Modules

**Objective:** Create shared utility files that will be used throughout the app.

**Files to create:**

```typescript
// src/utils/dates.ts
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(d);
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

```typescript
// src/utils/tags.ts
export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().slice(0, 30);
}

export function deduplicateTags(tags: string[]): string[] {
  return [...new Set(tags.map(normalizeTag))].filter(Boolean);
}
```

```typescript
// src/utils/image.ts
import imageCompression from 'browser-image-compression';

export async function compressForDisplay(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxWidthOrHeight: 1920,
    maxSizeMB: 0.3,
    fileType: 'image/webp',
    useWebWorker: true,
  });
}

export async function compressForThumbnail(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxWidthOrHeight: 400,
    maxSizeMB: 0.05,
    fileType: 'image/webp',
    useWebWorker: true,
  });
}
```

**Acceptance criteria:**
- [ ] All utility files compile without errors
- [ ] `formatDate(new Date())` returns a string like "Sep 12, 2026"
- [ ] `normalizeTag(' Bird ')` returns `'bird'`

---

### Task 1.5: Create Zustand Stores

**Objective:** Create state management stores for artworks, collections, and auth.

**Files to create:**

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    set({ loading: false, error: error?.message ?? null });
    return { error: error?.message ?? null };
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false, error: error?.message ?? null });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  clearError: () => set({ error: null }),
}));
```

```typescript
// src/stores/artworkStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Artwork {
  id: string;
  user_id: string;
  title: string;
  description: string;
  creation_date: string; // ISO date
  upload_date: string;   // ISO datetime
  updated_at: string;    // ISO datetime
  deleted_at: string | null;
  medium: string;
  subject: string;
  tags: string[];
  is_favorite: boolean;
  status: 'completed' | 'in-progress' | 'study' | 'abandoned';
  notes: string;
  image_path: string | null;
  thumbnail_path: string | null;
  collection_ids: string[];
}

interface ArtworkState {
  artworks: Artwork[];
  loading: boolean;
  error: string | null;
  fetchArtworks: () => Promise<void>;
  addArtwork: (artwork: Omit<Artwork, 'id' | 'user_id' | 'upload_date' | 'updated_at' | 'deleted_at'>) => Promise<Artwork | null>;
  updateArtwork: (id: string, updates: Partial<Artwork>) => Promise<void>;
  softDeleteArtwork: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export const useArtworkStore = create<ArtworkState>((set, get) => ({
  artworks: [],
  loading: false,
  error: null,

  fetchArtworks: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .is('deleted_at', null)
      .order('creation_date', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }
    set({ artworks: data ?? [], loading: false });
  },

  addArtwork: async (artwork) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Not authenticated' }); return null; }

    const { data, error } = await supabase
      .from('artworks')
      .insert({ ...artwork, user_id: user.id })
      .select()
      .single();

    if (error) { set({ error: error.message }); return null; }
    set({ artworks: [data, ...get().artworks] });
    return data;
  },

  updateArtwork: async (id, updates) => {
    const { error } = await supabase
      .from('artworks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { set({ error: error.message }); return; }
    set({
      artworks: get().artworks.map((a) =>
        a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a
      ),
    });
  },

  softDeleteArtwork: async (id) => {
    const deletedAt = new Date().toISOString();
    const { error } = await supabase
      .from('artworks')
      .update({ deleted_at: deletedAt })
      .eq('id', id);

    if (error) { set({ error: error.message }); return; }
    set({ artworks: get().artworks.filter((a) => a.id !== id) });
  },

  toggleFavorite: async (id) => {
    const artwork = get().artworks.find((a) => a.id === id);
    if (!artwork) return;

    const newFav = !artwork.is_favorite;
    const { error } = await supabase
      .from('artworks')
      .update({ is_favorite: newFav })
      .eq('id', id);

    if (error) { set({ error: error.message }); return; }
    set({
      artworks: get().artworks.map((a) =>
        a.id === id ? { ...a, is_favorite: newFav } : a
      ),
    });
  },
}));
```

```typescript
// src/stores/collectionStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface CollectionState {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
  addCollection: (name: string, description?: string) => Promise<Collection | null>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  loading: false,
  error: null,

  fetchCollections: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) { set({ error: error.message, loading: false }); return; }
    set({ collections: data ?? [], loading: false });
  },

  addCollection: async (name, description = '') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ error: 'Not authenticated' }); return null; }

    const { data, error } = await supabase
      .from('collections')
      .insert({ name, description, user_id: user.id })
      .select()
      .single();

    if (error) { set({ error: error.message }); return null; }
    set({ collections: [...get().collections, data] });
    return data;
  },

  updateCollection: async (id, updates) => {
    const { error } = await supabase
      .from('collections')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { set({ error: error.message }); return; }
    set({
      collections: get().collections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  },

  deleteCollection: async (id) => {
    const { error } = await supabase
      .from('collections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { set({ error: error.message }); return; }
    set({ collections: get().collections.filter((c) => c.id !== id) });
  },
}));
```

**Acceptance criteria:**
- [ ] All stores compile without errors
- [ ] Stores export the expected hooks: `useAuthStore`, `useArtworkStore`, `useCollectionStore`

---

### Task 1.6: Create Image Upload Service

**Objective:** Service that compresses images and uploads to Supabase Storage.

**Files to create:**

```typescript
// src/services/imageService.ts
import { supabase } from '../lib/supabase';
import { compressForDisplay, compressForThumbnail } from '../utils/image';

interface UploadResult {
  imagePath: string;
  thumbnailPath: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export async function uploadArtworkImage(
  file: File,
  userId: string,
  artworkId: string
): Promise<UploadResult> {
  // Compress to display and thumbnail sizes
  const [displayBlob, thumbBlob] = await Promise.all([
    compressForDisplay(file),
    compressForThumbnail(file),
  ]);

  const imagePath = `${userId}/${artworkId}/display.webp`;
  const thumbnailPath = `${userId}/${artworkId}/thumb.webp`;

  // Upload both
  const [displayResult, thumbResult] = await Promise.all([
    supabase.storage.from('artwork-images').upload(imagePath, displayBlob, {
      contentType: 'image/webp',
      upsert: true,
    }),
    supabase.storage.from('artwork-images').upload(thumbnailPath, thumbBlob, {
      contentType: 'image/webp',
      upsert: true,
    }),
  ]);

  if (displayResult.error) throw new Error(`Display upload failed: ${displayResult.error.message}`);
  if (thumbResult.error) throw new Error(`Thumbnail upload failed: ${thumbResult.error.message}`);

  // Get signed URLs (valid for 1 year)
  const [displayUrl, thumbUrl] = await Promise.all([
    supabase.storage.from('artwork-images').createSignedUrl(imagePath, 60 * 60 * 24 * 365),
    supabase.storage.from('artwork-images').createSignedUrl(thumbnailPath, 60 * 60 * 24 * 365),
  ]);

  return {
    imagePath,
    thumbnailPath,
    imageUrl: displayUrl.data?.signedUrl ?? '',
    thumbnailUrl: thumbUrl.data?.signedUrl ?? '',
  };
}

export async function getImageUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from('artwork-images')
    .createSignedUrl(path, 60 * 60); // 1 hour
  return data?.signedUrl ?? '';
}

export async function deleteArtworkImages(userId: string, artworkId: string): Promise<void> {
  const paths = [
    `${userId}/${artworkId}/display.webp`,
    `${userId}/${artworkId}/thumb.webp`,
  ];
  await supabase.storage.from('artwork-images').remove(paths);
}
```

**Acceptance criteria:**
- [ ] `uploadArtworkImage` compresses and uploads two image sizes
- [ ] `getImageUrl` returns a signed URL

---

### Task 1.7: Create Router

**Objective:** Replace the manual `currentScreen` state switching with react-router-dom.

**Files to create:**

```typescript
// src/router.tsx
import { createHashRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
// More screens will be added in Phase 2

export const router = createHashRouter([
  {
    path: '/login',
    element: <LoginScreen />,
  },
  {
    path: '/signup',
    element: <SignUpScreen />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'about', element: <AboutScreen /> },
      // Phase 1 discovery screens (existing, mock data):
      { path: 'discover', element: <UploadScreen /> },
      { path: 'discover/processing', element: <ProcessingScreen /> },
      { path: 'discover/results', element: <ResultsScreen /> },
      { path: 'discover/results/:id', element: <ArtworkDetailScreen /> },
    ],
  },
]);
```

```typescript
// src/components/layout/AppLayout.tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Navigation } from '../Navigation';

export function AppLayout() {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>Loading...</div>;
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      {/* Footer stays as-is from existing App.tsx */}
    </div>
  );
}
```

**Files to modify:**
- `src/main.tsx` — Replace `<App />` with `<RouterProvider router={router} />`
- `src/components/Navigation.tsx` — Replace `onNavigate` callbacks with `<Link>` elements from react-router-dom

**Do NOT delete App.tsx yet.** Keep it as reference. The existing screens will be gradually migrated.

**Acceptance criteria:**
- [ ] Navigating to `/#/` shows HomeScreen
- [ ] Navigating to `/#/about` shows AboutScreen
- [ ] Navigating to `/#/login` shows LoginScreen
- [ ] Back button works correctly
- [ ] Direct URL entry works

---

### Task 1.8: Create Auth Screens

**Objective:** Create login and sign-up screens matching the design system.

**Files to create:**
- `src/screens/LoginScreen.tsx`
- `src/screens/SignUpScreen.tsx`

**Design (both screens):**
- Centered card (max-width: 400px) on `--color-background`
- EyeMark logo centered above the card
- "Kin" text in Fraunces below the logo
- Inputs with double-outline focus state
- Primary button: "Log In" / "Create Account"
- Link to the other screen: "Don't have an account? Sign up" / "Already have an account? Log in"
- Error messages in `--color-error` below the form

**LoginScreen fields:**
- Email (required, type="email")
- Password (required, type="password")
- "Forgot password?" link (goes to password reset — can be a placeholder page for MVP)

**SignUpScreen fields:**
- Email (required, type="email")
- Password (required, type="password", min 6 chars)
- Confirm Password (required, must match password)

**Error handling:**
- Invalid email format: "Please enter a valid email address"
- Wrong password: "Invalid email or password"
- Email already registered: "An account with this email already exists"
- Password too short: "Password must be at least 6 characters"
- Passwords don't match: "Passwords do not match"

**Acceptance criteria:**
- [ ] Login screen renders with design system styling
- [ ] Sign up creates a new user in Supabase
- [ ] Login authenticates and redirects to home
- [ ] Error messages appear correctly
- [ ] Tab between fields works
- [ ] Enter key submits the form

---

## Phase 2: Core Features (Tasks 2.1 – 2.8)

> **Goal:** Build the sketchbook — upload real artwork, view gallery, edit metadata, organize in collections. This is the heart of the app.

---

### Task 2.1: Build Upload Flow (Real)

**Objective:** Replace the mock upload with real image upload to Supabase.

**Route:** `/upload` (add to router)

**Screen: UploadScreen (replace existing)**

The existing `UploadScreen` has a beautiful drag-and-drop zone. Preserve its visual design. Add:

1. **Drag-and-drop / file picker** (keep existing visual)
2. **After image selection, show preview + metadata form:**

```
┌─────────────────────────────────────┐
│  [Image Preview]    [Metadata Form] │
│                                     │
│  ArtworkMat with    Title*          │
│  selected image     Description     │
│                     Medium ▾        │
│                     Creation Date   │
│                     Status ▾        │
│                     Tags [input]    │
│                     Notes           │
│                     Collection ▾    │
│                                     │
│         [Cancel]    [Upload ✓]      │
└─────────────────────────────────────┘
```

**Form fields (see D-25 for validation):**

| Field | Type | Required | Default |
|---|---|---|---|
| Title | text | Yes | filename without extension |
| Description | textarea | No | empty |
| Medium | select | No | empty (see D-22 for options) |
| Creation Date | date | No | today |
| Status | select | No | "completed" (see D-21) |
| Tags | tag input | No | empty |
| Notes | textarea | No | empty |
| Collection | multi-select | No | none |

**On submit:**
1. Show loading spinner (LoadingSpinner component using ART-11 spiral)
2. Compress image to display + thumbnail (via `imageService.ts`)
3. Upload compressed images to Supabase Storage
4. Insert artwork metadata into Supabase `artworks` table
5. Navigate to `/sketchbook/{artwork_id}` on success
6. Show error toast on failure

**File validation (before form):**
- Max size: 10MB. Error: "Image must be under 10MB."
- Accepted types: JPEG, PNG, WebP, HEIC. Error: "Supported formats: JPEG, PNG, WebP, HEIC."

**Acceptance criteria:**
- [ ] Can select image via drag-and-drop
- [ ] Can select image via file picker
- [ ] Image preview shows in ArtworkMat
- [ ] All form fields work
- [ ] Tags can be added and removed
- [ ] Upload compresses and stores in Supabase
- [ ] Metadata saved to artworks table
- [ ] Redirects to artwork detail on success
- [ ] Error shown on failure
- [ ] File too large shows error before upload attempt

---

### Task 2.2: Build Sketchbook Gallery Screen

**Objective:** Create the main gallery view showing all of the user's artworks.

**Route:** `/sketchbook` (add to router)

**Layout:**
```
┌────────────────────────────────────────┐
│ PageHeader: "Your Sketchbook"          │
│ Eyebrow: "{count} artworks"            │
│ Action: [Upload New] button            │
├────────────────────────────────────────┤
│ FilterBar:                             │
│ [Medium ▾] [Status ▾] [Collection ▾]  │
│ [♥ Favorites] [Search tags...]         │
│ Sort: [Newest ▾]                       │
├────────────────────────────────────────┤
│ ArtworkGrid:                           │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │card │ │card │ │card │ │card │      │
│ └─────┘ └─────┘ └─────┘ └─────┘      │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │card │ │card │ │card │ │card │      │
│ └─────┘ └─────┘ └─────┘ └─────┘      │
└────────────────────────────────────────┘
```

**ArtworkCard shows:**
- Thumbnail in ArtworkMat
- Title (truncated to 1 line)
- Medium badge (if set)
- Date badge (relative: "3 days ago")
- Favorite star (toggle on click)
- On click: navigate to `/sketchbook/{id}`
- Hover: double-outline effect + subtle lift

**Grid responsive:**
- ≥1200px: 4 columns
- ≥768px: 3 columns
- ≥480px: 2 columns
- <480px: 1 column
- Gap: 24px

**Filter behavior:**
- Filters are additive (AND). Medium=ink AND Status=completed → only ink + completed artworks
- Favorites toggle: ON → show only `is_favorite = true`
- Tag search: filter artworks where any tag contains the search string
- Filters applied client-side on the Zustand store data (no separate API calls)
- Sort applied client-side
- "Clear filters" button appears when any filter is active

**Empty state (no artworks at all):**
- ART-01 image, 200px wide
- Heading: "Your sketchbook is waiting"
- Subtext: "Upload your first drawing to get started."
- CTA button: "Upload Drawing" → navigates to `/upload`

**Empty state (filters active but no matches):**
- Heading: "No artworks match your filters"
- CTA: "Clear filters" button

**Acceptance criteria:**
- [ ] Gallery shows all non-deleted artworks for the logged-in user
- [ ] Each card shows thumbnail, title, medium, date, favorite star
- [ ] Clicking card navigates to detail view
- [ ] Filtering by medium works
- [ ] Filtering by status works
- [ ] Filtering by collection works
- [ ] Favorites toggle works
- [ ] Tag search works
- [ ] Sort changes order
- [ ] Empty state shows when no artworks
- [ ] Empty state shows when filters match nothing
- [ ] Grid is responsive at all breakpoints
- [ ] Cards have double-outline hover effect

---

### Task 2.3: Build Artwork Detail Screen (Personal)

**Objective:** Create a detailed view for a single personal artwork.

**Route:** `/sketchbook/:id` (add to router)

**Layout (TwoColumnLayout — 60/40 split, stacks on mobile):**

```
┌──────────────────────┬─────────────────────┐
│                      │                     │
│  ArtworkMat          │  Title              │
│  (display-size       │  Status badge       │
│   image)             │  Medium badge       │
│                      │  Creation date      │
│                      │  ─────────────      │
│                      │  Description        │
│                      │  ─────────────      │
│                      │  Tags (chips)       │
│                      │  ─────────────      │
│                      │  Collections        │
│                      │  ─────────────      │
│                      │  Notes              │
│                      │                     │
│                      │  [★ Favorite]       │
│                      │  [✏ Edit]           │
│                      │  [🗑 Delete]         │
└──────────────────────┴─────────────────────┘
```

**Image loading:**
1. Show thumbnail immediately (from store/cache)
2. Load display-size image via `getImageUrl(image_path)`
3. Swap thumbnail for full-size when loaded (smooth crossfade)

**Actions:**
- **Favorite toggle:** Instantly updates via `toggleFavorite(id)`
- **Edit:** Navigates to `/sketchbook/:id/edit`
- **Delete:** Shows ConfirmDialog → "Delete this artwork?" → "This will move it to trash." → [Cancel] [Delete]
  - On confirm: `softDeleteArtwork(id)` → navigate to `/sketchbook` → show toast "Artwork deleted" with "Undo" button (10 second window)

**Empty/Error states:**
- Artwork not found: "Artwork not found" + "Go to Sketchbook" button
- Image failed to load: Show ART-09 with "Image could not be loaded"

**Acceptance criteria:**
- [ ] Shows artwork image in ArtworkMat
- [ ] Shows all metadata (title, medium, date, tags, description, notes, collections, status)
- [ ] Favorite toggle works
- [ ] Edit navigates to edit screen
- [ ] Delete shows confirmation dialog
- [ ] Delete soft-deletes and navigates to gallery
- [ ] Undo toast appears after delete
- [ ] Back button returns to gallery
- [ ] Responsive: stacks to single column on mobile

---

### Task 2.4: Build Artwork Edit Screen

**Objective:** Edit form for artwork metadata.

**Route:** `/sketchbook/:id/edit` (add to router)

**Same form as Upload (Task 2.1) but pre-populated with existing data.** No image replacement in MVP (editing metadata only).

**On save:**
1. `updateArtwork(id, formData)`
2. Navigate back to `/sketchbook/:id`
3. Show toast: "Artwork updated"

**On cancel:**
1. If form is dirty (has unsaved changes), show ConfirmDialog: "Discard changes?"
2. Navigate back to `/sketchbook/:id`

**Acceptance criteria:**
- [ ] Form pre-populated with current artwork data
- [ ] All fields editable
- [ ] Save updates Supabase and redirects to detail
- [ ] Cancel with no changes goes back without prompt
- [ ] Cancel with unsaved changes shows confirmation
- [ ] Validation works same as upload form

---

### Task 2.5: Build Collections Feature

**Objective:** Allow users to create, manage, and filter by collections.

**UI approach: Collections are managed via a modal, not a separate page.**

**"Manage Collections" button on SketchbookScreen FilterBar:**
1. Opens a modal listing all collections
2. Each collection shows: name, description (truncated), artwork count
3. Actions per collection: Edit (inline), Delete (confirm dialog)
4. "Add Collection" button at bottom: inline form with name + optional description
5. Close modal → return to gallery

**Adding artwork to collection (from Edit screen):**
- Collection multi-select dropdown showing all user's collections
- Checkboxes next to each collection name

**Filtering by collection (SketchbookScreen):**
- Collection filter dropdown in FilterBar
- Selecting a collection filters to artworks where `collection_ids` includes that collection's ID

**Acceptance criteria:**
- [ ] Can create a collection with name + description
- [ ] Can rename a collection
- [ ] Can delete a collection (with confirmation)
- [ ] Can assign artwork to collections from edit screen
- [ ] Can filter gallery by collection
- [ ] Collection shows artwork count in manage modal

---

### Task 2.6: Extract Reusable UI Components

**Objective:** Extract shared UI patterns from existing screens into reusable components.

**Components to extract (from UI_COMPONENT_INVENTORY.md):**

| Component | Extract From | Destination |
|---|---|---|
| `ArtworkMat` | Inline `artwork-mat` div in ResultsScreen, DetailScreen | `src/components/ui/ArtworkMat.tsx` |
| `EmptyState` | Inline div in FavoritesScreen | `src/components/ui/EmptyState.tsx` |
| `PageHeader` | Inline header divs in all screens | `src/components/ui/PageHeader.tsx` |
| `Badge` | Inline span with `match-badge` class in ResultsScreen | `src/components/ui/Badge.tsx` |
| `Toast` | New (for success/error notifications) | `src/components/ui/Toast.tsx` |

**Rules for extraction:**
1. Create the new component
2. Make it work standalone with props
3. Replace usage in existing screens ONE AT A TIME
4. After each replacement, verify the screen still looks identical
5. Do NOT change any visual appearance during extraction

**Acceptance criteria:**
- [ ] Each extracted component works with props
- [ ] Existing screens look identical after refactoring
- [ ] No inline patterns remain for ArtworkMat, EmptyState, PageHeader

---

### Task 2.7: Update Home Screen

**Objective:** Add a "Recent Work" section to the existing HomeScreen for logged-in users.

**Conditional rendering:**
- If user has 0 artworks: Show existing hero content (keep as-is)
- If user has 1+ artworks: Show "Recent Work" section above the existing hero

**"Recent Work" section:**
```
┌─────────────────────────────────────────────────┐
│ "Recent Work"                    [View All →]   │
│                                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │card │ │card │ │card │ │card │               │
│ └─────┘ └─────┘ └─────┘ └─────┘               │
│                                                 │
│ (Shows latest 4 artworks as ArtworkCards)        │
└─────────────────────────────────────────────────┘
```

- "View All →" links to `/sketchbook`
- ArtworkCards are the same component from Task 2.2
- If fewer than 4 artworks, show as many as exist

**Keep ALL existing HomeScreen content below this section.** Do not remove the hero, the sample artworks, or any existing content.

**Acceptance criteria:**
- [ ] New user (0 artworks) sees existing home page unchanged
- [ ] User with artworks sees "Recent Work" section at top
- [ ] Recent work shows latest 4 artworks
- [ ] "View All" links to sketchbook

---

### Task 2.8: Update Navigation

**Objective:** Update Navigation component for the new route structure.

**Navigation items:**
```
[EyeMark Kin]  [Sketchbook]  [Discover]  [About]      [Avatar ▾]
```

**Avatar dropdown (top-right):**
- User email (truncated)
- "Log Out" button

**Active state:** Current route highlighted with `--color-accent` underline

**Mobile (< 768px):** Hamburger menu → full-screen overlay with nav links

**Acceptance criteria:**
- [ ] All nav items link to correct routes
- [ ] Active route is highlighted
- [ ] Avatar shows user email and logout
- [ ] Mobile hamburger menu works
- [ ] Logo links to home

---

## Phase 3: Polish (Tasks 3.1 – 3.4)

> **Goal:** Polish the experience, ensure design integrity, and prepare for deployment.

---

### Task 3.1: Implement Toast Notification System

**Objective:** Global toast system for success, error, and info messages.

**Component:** `src/components/ui/Toast.tsx`
**Store:** `src/stores/toastStore.ts`

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  action?: { label: string; onClick: () => void }; // For "Undo" button
  duration: number; // ms
}
```

**Position:** Bottom-center, 24px from bottom edge.
**Animation:** Slide up + fade in (200ms). Slide down + fade out on dismiss.
**Duration:** 3000ms success/info, 5000ms error. Pause timer on hover.
**Stacking:** Max 3 toasts visible. Newest at bottom.

**Acceptance criteria:**
- [ ] Toasts appear and auto-dismiss
- [ ] Error toasts have `--color-error` left border
- [ ] Success toasts have `--color-success` left border
- [ ] "Undo" action button works (for delete undo)
- [ ] Toasts stack correctly

---

### Task 3.2: Design System Compliance Audit

**Objective:** Review every screen and component against DESIGN_INTEGRITY_GUIDELINES.md.

**Checklist for each screen:**
1. Background uses `--color-background` (cream)
2. All text colors from `--color-text-*` tokens
3. All borders use `--color-border` or `--color-border-subtle`
4. No more than 2 magenta-accented elements
5. Generous top and bottom padding
6. All interactive elements have double-outline hover/focus
7. Typography uses only Fraunces (display) and Inter (body/UI)
8. No pure black or pure white backgrounds
9. Loading states use artist's motifs
10. `prefers-reduced-motion` is respected
11. All focus states visible for keyboard navigation

**Fix any violations found.** Do not add new features. Only fix design compliance.

---

### Task 3.3: Error Boundary and Loading States

**Objective:** Add React error boundary and consistent loading states.

**Files to create:**
- `src/components/ErrorBoundary.tsx` — catches React render errors, shows ART-09 + "Something went wrong" + "Reload" button
- Loading state component using existing ConcentricPortal (small variant, 60px) for inline loading

**Wrap the AppLayout's `<Outlet />` with the ErrorBoundary.**

---

### Task 3.4: Deployment Configuration

**Objective:** Configure for Vercel deployment.

**Files to create:**
- `vercel.json` (if hash routing is used, no config needed — but create anyway for future)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Environment variables to set in Vercel Dashboard:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Acceptance criteria:**
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run preview` serves the built app correctly
- [ ] All routes work when served as static files
- [ ] Environment variables are correctly read

---

## Post-MVP Scope (DO NOT IMPLEMENT IN MVP)

These features are documented for future planning only. Do not build them during the MVP phase.

| Feature | Phase | Estimated Effort |
|---|---|---|
| Timeline view (calendar/grid of artworks by date) | Post-MVP | 2-3 days |
| Color palette extraction (Canvas API) | Post-MVP | 1 day |
| AI metadata suggestions (Gemini, user-provided key) | Post-MVP | 2-3 days |
| Real similarity search (user-provided Vision API key) | Post-MVP | 3-5 days |
| Export/Import (JSON + images ZIP) | Post-MVP | 2 days |
| Creative Space (supplies, materials tracking) | Post-MVP | 3-5 days |
| Progress comparison (side-by-side versions) | Post-MVP | 2 days |
| PWA / Service Worker / Offline | Post-MVP | 2 days |
| Image replacement on edit | Post-MVP | 1 day |
| Batch upload | Post-MVP | 2 days |
