# Artistic Discovery Review

> **Status: AUTHORITATIVE** — Reviewed under $0 constraint with simplified approach.

---

## Original Concept

Allow users to upload a drawing and discover visually or artistically similar online artworks.

## Reality Check

| Capability | API Required | Free ($0)? | Reliable? | Verdict |
|---|---|---|---|---|
| In-app visual similarity search | Google Cloud Vision Web Detection | ❌ Requires billing account | Medium | **REJECTED** |
| In-app search via Bing | Bing Visual Search API | ❌ Requires Azure billing | Medium | **REJECTED** |
| In-app search via scraping | SerpApi or custom scraping | ⚠️ Fragile, TOS violations | Low | **REJECTED** |
| External Google Lens link | No API | ✅ Free | High | **APPROVED** |
| External Google Images link | No API | ✅ Free | High | **APPROVED** |
| Client-side color palette extraction | Canvas API | ✅ Free | High | **APPROVED** |
| User-provided inspiration references | No API | ✅ Free | N/A | **APPROVED** |

---

## MVP Decision: No Automated Online Search

**The MVP will NOT include automated in-app similarity search.**

Every viable visual search API either requires a credit card, is fragile/scraped, or would need a backend proxy. Under the $0 constraint, none of these are appropriate for an MVP.

---

## What the MVP DOES Include

### 1. Mock Discovery Experience (Existing Prototype)

The existing prototype already has a beautiful discovery flow:
- Upload → Processing animation → Results grid → Detail with similarity explanation

**Keep this entire flow working with mock data.** It demonstrates the concept and looks polished. The mock data (`MOCK_KINDRED_ARTWORKS`) is hand-curated with good explanations.

**How it's labeled:** "Discover Kindred Art — Preview" with a subtle note: "This feature uses curated sample results. Full search coming soon."

### 2. "Find Similar Art" External Link

After the mock flow, add a button: **"Search the web for similar art"**

This opens Google Lens in a new tab with the user's uploaded image:
```
https://lens.google.com/uploadbyurl?url={image_url}
```

Or, if the image is local, prompt the user to drag their image to Google Lens directly.

**Implementation:** A simple `<a>` link that opens in a new tab. Zero API cost. Zero integration complexity. Uses Google's full search capability.

### 3. Manual Inspiration Board

Users can manually save images they find inspiring:
- Paste a URL to an artwork they found online
- Add a title, artist name, and personal notes
- These appear in a "Saved Inspirations" section

This replaces the automated save-from-search-results flow. Users curate their own inspiration collection.

### 4. Client-Side Color Palette Extraction

Extract dominant colors from the user's own artworks using the Canvas API:
```typescript
// src/utils/palette.ts
export function extractPalette(imageElement: HTMLImageElement, count: number = 5): string[] {
  // Draw image to canvas
  // Sample pixels at regular intervals
  // Cluster into dominant colors using simple k-means
  // Return hex color strings
}
```

This is a genuinely useful local feature that requires no external service.

---

## Post-MVP Discovery Options (Ranked)

If discovery is expanded later, these are the options in order of preference:

### Option A: User-Provided Google Cloud Vision Key (Post-MVP)

If a user wants real in-app search, they can:
1. Create a GCP project and enable Cloud Vision API
2. Get an API key
3. Enter it in the app's settings

The app calls the API from the client (no proxy needed for a personal-use key). This is the user's own API key and billing.

**Pros:** Full in-app experience, user controls costs.
**Cons:** Requires technical setup, not suitable for all users.

### Option B: Vercel Edge Function Proxy (Post-MVP)

If the app owner wants to provide search for all users:
1. Store a Vision API key in Vercel environment variables
2. Create a Vercel Edge Function that proxies search requests
3. Rate-limit to prevent abuse

**Pros:** Users don't need their own key.
**Cons:** App owner pays for API usage. Must be rate-limited.

### Option C: Continue With External Links Only

Just keep the Google Lens link. Users who want to search can do so in a browser tab.

**Pros:** Zero cost forever. Zero maintenance.
**Cons:** Loses the in-app curated experience.

---

## Copyright and Attribution

For the manual inspiration board (user-saved references):

| Requirement | Implementation |
|---|---|
| Source attribution | Store and display the source URL |
| Original page link | "View Original" button opens source |
| No rehosting | Store only a reference URL, not the image data |
| User's own notes | Free-text field for personal notes |
| Broken link handling | Show "Source unavailable" if URL returns 404 |

---

## Summary

| Aspect | Original Plan | Revised Plan |
|---|---|---|
| Automated search | Google Vision API ($) | Not in MVP |
| Search UX | In-app results grid | Mock results (existing) + external Google Lens link |
| Saved references | From automated search results | Manual curation by user |
| Color extraction | Client-side | ✅ Keep (no API needed) |
| API keys needed | 1-3 | 0 |
| Backend proxy needed | Yes | No |
| Copyright risk | High (rehosting third-party images) | Low (links only, no image storage) |
| Implementation complexity | High (3+ weeks) | Low (1-2 days) |
