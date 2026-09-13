# Open Questions and Assumptions

## Questions Requiring User Decision

### Q1: Data Storage Strategy

**Question:** Should the MVP use browser-only storage (IndexedDB), or should we plan for a backend from day one?

**Current Assumption:** IndexedDB for MVP, cloud storage (Supabase) added in Phase 8.

**Trade-offs:**

| Approach | Pros | Cons |
|---|---|---|
| IndexedDB only (MVP) | Zero hosting cost, offline by default, no auth complexity, fast to build | Data locked to one browser, data loss risk, no sync across devices |
| Supabase from day one | Data safety, cross-device access, real auth | Hosting dependency, requires GCP/Supabase account, more complex MVP |

**Recommendation:** Start with IndexedDB. Add export/import in Phase 3 for data safety. Migrate to Supabase in Phase 8.

---

### Q2: Discovery Feature — Real API or External Link?

**Question:** For the similarity search, should we (a) call Google Cloud Vision API and display results in-app, or (b) generate a Google Lens / reverse image search URL and open it in a new tab?

**Current Assumption:** Mock in MVP, real API in Phase 5.

**Trade-offs:**

| Approach | Pros | Cons |
|---|---|---|
| In-app API results | Complete in-app experience, can filter/save results | API costs, API key security needs proxy, result quality varies |
| External search link | Zero cost, zero maintenance, uses Google's full capability | Leaves the app, no save-to-references, no filtering, no attribution |
| Hybrid | Best of both — external for power users, in-app for curated results | More complex to build |

**Recommendation:** Start with mock data. Phase 5 implements real API with serverless proxy. Add "Open in Google Lens" as a fallback button.

---

### Q3: Image Compression Settings

**Question:** What compression settings are appropriate for line drawings? Standard photo compression (JPEG 80%) can introduce artifacts on line art.

**Current Assumption:** WebP at 80% quality for display, 70% for thumbnails, with original always preserved.

**Testing needed:** Compress a few of the 20 artwork samples and verify quality visually before committing to settings.

---

### Q4: Artwork Deletion Policy

**Question:** Should deletion be immediate, soft-delete with a grace period, or "archive" (hidden but recoverable)?

**Current Assumption:** Soft delete with 30-day recovery period. "Trash" section accessible from settings.

**Recommendation:** Soft delete. Users are storing irreplaceable creative work — accidental deletion must always be recoverable.

---

### Q5: Navigation Structure for Growing Feature Set

**Question:** The current navigation has 4 items (Gallery, Discover, Saved, About). The full feature set adds 4+ more screens (Sketchbook, Timeline, Progress, Creative Space, Supplies, Saved References). How should navigation scale?

**Options:**

| Approach | Pros | Cons |
|---|---|---|
| Flat top nav (all items visible) | Everything accessible in one click | Gets crowded with 7+ items |
| Grouped top nav with dropdowns | Clean, organized | Requires extra click, less discoverable |
| Sidebar navigation | Scales to many items, common pattern | Takes horizontal space, feels more "app" and less "creative" |
| Tab bar (bottom, mobile-style) | Familiar, scalable | May not fit artistic identity, less discoverable on desktop |

**Recommendation:** Keep top navigation for primary sections (Home, Sketchbook, Discover, About). Add secondary nav within sections (e.g., Sketchbook > Timeline, Progress as tabs/sub-nav). Creative Space and Settings as footer or profile-area links.

---

### Q6: Collections vs. Tags

**Question:** Are collections (albums/folders) and tags redundant? Should the app have one or both?

**Current Assumption:** Both. Collections are curated groups (like photo albums). Tags are descriptive labels for filtering.

**Recommendation:** Both, because they serve different purposes:
- **Collections** = intentional grouping ("My bird drawings", "2026 Inktober")
- **Tags** = descriptive metadata for search/filter ("ink", "bird", "portrait", "A4")

---

### Q7: Calendar View — Month Grid or Timeline?

**Question:** Should the timeline be a traditional calendar grid (with thumbnails in day cells) or a vertical scrollable timeline (Instagram-story-like)?

**Current Assumption:** Both, as different views — calendar grid for overview, vertical timeline for browsing.

---

## Assumptions Log

### Technical Assumptions

| ID | Assumption | Risk if Wrong | Verification |
|---|---|---|---|
| TA1 | IndexedDB can reliably store 1-2GB of image blobs in Chrome | Users lose data or can't save | Test with 200 large images on target browsers |
| TA2 | `browser-image-compression` handles line art without unacceptable artifacts | Quality loss on precious artwork | Test with the 20 artwork samples |
| TA3 | React Router v7 is compatible with React 19 | Router doesn't work | Check compatibility matrix |
| TA4 | Zustand is sufficient for this app's state complexity | Need to migrate to Redux or Context | State is relatively simple; Zustand should be fine |
| TA5 | Google Cloud Vision Web Detection returns at least some art-relevant results for line drawings | Discovery feature produces only garbage | Test with 5 artwork samples |
| TA6 | Gemini 2.0 Flash can classify images as artwork vs. photograph with >80% accuracy | False positives pollute results | Test with 50 mixed images |
| TA7 | Vite builds remain fast as the project grows to 50+ components | Build times become annoying | Monitor build times |

### Design Assumptions

| ID | Assumption | Risk if Wrong | Verification |
|---|---|---|---|
| DA1 | Users want a personal sketchbook more than a discovery tool | MVP focuses on the wrong feature | User interviews or rapid prototype testing |
| DA2 | The existing design system can accommodate new features without major revision | New screens feel disconnected | Design review against guidelines |
| DA3 | Users will manually enter metadata (title, date, medium) | Metadata entry is too tedious, users skip it | Make fields optional, add AI suggestions later |
| DA4 | Hobby artists create 1-5 drawings per week on average | Storage estimates are wrong, performance planning is off | Doesn't matter much; design for 500/year max |
| DA5 | Users photograph old drawings and want to backdate them | creationDate vs uploadDate distinction is unnecessary | Keep both; low cost |

### Product Assumptions

| ID | Assumption | Risk if Wrong | Verification |
|---|---|---|---|
| PA1 | Users want to keep their art private (no social features) | Users actually want to share/get feedback | If so, add optional sharing in v3 |
| PA2 | Users are on desktop when organizing (mobile for quick capture) | Primary use is mobile, desktop UX doesn't matter | Responsive design handles both |
| PA3 | AI features should always be optional and editable | Users actually want AI to do everything automatically | Add toggle in settings |
| PA4 | Numerical skill scoring is insulting to casual artists | Some users actually want progress metrics | If requested, add optional "personal milestone" tracking that the user defines |

---

## Decisions Made

| ID | Decision | Rationale | Date |
|---|---|---|---|
| DEC1 | Local-first architecture (IndexedDB) for MVP | Zero hosting cost, privacy by default, simpler to build | Planning phase |
| DEC2 | Mock discovery service for MVP | Avoid API costs and key security complexity until core features are stable | Planning phase |
| DEC3 | Zustand over Redux | App state is straightforward; Zustand is 10x smaller and simpler | Planning phase |
| DEC4 | React Router over manual screen switching | URL routing is essential for a real application | Planning phase |
| DEC5 | Component extraction before new features | Reusable components prevent design drift and speed up development | Planning phase |
| DEC6 | Fraunces + Inter fonts (keep existing) | Already loaded, matches design system, no reason to change | Planning phase |
| DEC7 | Preserve existing prototype screens | Good visual design already done; refactor, don't rewrite | Planning phase |
| DEC8 | Soft delete for artworks | Users store irreplaceable creative work; accidental deletion must be recoverable | Planning phase |
