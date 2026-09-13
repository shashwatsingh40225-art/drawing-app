# Risk Register

## Risk Categories

| Severity | Definition |
|---|---|
| 🔴 Critical | Could prevent the project from functioning |
| 🟠 High | Could significantly degrade user experience or require major rework |
| 🟡 Medium | Could cause delays or minor quality issues |
| 🟢 Low | Cosmetic or easily worked around |

---

## Technical Risks

### T1: IndexedDB Storage Limits

| Aspect | Detail |
|---|---|
| Severity | 🟠 High |
| Description | IndexedDB storage is limited and varies by browser. Chrome allows ~60% of disk space, but Firefox limits to 2GB per origin. Safari has historically been aggressive about evicting data. |
| Probability | Medium |
| Impact | Users could lose all their artwork data without warning |
| Mitigation | 1. Show storage usage indicator in settings. 2. Warn at 80% capacity. 3. Implement data export early (Phase 3). 4. Prioritize cloud storage migration. 5. Consider storing only thumbnails + display images in IndexedDB, with original images in OPFS or prompting for cloud. |
| Owner | Phase 2 developer |

### T2: Image Compression Quality Loss

| Aspect | Detail |
|---|---|
| Severity | 🟡 Medium |
| Description | Client-side compression may introduce visible artifacts on line drawings. Pencil sketches with subtle shading are particularly sensitive. |
| Probability | Medium |
| Impact | Users may notice quality degradation in their stored artwork |
| Mitigation | 1. Always keep the original uncompressed blob. 2. Use high quality settings (80%+). 3. Test compression on actual artwork samples from the collection. 4. Provide a "view original" option. |
| Owner | Phase 2 developer |

### T3: Browser Compatibility

| Aspect | Detail |
|---|---|
| Severity | 🟡 Medium |
| Description | IndexedDB, OPFS, and some Canvas APIs may behave differently across browsers. Safari in particular has known IndexedDB reliability issues. |
| Probability | Medium |
| Impact | App may not work correctly on Safari or older browsers |
| Mitigation | 1. Test on Chrome, Firefox, Safari, Edge. 2. Use the `idb` library which handles browser quirks. 3. Add a browser compatibility check on first load. |
| Owner | Phase 1 developer |

### T4: Large Gallery Performance

| Aspect | Detail |
|---|---|
| Severity | 🟡 Medium |
| Description | Loading 200+ artwork thumbnails simultaneously could cause memory issues and slow rendering. |
| Probability | Low (most users will have <100 artworks in first year) |
| Impact | Sluggish gallery browsing, potential browser crashes |
| Mitigation | 1. Virtualize the gallery list with `react-window` or similar. 2. Lazy load thumbnails with IntersectionObserver. 3. Paginate IndexedDB queries. |
| Owner | Phase 2 developer |

### T5: Web Worker Image Processing Failures

| Aspect | Detail |
|---|---|
| Severity | 🟡 Medium |
| Description | `browser-image-compression` uses Web Workers which may fail in some browser contexts (incognito, restrictive CSP). |
| Probability | Low |
| Impact | Image upload fails with cryptic error |
| Mitigation | 1. Fallback to main-thread compression. 2. If compression fails entirely, store original with a warning about storage. |
| Owner | Phase 2 developer |

---

## API and External Service Risks

### A1: Google Cloud Vision API Availability

| Aspect | Detail |
|---|---|
| Severity | 🟠 High |
| Description | The similarity search depends on Google Cloud Vision Web Detection. This requires a GCP project, billing account, and API key. Free tier is 1,000 calls/month. |
| Probability | Low (API is stable) |
| Impact | Discovery feature completely unavailable without it |
| Mitigation | 1. Mock service for MVP (already planned). 2. Multiple fallback providers (Bing Visual Search, SerpApi). 3. Client-side reverse image search URL generation as a zero-cost fallback. 4. Cache results to reduce API calls. |
| Owner | Phase 5 developer |

### A2: API Key Security

