# Decisions and Assumptions

> **STATUS: AUTHORITATIVE** — Every open question from the original plan is resolved here. The coding agent should not make any decisions beyond what is specified. If a question arises that is not covered here, STOP and ask.

---

## Architecture Decisions

### D-01: Primary Storage → Supabase Postgres + Storage

| Decision | Supabase is the primary data store. No IndexedDB. |
|---|---|
| Reason | User confirmed Supabase free tier is available. Supabase solves multi-device, backup, and data persistence problems. |
| Alternative considered | IndexedDB-only (local-first) — rejected because data loss risk was the #1 concern. |

### D-02: Auth → Supabase Auth (Email/Password Only)

| Decision | Email/password authentication only. No OAuth, no magic links. |
|---|---|
| Reason | Simplest auth flow. No third-party app registrations needed. Works immediately. |
| Alternative considered | OAuth (Google/GitHub) — adds callback URL config, app registration steps, and testing burden. Unnecessary for 10-100 users. |

### D-03: Hosting → Vercel (Static SPA)

| Decision | Vite builds a static SPA, deployed to Vercel via GitHub integration. |
|---|---|
| Reason | User confirmed Vercel free tier is available. Auto-deploys from GitHub push. |
| Configuration | No SSR. No API routes. No serverless functions in MVP. |

### D-04: State Management → Zustand

| Decision | Zustand for global state. React state for component-local state. |
|---|---|
| Reason | 1.5KB, simpler API than Context + useReducer, no provider nesting. |
| Pattern | One store per domain: `useArtworkStore`, `useCollectionStore`, `useAuthStore`. |

### D-05: Routing → react-router-dom v6+

| Decision | Hash-based routing (`createHashRouter`) since Vercel handles static SPA. |
|---|---|
| Reason | Hash routing avoids Vercel catch-all redirect configuration. Works out of the box. |
| Alternative considered | `createBrowserRouter` — requires Vercel `rewrites` in `vercel.json`. Works fine, but hash routing is simpler for initial setup. |

---

## Feature Scope Decisions

### D-10: MVP Feature Set

| Decision | MVP includes: Auth, Upload, Sketchbook Gallery, Artwork Detail, Edit, Collections, About. Discovery flow keeps existing mock data. |
|---|---|
| Reason | These features deliver a complete, useful product. Everything else is polish or external-API-dependent. |
| NOT in MVP | Timeline view, Progress Studio, Creative Space, Supplies, AI suggestions, Real similarity search, Calendar view, Export/Import. |

### D-11: Discovery → Mock Data + External Link

| Decision | Keep existing mock discovery flow. Add "Search with Google Lens" external link. No in-app API search. |
|---|---|
| Reason | All visual search APIs require credit cards or are fragile scrapers. |

### D-12: AI Features → None in MVP

| Decision | No AI features in MVP. All metadata entered manually by user. |
|---|---|
| Reason | AI features are nice-to-have. The app must work without them. Post-MVP: user provides Gemini API key. |

### D-13: Image Storage Strategy

| Decision | Store two sizes per artwork in Supabase Storage: thumbnail (400px wide, webp) and display (1920px wide, webp). Do NOT store originals remotely. |
|---|---|
| Reason | 1GB Supabase Storage limit. 500 artworks × 230KB = 115MB. Originals at 5-15MB each would exhaust storage with 100 images. |
| Compression | Client-side via `browser-image-compression` before upload. |
| Format | WebP preferred. JPEG fallback for browsers without WebP Canvas support. |

### D-14: Collections vs Tags

| Decision | BOTH. Tags are free-text labels on individual artworks. Collections are named folders that group artworks. |
|---|---|
| Tags | Stored as `TEXT[]` on the artwork row. Free-form entry. Autocomplete from existing tags. No fixed vocabulary. |
| Collections | Separate `collections` table. Artwork references collections via `collection_ids UUID[]`. An artwork can be in multiple collections. |
| Why both? | Tags describe WHAT (medium, subject, style). Collections describe WHERE (project name, sketchbook number, series). |

### D-15: Deletion → Soft Delete

| Decision | Soft delete only. Set `deleted_at` timestamp. Never hard delete in MVP. |
|---|---|
| Reason | Prevents accidental data loss. Soft-deleted items don't appear in UI but remain in database. |
| Undo | "Undo" within 10 seconds of deletion (toast notification). After that, no undo in UI. |
| Hard delete | Only via direct database access. No UI for permanent deletion in MVP. |

### D-16: Favorites

