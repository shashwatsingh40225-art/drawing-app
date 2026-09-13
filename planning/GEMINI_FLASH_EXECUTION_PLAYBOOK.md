# GEMINI FLASH EXECUTION PLAYBOOK — Kin MVP Completion

> **For:** Gemini 3.8 Flash (or any implementing agent)
> **Date:** 2026-09-13
> **Purpose:** Step-by-step instructions to complete the Kin MVP. Follow these phases in exact order.

---

## CRITICAL RULES — READ BEFORE DOING ANYTHING

1. **Do NOT redesign the visual identity.** The design system (colors, fonts, spacing, components) is finished. Do not change CSS custom properties, do not replace Fraunces/Inter fonts, do not alter the color palette.
2. **Do NOT add new npm dependencies** unless explicitly listed in this playbook.
3. **Do NOT refactor working code** unless a phase explicitly says to modify that file.
4. **Do NOT create new screens** unless explicitly listed.
5. **Do NOT touch the Discovery flow** (`DiscoveryFlow.tsx`, `ProcessingScreen.tsx`, `ResultsScreen.tsx`, `ArtworkDetailScreen.tsx`, `FavoritesScreen.tsx`). These work as mock demos and are intentionally left as-is.
6. **Test after every phase** by running the app and verifying the listed acceptance criteria.
7. **The app runs at** `http://localhost:5175` via `npm run dev`.
8. **Budget is $0.** Do not install paid services or APIs.

---

## CURRENT STATE — What Already Works

Before you start, understand what EXISTS and is FUNCTIONAL:

| Feature | Status | Location |
|---|---|---|
| Login / Signup / Demo auth | ✅ Working | `LoginScreen.tsx`, `SignUpScreen.tsx`, `authStore.ts` |
| Upload with image compression | ✅ Working | `UploadScreen.tsx`, `imageService.ts`, `image.ts` |
| Sketchbook gallery with filters | ✅ Working | `SketchbookScreen.tsx`, `FilterBar.tsx`, `ArtworkCard.tsx` |
| Artwork detail view | ✅ Working | `PersonalArtworkDetailScreen.tsx` |
| Artwork metadata editing | ✅ Working | `ArtworkEditScreen.tsx` |
| Collections CRUD | ✅ Working | `CollectionModal.tsx`, `collectionStore.ts` |
| Favorites | ✅ Working | `artworkStore.ts` (toggleFavorite) |
| Soft delete with undo | ✅ Working | `artworkStore.ts`, `toastStore.ts` |
| Navigation + auth guards | ✅ Working | `Navigation.tsx`, `AppLayout.tsx` |
| Toast notifications | ✅ Working | `Toast.tsx`, `toastStore.ts` |
| Design system (CSS tokens) | ✅ Working | `index.css` |
| Discovery flow (mock) | ✅ Working (mock data) | `DiscoveryFlow.tsx` and children |
| Supabase dual-mode toggle | ✅ Working | `supabase.ts` (isSupabaseDemoMode) |
| Supabase database | ✅ Tables created | `artworks` + `collections` tables live |
| `.env.local` configured | ✅ Real credentials | Supabase URL + anon key + Gemini key |

### Supabase Credentials (already in .env.local)
```
VITE_SUPABASE_URL=https://ygxpcglzueenfnefvmks.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI... (set in .env.local)
VITE_GEMINI_API_KEY=AQ.Ab8RN6LJ... (set in .env.local)
```

---

## PHASE 0: Verify Supabase Live Mode (30 minutes)

### Goal
Confirm the app connects to Supabase instead of running in demo mode.

### Pre-check
```bash
# Restart the dev server to pick up .env.local changes
# Kill existing dev server first, then:
npm run dev
```

### Steps

1. **Open the app** at `http://localhost:5175`
2. **Check the login screen** — the text "Connected to local demo studio storage" should be **GONE**. If it still shows, the app is in demo mode. Check that `.env.local` has the real Supabase URL (not "placeholder" or "demo").
3. **Sign up a new account** with a real email. Supabase will send a confirmation email.
4. **Log in** with the new account.
5. **Upload a test artwork** — go to `/upload`, select an image, fill in title + medium, submit.
6. **Refresh the page** — the artwork should still be visible in the sketchbook. This confirms Supabase persistence works.
7. **If upload fails with a storage error:** The `artwork-images` storage bucket may not exist. The user needs to create it in the Supabase Dashboard → Storage → New Bucket → name: `artwork-images`, Public: OFF.

### Storage Bucket Policy
If uploads fail with a permissions error after the bucket exists, the storage RLS policy needs to be applied. Run this SQL in the Supabase SQL Editor:

