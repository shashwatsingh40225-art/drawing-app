# Free-Tier and Cost Audit

> **Status: AUTHORITATIVE** — Produced by Cost & Free-Tier Auditor review.  
> **Updated:** Incorporates confirmed availability of Supabase (free tier) and Vercel (free tier).

---

## Audit Scope

Every external service, dependency, and infrastructure component evaluated against the **strict $0 budget** requirement.

---

## Confirmed Available Services — Approved

| Service | Cost | Credit Card | Free Tier Limits | Risk | Verdict |
|---|---|---|---|---|---|
| **Supabase** (Auth + Postgres + Storage) | $0 | No | 50K MAU, 500MB DB, 1GB storage, 5GB egress | ⚠️ Projects paused after 1 week inactivity; max 2 active projects | ✅ Approved — user already has account |
| **Vercel** (Hosting + Edge Functions) | $0 | No | 100GB bandwidth, serverless functions | Hobby plan limits apply | ✅ Approved — user already has account |
| **npm packages** (all open source) | $0 | No | Unlimited | None | ✅ Approved |
| **Google Fonts CDN** | $0 | No | Unlimited | CDN downtime (unlikely) | ✅ Approved |
| **lucide-react** | $0 | No | Unlimited | None | ✅ Approved |
| **Canvas API** (browser-native) | $0 | No | Unlimited | None | ✅ Approved |

---

## Supabase Free Tier — Detailed Assessment

### What We Get for $0

| Resource | Free Tier | Our Expected Usage | Sufficient? |
|---|---|---|---|
| Monthly Active Users (Auth) | 50,000 | 10-100 | ✅ Massively sufficient |
| Database size | 500 MB | ~50MB metadata for 500 artworks | ✅ Sufficient |
| File storage | 1 GB | ~200KB display × 500 artworks = 100MB | ✅ Sufficient (display-size only) |
| Egress | 5 GB/month | ~50MB/day for 10 users browsing galleries | ✅ Sufficient |
| API requests | Unlimited | N/A | ✅ Sufficient |
| Realtime connections | 200 concurrent | 1-10 | ✅ Sufficient |
| Edge Functions | 500K invocations/month | Minimal | ✅ Sufficient |

### ⚠️ Critical Risk: Inactivity Pause

> **Free projects are paused after 1 week of inactivity. Limit of 2 active projects.**

This means if no user accesses the app for 7 days, the Supabase backend goes to sleep and must be manually unpaused from the dashboard.

**Mitigation strategies:**
1. The app should handle Supabase being unavailable gracefully (show cached data or a friendly "waking up" message)
2. Consider a simple health-check ping (Vercel cron or external pinger) — but this may violate the spirit of the free tier
3. Accept the limitation — for a hobby art app, if nobody uses it for a week, a brief wake-up delay is acceptable
4. Keep a local IndexedDB cache as fallback so the app isn't completely broken during pause

**Decision:** Accept the pause risk. Implement a local IndexedDB cache of recently viewed artworks so the app has something to show while Supabase wakes up. The primary data lives in Supabase, IndexedDB serves as a read cache only.

### Supabase Architecture Decision

| Component | Use | Not Used |
|---|---|---|
| **Supabase Auth** | Email/password login for multi-device access | OAuth providers (unnecessary complexity) |
| **Supabase Postgres** | All structured data (artworks, collections, tags) | Complex queries, full-text search (keep simple) |
| **Supabase Storage** | Display-size artwork images (buckets) | Original full-resolution images (store locally or skip) |
| **Supabase RLS** | Row-level security per user | Complex policies (keep simple) |
| **Realtime** | — | Not needed for a personal app |
| **Edge Functions** | — | Not needed (Vercel handles this if needed) |

### Storage Strategy With Supabase

| Image Variant | Stored In | Size | Reason |
|---|---|---|---|
| **Thumbnail** (400px) | Supabase Storage | ~30KB | Fast gallery loading |
| **Display** (1920px) | Supabase Storage | ~200KB | Detail view |
| **Original** | NOT stored remotely | 2-15MB | 1GB limit would be hit with ~100 originals. User keeps originals on their device. |

**1GB storage budget:**
- 500 artworks × (30KB thumb + 200KB display) = ~115MB
- Well within the 1GB limit

---

## Vercel Free Tier — Detailed Assessment

| Resource | Free Tier | Our Expected Usage | Sufficient? |
|---|---|---|---|
| Bandwidth | 100 GB/month | <5 GB for 10-100 users | ✅ Sufficient |
| Serverless Functions | 100 GB-hours, 1000 invocations/day | Minimal (if used for API proxy) | ✅ Sufficient |
| Builds | 6000 min/month | ~10 deploys/month × 2 min = 20 min | ✅ Sufficient |
| Deployments | Unlimited | N/A | ✅ Sufficient |
| Custom Domains | 50 | 1 | ✅ Sufficient |

**Deployment approach:** Connect GitHub repo → auto-deploy on push. Vite builds as a static site. No server-side rendering needed.

---

## Services With Hidden Costs — Still Flagged

### 🔴 Google Cloud Vision API — REJECTED

| Aspect | Detail |
|---|---|
| Planned use | Artistic similarity search |
| Credit card required | **YES** — GCP requires billing account |
| **Verdict** | **REJECTED.** Credit card requirement violates $0 constraint. |
| **Replacement** | Mock data + external link to Google Lens (no API needed). |

### 🟡 Gemini API (Google AI Studio) — CONDITIONALLY APPROVED

| Aspect | Detail |
|---|---|
| Planned use | AI metadata suggestions (post-MVP) |
| Credit card required | **No** — Google AI Studio free tier requires only Google account |
| Free tier | 15 RPM, 1,500 requests/day |
| **Verdict** | **APPROVED for post-MVP.** User provides their own API key. App works 100% without it. |

### 🔴 SerpApi / Bing Visual Search — REJECTED

| Aspect | Detail |
|---|---|
| **Verdict** | **REJECTED.** Unnecessary given simplified discovery approach. |

---

## Final $0 Service Stack

| Layer | Service | Cost |
|---|---|---|
| **Frontend hosting** | Vercel (free tier) | $0 |
| **Database** | Supabase Postgres (free tier) | $0 |
| **Auth** | Supabase Auth (free tier) | $0 |
| **Image storage** | Supabase Storage (free tier) | $0 |
| **Image compression** | Client-side (browser-image-compression) | $0 |
| **Fonts** | Google Fonts CDN | $0 |
| **Icons** | lucide-react (npm) | $0 |
| **AI suggestions** | Gemini free tier (optional, user-provided key) | $0 |
| **Total** | | **$0** |

No credit card required for any service.

---

## Features Not Viable Under $0

| Feature | Reason | Recommended Action |
|---|---|---|
| In-app similarity search via paid API | Cloud Vision requires billing account | Mock data + Google Lens link |
| Original image cloud storage | 1GB Supabase limit insufficient for originals | Store display-size only; user keeps originals |
| Complex AI features | Requires API key the user may not have | All AI features optional with manual fallback |
