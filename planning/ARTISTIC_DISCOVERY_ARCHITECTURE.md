# Artistic Discovery Architecture

## Problem Statement

The user uploads a drawing and wants to discover **artistically similar** works online — not just visually similar photos, but actual drawings, sketches, illustrations, and paintings with similar linework, composition, subject treatment, mood, color palette, and artistic technique.

This is significantly harder than generic image similarity search.

---

## What Is Feasible Without AI

| Capability | Approach | Reliability |
|---|---|---|
| Color palette extraction | Canvas API → sample pixels → k-means clustering | High — straightforward client-side |
| Dominant color matching | Compare extracted palettes between images | Medium — colors don't imply artistic similarity |
| Image hash / perceptual hash | pHash, dHash, aHash algorithms | Medium — finds near-duplicates, not stylistic similarity |
| Basic metadata search | Search by keywords derived from user-entered tags | Medium — requires manual tagging |
| Reverse image search URL generation | Construct Google Images/TinEye search URL and open externally | High — but loses in-app experience |

---

## What Requires a Search API

### Google Cloud Vision — Web Detection

**Endpoint:** `images.annotate` with `WEB_DETECTION` feature

**What it returns:**
- `webEntities` — labels/topics detected (e.g., "bird", "illustration", "sketch")
- `visuallySimilarImages` — URLs of similar images found on the web
- `pagesWithMatchingImages` — web pages containing similar images
- `fullMatchingImages` / `partialMatchingImages` — exact/partial matches

**Strengths:**
- Returns actual URLs to similar images on the web
- Includes source page URLs for attribution
- Labels can be used for filtering

**Limitations:**
- Returns **visually similar** results, not **artistically similar** — a photo of a bird will match drawings of birds, but also photos of birds, bird products, bird memes
- No understanding of linework quality, artistic technique, or medium
- Results include irrelevant images (products, screenshots, memes, ads)
- **Cost:** $1.50 per 1,000 images (first 1,000 free/month)
- Rate limit: 1,800 requests/minute
- Returns URLs, not images — images may be behind CDNs, paywalls, or may disappear

### Google Cloud Vision — Label Detection

**What it returns:** Labels like "Drawing", "Sketch", "Illustration", "Bird", "Painting"

**Useful for:** Classifying whether a result is artwork vs. photograph (see filtering below)

**Cost:** $1.50 per 1,000 images

### Google Lens (Web)

**Not a programmable API.** Users can manually use Google Lens, but there is no official REST API for automated artistic search. The Chrome DevTools MCP could potentially automate a Google Lens search in a browser, but this is fragile, against TOS, and not recommended for production.

### Alternative: Bing Visual Search API

**Cost:** 1,000 free transactions/month, then $3/1,000
**Returns:** Similar images, shopping results, entity recognition
**Same limitations** as Google regarding artistic vs. visual similarity

### Alternative: SerpApi (Google Lens scraper)

**Cost:** 100 free searches/month, then $50/month for 5,000
**Returns:** Scraped Google Lens results
**Risk:** Depends on scraping, may break without notice

---

## What Requires a Vision Model (AI)

### Drawing vs. Photograph Classification

**Task:** Given a candidate image, determine if it's a drawing/sketch/illustration or a photograph/product/screenshot.

**Approach:** Send image to Gemini or Claude with a structured prompt:
```
Classify this image: Is it (a) a hand-drawn artwork, sketch, or illustration, 
(b) a painting, (c) a photograph, (d) a product/advertisement, (e) a screenshot/meme, 
(f) other? Return only the category letter.
```

**Feasibility:** Easy — vision models are very good at this distinction  
**Cost:** Gemini 2.0 Flash free tier: 15 RPM, 1M tokens/day  
**Reliability:** High (90%+)

### Artistic Similarity Explanation