```sql
CREATE POLICY "Users can upload own artwork images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artwork-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own artwork images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'artwork-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own artwork images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artwork-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own artwork images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'artwork-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Acceptance Criteria
- [ ] App connects to Supabase (no "demo mode" text on login page)
- [ ] Can sign up a new account
- [ ] Can upload an artwork
- [ ] Artwork survives page refresh
- [ ] Image displays correctly after refresh
- [ ] Collections work (create, assign to artwork)

### If This Phase Fails
If Supabase live mode doesn't work, **do not try to fix it by rewriting the auth or store layers.** Instead, debug:
1. Check browser console for errors
2. Check Supabase Dashboard → Logs for API errors
3. Check that the `.env.local` values match the Supabase Dashboard → Settings → API page
4. Check that RLS policies were applied (tables without RLS policies will return empty arrays)

---

## PHASE 1: Error Boundaries (2 hours)

### Goal
Prevent white-screen crashes. Any component error shows a friendly fallback UI.

### New File: `src/components/ErrorBoundary.tsx`

Create this file with this exact content:

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            maxWidth: '560px',
            margin: '80px auto',
            textAlign: 'center',
            padding: '40px 24px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              width: '180px',
              height: '180px',
              margin: '0 auto 20px',
              backgroundColor: '#FAF5EC',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '12px',
            }}
          >
            <img
              src="/artist-reference/art-09.jpeg"
              alt="Friendly mushroom creature"
              style={{ maxHeight: '160px', width: 'auto' }}
            />
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: 'var(--color-primary)',
              marginBottom: '8px',
            }}
          >
            {this.props.fallbackTitle || 'Something went sideways'}
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred. Your data is safe — try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary double-outline-btn"
            style={{ padding: '10px 24px', fontSize: '0.9rem' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Modify: `src/router.tsx`

Wrap each route's element with the `ErrorBoundary` component. Import it at the top:

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';
```

Then wrap the main layout route's `element` and/or add `errorElement` props to routes. The simplest approach: wrap the `<AppLayout />` in `<ErrorBoundary>`:

```tsx
{
  path: '/',
  element: (
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  ),
  children: [/* ... existing child routes ... */]
}
```

### Acceptance Criteria
- [ ] App renders normally with error boundary in place
- [ ] If you temporarily add `throw new Error('test')` to any screen component, the error boundary shows the mushroom creature fallback instead of a white screen
- [ ] Remove the test error after verifying

---

## PHASE 2: Home Dashboard for Logged-In Users (4 hours)

### Goal
When a user is logged in and has artwork, show their recent work instead of the marketing landing page.

### Modify: `src/screens/HomeScreen.tsx`

Add a dashboard section that shows ONLY for authenticated users who have artworks. Keep the existing landing page for unauthenticated visitors.

#### What to add:
1. Import `useAuthStore` and `useArtworkStore`
2. At the top of the component, check: `const { user } = useAuthStore()` and `const { artworks, fetchArtworks } = useArtworkStore()`
3. If `user` exists and `artworks.length > 0`, render a dashboard with:
   - Greeting: "Welcome back to your studio"
   - Stats row: total artworks count, favorites count, collections count
   - "Recent Work" section: last 6 artworks in a grid using `ArtworkCard`
   - Quick action buttons: "Upload New Drawing" (link to `/upload`), "Browse Sketchbook" (link to `/sketchbook`)
4. If `user` does NOT exist, render the existing landing page exactly as-is (do NOT modify it)

#### Design rules:
- Use existing CSS variables (no new colors)
- Use existing components (`ArtworkCard`, `Badge`, `PageHeader`)
- Keep the warm, calm Kin aesthetic
- Max width 1280px, same padding as other screens

### Acceptance Criteria
- [ ] Unauthenticated visitors see the original landing page (unchanged)
- [ ] Logged-in users with artworks see recent work dashboard
- [ ] Logged-in users with zero artworks see a friendly empty state with upload CTA
- [ ] Clicking an artwork card navigates to its detail page
- [ ] "Upload" and "Browse Sketchbook" buttons work

---

## PHASE 3: Responsive Layout (1-2 days)

### Goal
The app is usable on phone screens (360px-768px width).

### Modify: `src/index.css`

Add a responsive section at the END of the file (after all existing styles). Do NOT modify existing style rules — only ADD new `@media` rules:

```css
/* ========================================
   RESPONSIVE LAYOUT — Mobile & Tablet
   ======================================== */

@media (max-width: 768px) {
  /* Navigation: stack items */
  .nav-links {
    gap: 8px;
  }
  
  /* Gallery grid: single column on small screens */
  .sketchbook-grid {
    grid-template-columns: 1fr !important;
  }
  
  /* Detail screens: stack columns */
  .two-column-detail-layout {
    grid-template-columns: 1fr !important;
  }
  
  /* Filter bar: stack controls */
  .filter-bar-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  /* Page headers: smaller text */
  .page-header h1 {
    font-size: 1.6rem;
  }
  
  /* Upload form: full width */
  .upload-form-container {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 480px) {
  /* Even smaller adjustments for phones */
  body {
    font-size: 14px;
  }
}
```

