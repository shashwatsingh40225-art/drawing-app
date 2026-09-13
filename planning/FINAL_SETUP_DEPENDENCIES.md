# FINAL SETUP DEPENDENCIES — Kin

> **Status:** AUTHORITATIVE — What the user must provide or configure before implementation can continue.
> **Date:** 2026-09-12

---

## Critical Finding

**Very little is actually needed from the user.** The app is already running in demo mode. Most "setup" work is optional and only needed when transitioning to live Supabase mode.

---

## For MVP Completion (Demo Mode Only)

### What the User Must Do: Nothing

The demo mode requires **zero external setup**. Everything runs in the browser:

| Requirement | Status | Action Needed |
|---|---|---|
| Node.js installed | ✅ Already working | None (app is running at localhost:5175) |
| npm packages installed | ✅ Already installed | None |
| Vite dev server | ✅ Already running | None |
| Browser with IndexedDB support | ✅ All modern browsers | None |
| Supabase account | ❌ Not needed for demo mode | None |
| Vercel account | ❌ Not needed for local dev | None |
| API keys | ❌ Not needed | None |
| Credit card | ❌ Not needed | None |

**The only new dependency for MVP is the `idb` npm package**, which is installed via `npm install idb` — a zero-config, no-account-needed operation.

---

## For Supabase Live Mode (Post-MVP)

When the user wants to connect to a real Supabase backend:

### Step 1: Supabase Project Setup

| Task | Details | Time |
|---|---|---|
| Log into Supabase | User already has an account (per FREE_TIER_AND_COST_AUDIT.md) | 1 min |
| Create a new project | Dashboard → New Project → choose name + region + password | 2 min |
| Wait for project provisioning | Supabase provisions Postgres, Auth, Storage | 1-2 min |
| Copy project URL | Settings → API → Project URL | 30 sec |
| Copy anon key | Settings → API → anon/public key | 30 sec |

### Step 2: Database Schema

| Task | Details | Time |
|---|---|---|
| Run schema.sql | SQL Editor → paste contents of `supabase/schema.sql` → Run | 2 min |
| Verify tables created | Check that `artworks`, `collections`, etc. exist | 1 min |

### Step 3: Storage Buckets

| Task | Details | Time |
|---|---|---|
| Create `artworks` bucket | Storage → New Bucket → name: `artworks`, public: false | 1 min |
| Set storage policies | Apply RLS policies from schema.sql | 2 min |

### Step 4: Environment Variables

| Task | Details | Time |
|---|---|---|
| Create `.env` file | Copy `.env.example` → `.env` | 30 sec |
| Set `VITE_SUPABASE_URL` | Paste project URL | 30 sec |
| Set `VITE_SUPABASE_ANON_KEY` | Paste anon key | 30 sec |
| Restart dev server | `npm run dev` | 10 sec |

**Total time for Supabase setup: ~10 minutes.**

### Step 5: Verify Live Mode

| Check | How to Verify |
|---|---|
| Demo mode indicator gone | The "Connected to local demo studio storage" text should disappear from login screen |
| Sign up works | Create a new account, verify email if Supabase requires it |
| Upload works | Upload a drawing, refresh the page, image should still be visible |
| Data persists | Close browser, reopen, all data should still be there |

---

## For Vercel Deployment (Post-MVP)

When the user wants to deploy publicly:

| Task | Details | Time |
|---|---|---|
| Log into Vercel | User already has an account | 1 min |
| Connect GitHub repo | Import → select repo → auto-detect Vite | 2 min |
| Set environment variables | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard | 1 min |
| Deploy | Auto-deploys on push to main | 1-2 min |

**Total time for Vercel deployment: ~5 minutes.**

---

## For Gemini Flash Integration (Optional, Post-MVP)

When the user wants AI-assisted metadata suggestions:

| Task | Details | Time | Cost |
|---|---|---|---|
| Go to Google AI Studio | aistudio.google.com | 1 min | $0 |
| Create API key | Click "Create API Key" → select project | 1 min | $0 |
| Set `VITE_GEMINI_API_KEY` in `.env` | Paste the key | 30 sec | $0 |

**Requirements:**
- Google account (no credit card)
- Free tier: 15 requests/minute, 1,500 requests/day
- Model: Gemini 2.0 Flash (free)

**The app must work 100% without this key.** AI features are purely additive — manual metadata entry is always available.

---

## Dependency Summary

| Dependency | Required For | Who Provides It | When Needed |
|---|---|---|---|
| Node.js + npm | Development | ✅ Already installed | Now |
| `idb` npm package | Image persistence fix | `npm install idb` | MVP |
| Supabase account + project | Cloud persistence | User creates (free) | Post-MVP |
| Supabase URL + anon key | Live mode | User copies from dashboard | Post-MVP |
| Vercel account | Public deployment | User creates (free) | Post-MVP |
| GitHub repo | Vercel auto-deploy | User creates (free) | Post-MVP |
| Google AI Studio API key | AI metadata suggestions | User creates (free) | Optional, post-MVP |

---

## What I (the Implementer) Need From You Before Proceeding

### For MVP Work (Demo Mode Fixes)

**Nothing.** I can proceed immediately. The only action needed is:

```bash
npm install idb
```

This requires no accounts, no API keys, no configuration, and no money.

### For Supabase Live Mode

When you're ready to go live, I need you to:

1. Log into your Supabase account
2. Create a new project
3. Give me the **Project URL** and **Anon Key**
4. I'll handle the rest (schema migration, storage config, env setup)

### For Vercel Deployment

When you're ready to deploy publicly:

1. Push the code to a GitHub repository
2. Log into Vercel and import the repo
3. I'll provide the exact environment variables to set

### For Gemini AI Features

When you want AI-assisted tagging:

1. Go to aistudio.google.com
2. Create an API key
3. Give me the key
4. I'll integrate it as an optional enhancement

---

## Cost Verification

| Service | Monthly Cost | Credit Card Required | Verified |
|---|---|---|---|
| npm packages | $0 | No | ✅ |
| Supabase free tier | $0 | No | ✅ |
| Vercel free tier | $0 | No | ✅ |
| Google AI Studio free tier | $0 | No | ✅ |
| Google Fonts CDN | $0 | No | ✅ |
| **Total** | **$0** | **No** | ✅ |

> [!IMPORTANT]
> **No service in the Kin stack requires a credit card.** The total cost is $0 at every stage.