| Decision | Boolean `is_favorite` column on the artwork row. Not a separate table. |
|---|---|
| Reason | Simplest implementation. Toggle with a single UPDATE. Filter by `WHERE is_favorite = true`. |

---

## UI/UX Decisions

### D-20: Navigation Structure

| Decision | Top navigation bar with: Kin (home), Sketchbook, Discover, About. User avatar/logout in top-right. |
|---|---|
| Reason | Matches existing navigation pattern. Maximum 4 primary nav items. |
| Mobile | Hamburger menu for <768px screens. |

### D-21: Artwork Status Options

| Decision | Four fixed statuses: `completed`, `in-progress`, `study`, `abandoned`. |
|---|---|
| Reason | Covers the hobby artist's workflow without overwhelming them. |
| Default | `completed`. |

### D-22: Medium Options (Predefined List)

| Decision | Dropdown with predefined options + "Other" free text: |
|---|---|
| Options | Pencil, Ink Pen, Marker, Watercolor, Acrylic, Charcoal, Digital, Mixed Media, Other |
| Why predefined? | Enables consistent filtering. "Other" allows flexibility. |

### D-23: Image Upload Limits

| Decision | Max file size: 10MB. Accepted types: JPEG, PNG, WebP, HEIC. |
|---|---|
| Reason | 10MB covers phone camera shots. HEIC for iPhone users. |
| Validation error | "Image must be under 10MB. Supported formats: JPEG, PNG, WebP, HEIC." |

### D-24: Gallery Sort and Filter

| Decision | Default sort: newest first (by `creation_date`). |
|---|---|
| Sort options | Newest, Oldest, Recently Updated, Alphabetical |
| Filter options | Medium (multi-select), Status (multi-select), Collection (multi-select), Favorites only (toggle), Tag search (text input) |

### D-25: Form Validation

| Decision | Inline validation on blur. Red border + error message below field. |
|---|---|
| Required fields (upload) | Title, Image |
| Optional fields (upload) | Description, Medium, Tags, Status, Creation Date, Collection, Notes |
| Title max length | 100 characters |
| Description max length | 500 characters |
| Notes max length | 1000 characters |
| Tags max count | 20 per artwork |

### D-26: Empty States

| Decision | Each screen/section has a specific empty state: |
|---|---|
| Sketchbook (no artworks) | ART-01 image + "Your sketchbook is empty" + "Upload your first drawing" CTA |
| Collection (no artworks) | "This collection is empty" + "Add artworks to get started" |
| Favorites (none) | ART-01 + "No favorites yet" + "Star your favorites in the sketchbook" |
| Search (no results) | "No artworks match your filters" + "Clear filters" button |

### D-27: Auth Screens

| Decision | Minimal, warm-themed auth pages matching the design system. |
|---|---|
| Login | Email + password + "Sign Up" link + "Forgot Password" link |
| Sign Up | Email + password + confirm password + "Log In" link |
| Forgot Password | Email field + "Send Reset Link" button |
| Design | Center card on `--color-background`, Fraunces heading, EyeMark logo above |

---

## Technical Decisions

### D-30: Date Handling

| Decision | Use native `Date` objects and `Intl.DateTimeFormat`. No date-fns. |
|---|---|
| Display format | `Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` → "Sep 12, 2026" |
| Storage format | ISO 8601 date (`YYYY-MM-DD`) for creation_date, ISO 8601 datetime for upload/update timestamps. |

### D-31: ID Generation

| Decision | Use `crypto.randomUUID()` for client-generated IDs. Supabase `gen_random_uuid()` for DB-generated IDs. |
|---|---|

### D-32: Tag Normalization

| Decision | Tags are lowercase, trimmed, max 30 chars each. Duplicates rejected. |
|---|---|
| Normalization | `tag.trim().toLowerCase().slice(0, 30)` |
| Autocomplete | Query existing tags for the user. Show top 5 matches as user types. |

### D-33: Error Handling Pattern

| Decision | Every Supabase call wrapped in try/catch. Errors surfaced via toast notifications. |
|---|---|
| Toast duration | 5 seconds for errors, 3 seconds for success/info. |
| Toast position | Bottom-center of viewport. |
| Network errors | "Couldn't connect. Check your internet connection and try again." |
| Auth errors | Specific messages: "Invalid email or password", "Email already in use" |
| Storage errors | "Couldn't upload image. Please try again." |

### D-34: Supabase Client Initialization

| Decision | Single Supabase client instance in `src/lib/supabase.ts`. |
|---|---|
| Code | `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)` |
| Session | Supabase JS client auto-manages JWT tokens in localStorage. |