**IMPORTANT:** Many components use inline styles with `gridTemplateColumns`. The CSS classes above may not override them. For components where responsive layout matters most, you may need to add `className` props to the grid containers so the CSS can target them. Key files:

1. `SketchbookScreen.tsx` — add `className="sketchbook-grid"` to the artwork grid `<div>`
2. `PersonalArtworkDetailScreen.tsx` — the two-column layout already has `className="two-column-detail-layout"`  
3. `ArtworkEditScreen.tsx` — add `className="upload-form-container"` to the form grid
4. `FilterBar.tsx` — add `className="filter-bar-container"` to the outer container

### Navigation Mobile Menu

Modify `src/components/Navigation.tsx`:
1. Add a hamburger button (visible only on mobile via CSS)
2. Add a state `const [mobileMenuOpen, setMobileMenuOpen] = useState(false)`
3. On mobile, nav links are hidden by default and shown when hamburger is clicked
4. Use `lucide-react` icons: `Menu` for hamburger, `X` for close

### Acceptance Criteria
- [ ] At 768px width: gallery shows 2 columns, detail screens stack vertically
- [ ] At 480px width: gallery shows 1 column
- [ ] Navigation has hamburger menu on mobile
- [ ] Upload form is usable on mobile
- [ ] Filter bar doesn't overflow on mobile
- [ ] All text is readable on mobile (no overflow, no tiny text)

---

## PHASE 4: Data Export (4 hours)

### Goal
Users can download a backup of all their artwork data and images.

### New File: `src/services/exportService.ts`

```typescript
import { useArtworkStore } from '../stores/artworkStore';
import { getImageUrl } from './imageService';

export async function exportAllData(): Promise<void> {
  const artworks = useArtworkStore.getState().artworks;
  
  // Create metadata JSON
  const metadata = {
    exportDate: new Date().toISOString(),
    appVersion: '1.0.0',
    totalArtworks: artworks.length,
    artworks: artworks.map(a => ({
      ...a,
      // Remove internal fields
      image_path: undefined,
      thumbnail_path: undefined,
    })),
  };
  
  // Create and download JSON file
  const jsonBlob = new Blob(
    [JSON.stringify(metadata, null, 2)],
    { type: 'application/json' }
  );
  
  const url = URL.createObjectURL(jsonBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kin-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### Add Export Button

Add an "Export Data" button to the `SketchbookScreen.tsx` header area (near the filter bar or in a settings dropdown). Use the `Download` icon from `lucide-react`.

```tsx
import { exportAllData } from '../services/exportService';
import { Download } from 'lucide-react';

// In the JSX, near the filter bar:
<button
  onClick={exportAllData}
  className="double-outline-btn"
  style={{
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  }}
>
  <Download size={14} />
  <span>Export</span>
