# Kin — Personal Digital Art Room & AI Reading Companion

**Built solo by Shashwat Singh, Sept 13–16, 2026 (~3–4 day sprint) · $0 budget, $0 paid infra**

---

## What it is

Kin is a private, calm space for a hobby artist to preserve and revisit their creative work (a
personal digital sketchbook, timeline, and progress studio built around 20 original studio
artworks) **plus** a full PDF reading experience — annotated with page-pinned notes and an
AI-generated "Previously…" recap that helps a reader pick a book back up after a gap, without
ever spoiling ahead of where they stopped.

It ships as a responsive web app (React 19 + Vite + Supabase) and a native Android app
(Capacitor), deployed on Vercel.

## Why it exists

Most "organize your creative life" tools are either enterprise-flavored (metrics, streaks,
portfolios-as-business) or generic note apps with no opinion about art. Kin is deliberately the
opposite: no streaks, no public feed, no gamification — scoped tightly to *one person's* practice
of drawing and reading, with an aesthetic (Fraunces/Inter type, warm earth palette, hand-drawn
motifs) built entirely from the creator's own artwork.

## Standout engineering (the part worth putting on a CV)

- **AI recap with a real spoiler guard, not a prompt instruction.** The `/api/recap` endpoint
  independently re-validates that every page sent to the model falls inside the reader's *stored*
  session range server-side — the guard doesn't rely on the LLM "being told" not to look ahead.
- **Dual-provider LLM fallback for zero-cost reliability.** Calls Gemini Flash first; on
  rate-limit, missing config, or an unreachable endpoint, transparently retries against NVIDIA
  NIM (a separate quota pool, OpenAI-compatible chat API) with its own model fallback chain —
  built to survive on free-tier quotas with no paid API budget at all.
  ([src/services/readingSessionLogic.ts](src/services/readingSessionLogic.ts))
- **Deterministic, heuristic reading-session detection** — dwell time, jump-page detection, idle
  caps, and a "meaningful session" threshold — decides when a recap is even worth surfacing,
  decoupled on purpose from when a session technically "ends" (see
  [docs/adr](docs/adr)).
- **43 passing unit tests** covering the AI pipeline's failure modes specifically: provider
  fallback ordering, quota exhaustion, safety blocks, malformed responses, truncated output, and
  "the model had nothing to summarize" — the boring, unglamorous edge cases that make an AI
  feature trustworthy instead of a demo.
- **Row-Level-Security-first data model** on Supabase: every recap request re-derives ownership of
  the reading session and its book from the caller's auth token before touching the model, not
  just from the client-supplied IDs.
- **Shipped a real Android app** (Capacitor) alongside the web app from the same codebase, with a
  dedicated mobile audit-and-fix pass (touch targets, iOS Safari zoom bugs, WebKit PDF range-fetch
  bugs, gesture conflicts) — see recent commit history.

## Core features

| Area | What it does |
|---|---|
| Sketchbook | Upload, tag, and organize personal artwork; client-side image compression; favorites & collections |
| Timeline | Browse creative output by date, including backdated/old work |
| Progress studio | Version a project and compare drawings before/after |
| Reader | PDF rendering with page-position tracking, bookmarks, and positioned "Pins" (notes or archive-artwork references) |
| Memory Bridge | Proactive, spoiler-safe "Previously…" recap generated from exactly the pages read last session |
| Kin Archive | 20 original studio artworks, reusable as visual references throughout the app |
| Mobile | Native Android build via Capacitor from the same React codebase |

## How it stacks up

| | **Kin** | Amazon Kindle "Recaps" | Procreate / Goodnotes |
|---|---|---|---|
| AI "catch me up" recap | ✅ spoiler-guarded, per-session | ✅ (launched Apr 2025, browser Jul 2026) | ❌ |
| Personal art archive + timeline | ✅ | ❌ | ➖ (storage only, no reflection layer) |
| Team & budget | 1 person, $0, ~3–4 days | Amazon engineering org | Commercial product teams |
| Positioning | Intimate personal tool, not a platform | Mass-market feature | Professional drawing tool |

Kindle's "Recaps" / "Story So Far" (Amazon, using GenAI + human moderation) is the closest
mainstream analog to Memory Bridge — validation that the core idea is sound, and a useful
comparison point: the same *category* of feature, built solo, on free-tier AI quotas, in days
rather than by an org with a dedicated ML team.

## Stack

React 19 · TypeScript · Vite · Zustand · React Router · Supabase (Postgres + Auth + Storage,
RLS-enforced) · pdf.js / react-pdf · Capacitor (Android) · Vercel (hosting + serverless
functions) · Gemini Flash + NVIDIA NIM (LLM fallback chain) · Node test runner (unit tests)

## CV-ready bullet points

- Designed and shipped a full-stack personal art/reading web + native Android app solo in a
  ~3–4 day sprint, from data model through Supabase RLS policies, React UI, and Vercel deployment.
- Built a production AI feature (LLM-generated reading recaps) with a server-side spoiler guard,
  dual-provider (Gemini/NVIDIA NIM) failover for zero-cost resilience, and 43 unit tests covering
  provider outages, rate limits, and model hallucination edge cases.
- Implemented deterministic session-detection heuristics (dwell time, jump detection, idle decay)
  to infer real reading sessions without any AI or backend state machine.
- Diagnosed and fixed a suite of mobile/WebKit-specific production bugs (iOS Safari input zoom,
  iPad PDF text-layer crashes, WebKit range-fetch failures) across a shipped Android build.

---
*Sources on the Kindle Recaps comparison: [About Amazon](https://www.aboutamazon.com/news/books-and-authors/kindle-recaps-feature-ebook-series-refreshers), [TechCrunch](https://techcrunch.com/2025/04/03/amazon-kindles-new-feature-uses-ai-to-generate-recaps-for-books-in-a-series).*
