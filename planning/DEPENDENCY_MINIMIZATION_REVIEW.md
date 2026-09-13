# Dependency Minimization Review

> **Status: AUTHORITATIVE** — Updated with Supabase + Vercel confirmed availability.

---

## Revised Dependency List

### Runtime Dependencies (8 total)

| # | Dependency | Size (gzipped) | Justification | Can Be Removed? |
|---|---|---|---|---|
| 1 | react | ~42KB | Framework — already in use | No |
| 2 | react-dom | ~130KB | React DOM — already in use | No |
| 3 | lucide-react | ~5KB | Icons — already in use | No |
| 4 | react-router-dom | ~14KB | URL routing — essential for a real app | No |
| 5 | zustand | ~1.5KB | State management — simpler than Context | Could use Context, but zustand is smaller |
| 6 | @supabase/supabase-js | ~30KB | Database, auth, storage client | No — required for Supabase |
| 7 | browser-image-compression | ~30KB | Client-side image processing | Could use raw Canvas, but edge cases matter |

### Removed Dependencies (vs original plan)

| Dependency | Replaced With | Reason |
|---|---|---|
| `idb` | Not needed | Supabase replaces IndexedDB as primary storage. Minimal localStorage cache used instead. |
| `date-fns` | `Intl.DateTimeFormat` + `src/utils/dates.ts` (~30 lines) | Native API handles formatting; small utility handles arithmetic |
| `uuid` | `crypto.randomUUID()` | Native browser API, zero bytes |

### Dev Dependencies (unchanged)

| Dependency | Purpose |
|---|---|
| @types/react | TypeScript types |
| @types/react-dom | TypeScript types |
| @vitejs/plugin-react | Vite React plugin |
| typescript | Compiler |
| vite | Build tool |

---

## External Service Count

### Original Plan: 6+ external services
### Revised Plan: 3 external services (all confirmed $0)

| # | Service | Purpose | Replaceable? |
|---|---|---|---|
| 1 | **Supabase** | Auth + Database + Image Storage | Could fall back to IndexedDB-only mode |
| 2 | **Vercel** | Static hosting + deployment | Could use GitHub Pages or any static host |
| 3 | **Google Fonts** | Font delivery | Falls back to system fonts |

### Optional (user-provided, post-MVP)
| 4 | **Gemini API** | AI metadata suggestions | App works without it |

---

## Architecture Simplicity

| Metric | Original Plan | Revised Plan |
|---|---|---|
| Runtime npm dependencies | 9 | 7 |
| External services (required) | 6+ | 3 |
| API keys needed for MVP | 3+ | 1 (Supabase — auto-configured via env var) |
| Billing accounts needed | 2 (GCP + Supabase Pro) | 0 |
| Backend code to write | Serverless proxy | 0 lines (Supabase RLS handles security) |
| Database schema to manage | Supabase migrations | Simple SQL schema (~30 lines) |
| Total moving parts | ~12 | ~5 |

---

## Service Failure Behavior

| Service | If Unavailable | User Impact | Recovery |
|---|---|---|---|
| Supabase (paused) | Can't load/save new data | Show "reconnecting" message | Auto-resumes when Supabase is unpaused |
| Supabase (temporary outage) | API calls fail | Show cached data + retry button | Automatic retry |
| Vercel | Site not accessible | N/A — users can't reach the app | Wait for Vercel to recover |
| Google Fonts | System fonts render | Minor visual change | Automatic when CDN recovers |
| Gemini API (optional) | AI suggestions unavailable | Manual metadata entry only | User can retry later |