</button>
```

### Acceptance Criteria
- [ ] "Export" button visible on sketchbook screen
- [ ] Clicking exports a `.json` file with all artwork metadata
- [ ] JSON file is valid and contains correct data
- [ ] Export works with 0 artworks (empty array, no crash)

---

## PHASE 5: Final Polish & Verification (2 hours)

### Goal
Verify everything works end-to-end.

### Verification Checklist

Run through this entire flow manually:

1. [ ] **Fresh start:** Open the app in an incognito/private window
2. [ ] **Landing page:** The home screen shows the marketing landing page
3. [ ] **Sign up:** Create a new account with email + password
4. [ ] **Login:** Log in with the new account
5. [ ] **Empty sketchbook:** The sketchbook shows an empty state with upload CTA
6. [ ] **Upload:** Upload 3 different drawings with different mediums and tags
7. [ ] **Gallery:** All 3 appear in the sketchbook grid
8. [ ] **Filtering:** Filter by medium — only matching artworks show
9. [ ] **Favorites:** Star one artwork, filter by favorites — only starred one shows
10. [ ] **Detail view:** Click an artwork — full detail page with image, metadata, actions
11. [ ] **Edit:** Click "Edit Details" — modify title and tags — save — changes persist
12. [ ] **Collections:** Open collection modal, create a collection, assign an artwork
13. [ ] **Delete:** Delete an artwork — toast shows with "Undo" — click undo — artwork restored
14. [ ] **Home dashboard:** Navigate to `/` — should show recent artworks (since user is logged in)
15. [ ] **Export:** Click Export on sketchbook — JSON file downloads with correct data
16. [ ] **Refresh persistence:** Refresh the page — ALL data and images still present
17. [ ] **Discovery demo:** Go to `/discover` — select a sample — see processing — view results (mock data is fine)
18. [ ] **Responsive:** Resize browser to 480px width — app is usable, no overflow
19. [ ] **Error boundary:** App doesn't show white screens on errors
20. [ ] **Logout:** Sign out — redirected to login page
21. [ ] **Auth guard:** Try to access `/sketchbook` while logged out — redirected to `/login`

### If Issues Are Found
Fix them within the same phase. Don't move to post-MVP phases until all 21 checks pass.

---

## POST-MVP PHASES (Optional — Do Only If User Requests)

### Phase 6: Gemini Flash AI Integration

**Only do this if the user explicitly asks for AI features.**

The Gemini API key is already in `.env.local` as `VITE_GEMINI_API_KEY`.

Create `src/services/geminiService.ts`:
- Use the Gemini REST API (not SDK — avoid adding dependencies)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Features: "Suggest Tags" button on upload/edit forms, "Detect Medium" button
- All AI features are OPTIONAL — manual entry always works without them
- Show loading state during API call
- Handle errors gracefully (show toast, don't crash)

### Phase 7: Timeline View

Create `src/screens/TimelineScreen.tsx`:
- Group artworks by month/year of creation_date
- Each month section shows thumbnail strips
- Add `/timeline` route
- Add "Timeline" to navigation

### Phase 8: Vercel Deployment

1. Push code to GitHub (ensure `.env.local` is gitignored!)
2. User connects repo in Vercel Dashboard
3. Set environment variables in Vercel: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy

---

## FILE MAP — What Exists and What to Create/Modify

### Files to CREATE (new):
| File | Phase | Purpose |
|---|---|---|
| `src/components/ErrorBoundary.tsx` | 1 | Error boundary component |
| `src/services/exportService.ts` | 4 | Data export functionality |

### Files to MODIFY:
| File | Phase | Change |
|---|---|---|
| `src/router.tsx` | 1 | Wrap routes in ErrorBoundary |
| `src/screens/HomeScreen.tsx` | 2 | Add dashboard for logged-in users |
| `src/index.css` | 3 | Add responsive media queries |
| `src/components/Navigation.tsx` | 3 | Add mobile hamburger menu |
| `src/screens/SketchbookScreen.tsx` | 3, 4 | Add className for responsive + export button |
| `src/screens/PersonalArtworkDetailScreen.tsx` | 3 | Ensure className for responsive |
| `src/screens/ArtworkEditScreen.tsx` | 3 | Add className for responsive |
| `src/components/sketchbook/FilterBar.tsx` | 3 | Add className for responsive |

### Files to NOT TOUCH:
| File | Reason |
|---|---|
| `src/index.css` (existing rules) | Design system is finished — only ADD rules |
| `src/lib/supabase.ts` | Working correctly |
| `src/stores/artworkStore.ts` | Working correctly |
| `src/stores/authStore.ts` | Working correctly |
| `src/stores/collectionStore.ts` | Working correctly |
| `src/stores/toastStore.ts` | Working correctly |
| `src/services/imageService.ts` | Working correctly |
| `src/screens/DiscoveryFlow.tsx` | Mock demo — intentionally unchanged |
| `src/screens/ProcessingScreen.tsx` | Mock demo — intentionally unchanged |
| `src/screens/ResultsScreen.tsx` | Mock demo — intentionally unchanged |
| `src/screens/ArtworkDetailScreen.tsx` | Discovery detail — intentionally unchanged |
| `src/screens/FavoritesScreen.tsx` | Discovery favorites — intentionally unchanged |
| `src/screens/LoginScreen.tsx` | Working correctly |
| `src/screens/SignUpScreen.tsx` | Working correctly |
| `src/screens/AboutScreen.tsx` | Working correctly |
| `src/data/artworks.ts` | Mock data for discovery — keep as-is |
| `.env.local` | Already configured — do not overwrite |
| `supabase/schema.sql` | Already applied — do not re-run |

---

## SUMMARY

```
Phase 0: Verify Supabase live mode works      →  30 min
Phase 1: Error boundaries                      →  2 hours
Phase 2: Home dashboard for logged-in users    →  4 hours
Phase 3: Responsive layout                     →  1-2 days
Phase 4: Data export                           →  4 hours
Phase 5: Final verification                    →  2 hours
                                               ─────────
Total:                                         ~4-5 days
```

The app is ALREADY functional. These phases are polish and safety improvements. Do not over-engineer. Do not add features not listed here. Follow the acceptance criteria for each phase.