**Task:** Given two images (user's drawing + a result), explain visible artistic similarities.

**Approach:** Send both images to Gemini with prompt:
```
Compare these two artworks. Describe visible artistic similarities in:
1. Linework and technique
2. Subject matter and composition
3. Color palette and tonal range
4. Medium and material
5. Mood and artistic intent
Return as JSON with these 5 fields.
```

**Feasibility:** Moderate — models can describe similarities but may hallucinate  
**Cost:** Free tier viable for low usage  
**Reliability:** Medium (70-80%) — descriptions may be generic or incorrect

### Style/Technique Tagging

**Task:** Suggest artistic style tags for an image (e.g., "cross-hatching", "ink wash", "contour drawing").

**Feasibility:** Moderate  
**Reliability:** Medium — good for broad categories, unreliable for nuanced techniques

---

## What Can Be Done Locally (Client-Side)

| Capability | Library/Method | Notes |
|---|---|---|
| Color palette extraction | Canvas API + k-means | No API cost, fast |
| Image resizing/compression | `browser-image-compression` | Already planned |
| Perceptual hashing | `imghash` or custom | For duplicate detection |
| Basic edge detection | Canvas convolution filters | For linework analysis (crude) |
| Dominant color comparison | Euclidean distance in LAB color space | Compare palettes |
| Thumbnail generation | Canvas API | For timeline/gallery |

---

## Recommended Search Pipeline

### Phase 1: Mock Service (MVP)

```
User uploads drawing
  → Show mock processing animation (existing)
  → Return curated mock results (existing data)
  → Display in results UI (existing)
  → User can save references (existing)
```

**Implementation:** Create a `discoveryService` with a `search()` method that returns `Promise<DiscoveryResult[]>`. Initially returns mock data with a 2-second artificial delay.

### Phase 2: Basic Search (v1.2)

```
User uploads drawing
  → Extract color palette locally (client-side)
  → Send to Google Cloud Vision Web Detection
  → Receive candidate URLs + web entities
  → For each candidate URL:
    → Fetch image metadata
    → Classify as artwork/photo using label detection
    → Filter out non-artwork results
  → Sort by relevance
  → Display results with source attribution
  → User can save references with source links
```

### Phase 3: Enhanced Search (v2.0)

```
Same as Phase 2, plus:
  → Send user drawing + top results to Gemini for:
    → Artistic similarity explanation
    → Style/technique tagging
    → Mood/tone description
  → Enhance results with AI-generated metadata
  → Allow user to edit/reject AI suggestions
```

---

## Filtering Strategy (Drawing vs. Non-Drawing)

This is the hardest technical challenge. The recommended approach combines multiple signals:

1. **Label-based filtering:** Use Vision API labels to identify "Drawing", "Sketch", "Illustration", "Painting", "Art". Remove results labeled only as "Photography", "Product", "Food", etc.

2. **URL-based filtering:** Prioritize results from known art sources:
   - museum sites (metmuseum.org, rijksmuseum.nl, britishmuseum.org)
   - art archives (archive.org, biodiversitylibrary.org, wellcomecollection.org)
   - art platforms (deviantart.com, artstation.com, behance.net)
   - Block known non-art sources (amazon.com, ebay.com, pinterest.com product pins, shutterstock.com)

3. **AI classification (if budget allows):** Send each candidate to Gemini with a simple "is this hand-drawn artwork?" prompt.

4. **User feedback:** Let users flag results as "not artwork" — use this to improve URL blocklists over time.

**Expected accuracy:** 60-70% with labels alone; 80-85% with labels + URL filtering; 90%+ with AI classification assist.

---

## Source Attribution and Copyright

### Principles
- Always link to the original web page, not just the image URL
- Display the source website name prominently
- Never re-host third-party images at full resolution — use thumbnails for display, link for viewing
- Include a "View Original" button that opens the source page
- Do not claim ownership or allow downloading of third-party images
- Respect robots.txt and meta tags

### Implementation
- Store `sourcePageUrl` (the page containing the image, not the image URL)
- Store `sourceImageUrl` (for thumbnail display only)
- Store `sourceDomain` (for attribution display)
- Proxy images through a CORS-compliant thumbnail service or display via `<img>` with referrer policy

---

## Cost Analysis

| Service | Free Tier | Cost After Free | Monthly Usage (MVP) |
|---|---|---|---|
| Google Cloud Vision Web Detection | 1,000/month | $1.50/1,000 | ~50 searches = free |
| Google Cloud Vision Labels | 1,000/month | $1.50/1,000 | ~500 classifications = free |
| Gemini 2.0 Flash API | 15 RPM, 1M tokens/day | $0.075/1M tokens | ~200 explanations = free |
| SerpApi (fallback) | 100/month | $50/5,000 | ~50 searches = free |

**MVP monthly cost: $0** (if staying within free tiers)

---

## Mocking Strategy

### Mock Data Structure

```typescript
interface DiscoveryResult {
  id: string;
  imageUrl: string;           // Local path for mock, URL for real
  thumbnailUrl: string;
  title: string;
  artist: string;
  sourceDomain: string;
  sourcePageUrl: string;
  similarityScore: number;    // 0-100
  similarityCategory: 'linework' | 'composition' | 'palette' | 'subject' | 'mood' | 'technique';
  similarityExplanation: string;
  dominantColors: string[];
  medium: string;
  isArtwork: boolean;         // Classification result
  tags: string[];
}
```

### Mock Service Contract

```typescript
interface DiscoveryService {
  search(imageBlob: Blob): Promise<DiscoveryResult[]>;
  getRelatedToArtwork(artworkId: string): Promise<DiscoveryResult[]>;
  classifyAsArtwork(imageUrl: string): Promise<boolean>;
  extractPalette(imageBlob: Blob): Promise<string[]>;
  explainSimilarity(image1: Blob, image2: Blob): Promise<string>;
}
```

The mock implementation returns the existing `MOCK_KINDRED_ARTWORKS` data mapped to this interface, with artificial delays. The real implementation will call the APIs described above.

---

## What May Be Unreliable

| Feature | Risk | Mitigation |
|---|---|---|
| Artistic filtering of results | 30-40% false positives expected | Let users hide/flag results |
| Similarity explanations | May be generic or hallucinated | Mark as "AI-suggested", allow editing |
| Source attribution | URLs may be broken, images removed | Graceful fallback, "source unavailable" state |
| External image loading | CORS, CDN restrictions, rate limits | Proxy thumbnails, lazy load, show placeholder on failure |
| Consistent result quality | Varies wildly by input image | Set user expectations, show confidence level |