| Aspect | Detail |
|---|---|
| Severity | 🔴 Critical |
| Description | API keys cannot be safely stored in a client-side-only app. If exposed in frontend code, anyone could use them, incurring costs. |
| Probability | High (it's a client-only app) |
| Impact | Unauthorized API usage, unexpected billing |
| Mitigation | 1. For MVP: use mock data only, no API keys needed. 2. For real search: either (a) add a lightweight serverless proxy (Cloudflare Worker, Vercel Edge Function) that holds the key and rate-limits, or (b) require the user to enter their own API key (for personal use only). 3. Never commit API keys to git. |
| Owner | Phase 5 developer |

### A3: External Image Availability

| Aspect | Detail |
|---|---|
| Severity | 🟡 Medium |
| Description | Discovery results link to external images that may be removed, behind CDNs, or rate-limited. CORS restrictions may prevent displaying them. |
| Probability | High |
| Impact | Broken images in search results |
| Mitigation | 1. Cache thumbnails locally when results are saved. 2. Use a CORS proxy for thumbnail display. 3. Show placeholder on load failure. 4. Always provide the source page link as a fallback. |
| Owner | Phase 5 developer |

### A4: Gemini API Rate Limits

| Aspect | Detail |
|---|---|
| Severity | 🟡 Medium |
| Description | Gemini 2.0 Flash free tier: 15 RPM, 1,500/day. Could be hit if user does many searches with AI explanations. |
| Probability | Low (single user) |
| Impact | AI features temporarily unavailable |
| Mitigation | 1. Queue and batch requests. 2. Cache results. 3. Show graceful "suggestion unavailable" with manual input. 4. AI features are always optional and editable. |
| Owner | Phase 7 developer |

---

## Design Risks

### D1: Design System Drift

| Aspect | Detail |
|---|---|
| Severity | 🟠 High |
| Description | As new screens are added, a future coding agent may introduce colors, fonts, spacing, or interaction patterns that violate the design system. Over time, the app loses its distinctive artistic identity. |
| Probability | High (this is the most common failure mode) |
| Impact | App looks generic, loses its soul |
| Mitigation | 1. `DESIGN_INTEGRITY_GUIDELINES.md` provides explicit rules. 2. Every new screen must pass the design checklist. 3. Extract reusable components early so new screens use them. 4. Periodic visual review against the prototype screenshots. |
| Owner | Every phase |

### D2: Inline Style Maintenance Burden

| Aspect | Detail |
|---|---|
| Severity | 🟡 Medium |
| Description | Existing screens use extensive inline styles (200-450 lines per screen). This makes consistent updates difficult. |
| Probability | Certain |
| Impact | Slow development, inconsistent styling across screens |
| Mitigation | 1. Extract reusable component library in Phase 1. 2. Migrate screens to components progressively. 3. Don't attempt a full CSS overhaul in one go. |
| Owner | Phase 1 developer |

### D3: Accessibility Compliance

| Aspect | Detail |
|---|---|
| Severity | 🟡 Medium |
| Description | `--color-text-muted` (`#A79883`) on `--color-background` (`#F6F0E4`) may not meet WCAG AA contrast. Some interactive elements may lack proper ARIA labels. |
| Probability | High (already identified in design docs) |
| Impact | Users with visual impairments cannot use the app |
| Mitigation | 1. Verify all color pairs with a contrast checker. 2. Adjust muted text color if needed (darken while staying warm-brown). 3. Add ARIA labels to all interactive elements. 4. Test with screen reader. |
| Owner | Phase 3 |

---

## Product Risks

### P1: MVP Feature Creep

| Aspect | Detail |
|---|---|
| Severity | 🟠 High |
| Description | The product vision is broad (sketchbook + timeline + progress + discovery + creative space + AI). Attempting too much in the MVP will delay everything. |
| Probability | High |
| Impact | Nothing ships, everything is half-built |
| Mitigation | 1. MVP is strictly defined: upload + gallery + detail + edit + favorites + collections + filters + persistence. 2. Similarity search is mocked. 3. AI features are postponed. 4. Creative space is postponed. |
| Owner | Product owner |

### P2: Tone Mismatch in AI Features

| Aspect | Detail |
|---|---|
| Severity | 🟠 High |
| Description | AI-generated metadata (descriptions, tags, progress observations) may use language that feels clinical, judgmental, or generic — violating the app's warm, personal tone. |
| Probability | High |
| Impact | Users feel judged or annoyed by AI output |
| Mitigation | 1. All AI output is always editable and dismissable. 2. AI never assigns scores or ranks quality. 3. AI describes observable facts, not judgments. 4. Custom prompt engineering with explicit tone instructions. 5. User can disable AI suggestions entirely. |
| Owner | Phase 7 developer |

### P3: Data Loss Anxiety

| Aspect | Detail |
|---|---|
| Severity | 🔴 Critical |
| Description | Users storing precious artwork in browser-only storage will (rightfully) worry about data loss from browser data clearing, device failure, or accidental deletion. |
| Probability | High |
| Impact | Users abandon the app or don't trust it with important work |
| Mitigation | 1. Implement data export early (Phase 3) — JSON + images as a ZIP. 2. Show periodic "Back up your work" reminders. 3. Add "Undo" for deletion (soft delete with 30-day recovery). 4. Prioritize cloud storage for long-term safety. 5. Never auto-delete anything. |
| Owner | Phase 2-3 developer |

---

## Dependency Risks

### Dep1: React 19 Stability

| Aspect | Detail |
|---|---|
| Severity | 🟢 Low |
| Description | React 19 is current and stable. All recommended libraries support it. |
| Probability | Very low |
| Impact | Minimal |
| Mitigation | Keep dependencies up to date. |

### Dep2: Google Fonts CDN

| Aspect | Detail |
|---|---|
| Severity | 🟢 Low |
| Description | Fonts are loaded from Google Fonts CDN. If CDN is down, app renders in system fonts. |
| Probability | Very low |
| Impact | Visual degradation but app still works |
| Mitigation | Consider self-hosting fonts as a fallback. Add font-display: swap. |

---

## Summary: Top 5 Risks to Track

| # | Risk | Severity | Status |
|---|---|---|---|
| 1 | API key security for discovery feature | 🔴 Critical | Need serverless proxy plan |
| 2 | Data loss anxiety (browser-only storage) | 🔴 Critical | Implement export in Phase 3 |
| 3 | Design system drift | 🟠 High | DESIGN_INTEGRITY_GUIDELINES created |
| 4 | MVP feature creep | 🟠 High | Strict MVP defined |
| 5 | IndexedDB storage limits | 🟠 High | Monitor and warn users |
