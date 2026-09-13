# Small-Scale Architecture Review

> **Status: AUTHORITATIVE** — Updated with Supabase + Vercel as confirmed infrastructure.

---

## Design Target

**10–100 users**, each with their own artwork stored in Supabase with row-level security. Users authenticate to access their data across devices. The architecture uses Supabase as a single backend service (Auth + Postgres + Storage) and Vercel for static hosting.

---

## Architecture

```
┌────────────────────────────────────┐
│          Vercel (Free Tier)        │
│     Static hosting + CDN           │
│     Auto-deploy from GitHub        │
│     $0/month                       │
└────────────────┬───────────────────┘
                 │ HTTPS
                 ▼
┌────────────────────────────────────┐
│          User's Browser            │
│                                    │
│  ┌──────────────┐                  │
│  │   React SPA  │                  │
│  │   (Vite)     │                  │
│  │              │──── API calls ──►│
│  │   Zustand    │                  │
│  │   stores     │                  │
│  └──────────────┘                  │
└────────────────────────────────────┘
                 │ Supabase JS Client
                 ▼
┌────────────────────────────────────┐
│       Supabase (Free Tier)         │
│                                    │
│  ┌─────────┐ ┌─────────────────┐   │
│  │  Auth   │ │  Postgres DB    │   │
│  │ (email/ │ │  500MB          │   │
│  │  pass)  │ │  Artwork meta,  │   │
│  └─────────┘ │  collections,   │   │
│              │  tags            │   │
│              └─────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Storage (1GB)              │   │
│  │  Artwork images (display +  │   │
│  │  thumbnail size)            │   │
│  └─────────────────────────────┘   │
│                                    │
│  Row-Level Security:               │
│  Each user sees only their data    │
│  $0/month                          │
└────────────────────────────────────┘
```

---

## Why Supabase Over Pure IndexedDB

Now that Supabase is available, it solves the original plan's biggest risks:

| Problem with IndexedDB-Only | Supabase Solution |
|---|---|
| 🔴 Data locked to one browser | ✅ Access from any device |
| 🔴 Data lost if browser data cleared | ✅ Data persists in cloud DB |
| 🔴 No backup without manual export | ✅ Always backed up |
| 🔴 No multi-device access | ✅ Login from anywhere |
| 🟡 Complex IndexedDB migrations | ✅ Standard SQL migrations |

**Trade-off accepted:** Supabase free tier pauses after 1 week of inactivity. This is acceptable for a hobby app — when the user returns, there's a brief (~30 second) wake-up delay.

---

## Overengineering Still Removed

Even with Supabase available, these remain unnecessary:

| Feature | Why Not Needed |
|---|---|
| **Realtime subscriptions** | Single-user per session. No need for live updates. |
| **Edge Functions** | No server-side logic needed. RLS handles security. |
| **Complex RLS policies** | Simple `WHERE user_id = auth.uid()` on all tables. |
| **Database triggers** | Keep logic in the client for simplicity. |
| **Background jobs** | All operations are user-initiated. |
| **Caching layer** | Supabase is fast enough for 10-100 users. Zustand stores serve as in-memory cache. |
| **CDN for images** | Supabase Storage includes CDN-like delivery. |
| **Analytics** | Ask users directly. 10-100 users don't need dashboards. |
| **Error monitoring** | Console.error in dev. Users report issues directly. |
| **OAuth providers** | Email/password is sufficient. Adding Google/GitHub OAuth is premature complexity. |

---

## Auth Approach: Simple Email/Password

| Aspect | Decision |
|---|---|
| Provider | Supabase Auth — email/password only |
| Why not OAuth? | Each OAuth provider requires app registration, callback URLs, and testing. Email/password works immediately. |
| Why not magic links? | Requires email service configuration. Adds complexity. |
| Sign-up flow | Email + password → confirm email → logged in |
| Session management | Supabase JS client handles JWT tokens automatically |
| Password reset | Supabase built-in password reset flow |
| Logout | Clear session → redirect to login |

---

## Database Schema (Simple)

```sql
-- Enable RLS
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Artworks table
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  medium TEXT,
  subject TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'in-progress', 'study', 'abandoned')),
  notes TEXT,
  image_path TEXT,        -- Supabase Storage path for display image
  thumbnail_path TEXT,    -- Supabase Storage path for thumbnail
  collection_ids UUID[] DEFAULT '{}'
);

-- Simple RLS: users see only their own data
CREATE POLICY "Users see own artworks" ON artworks
  FOR ALL USING (auth.uid() = user_id);

-- Collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE POLICY "Users see own collections" ON collections
  FOR ALL USING (auth.uid() = user_id);
```

That's it. Two tables, two RLS policies. ~30 lines of SQL. No complex joins, no triggers, no functions.

---

## Storage Bucket Configuration

```
Bucket: artwork-images
  - Public: No (requires auth)
  - File size limit: 5MB (display-size images are ~200KB)
  - Allowed MIME types: image/jpeg, image/webp, image/png
  - RLS: Users can only access files in their own folder (user_id/*)
```

**File naming convention:**
```
artwork-images/{user_id}/{artwork_id}/display.webp
artwork-images/{user_id}/{artwork_id}/thumb.webp
```

---

## What This Architecture Cannot Do (Acceptable Trade-offs)

| Limitation | Impact | Acceptable? |
|---|---|---|
| Supabase pauses after 1 week inactivity | Brief delay on first access after pause | ✅ Yes — hobby app |
| 500MB database limit | Metadata for ~10,000+ artworks | ✅ Yes — more than enough |
| 1GB storage limit | ~500 display-size images | ✅ Yes — sufficient for years |
| 5GB egress/month | ~50 gallery browsing sessions/day | ✅ Yes — sufficient for 10-100 users |
| No real-time sync | Updates require page refresh | ✅ Yes — single user sessions |
| Max 2 active Supabase projects | Only 1 needed for this app | ✅ Yes |

---

## Environment Variables

| Variable | Where Set | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel env vars | Yes |
| `VITE_SUPABASE_ANON_KEY` | Vercel env vars | Yes |
| `VITE_GEMINI_API_KEY` | User-provided in app settings | No — optional for AI features |

Only 2 required environment variables. Both are safe to expose in client-side code (Supabase anon key is designed to be public, with RLS providing security).
