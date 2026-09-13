# Feature Feasibility Matrix

## Rating Scale

| Rating | Meaning |
|---|---|
| ✅ Easy | Straightforward, well-understood, minimal risk |
| 🟡 Moderate | Some complexity, known unknowns, needs careful design |
| 🔴 Hard | Significant complexity, external dependencies, high risk |
| ⚠️ Risky | Uncertain feasibility, may require fallback plan |
| ❌ Not feasible | Not practical for this project/timeline |

---

## Core Features

| Feature | Technical Difficulty | Design Complexity | External Dependencies | Mock-First? | Phase | Estimated Effort |
|---|---|---|---|---|---|---|
| **URL Routing** | ✅ Easy | ✅ Easy | react-router-dom | No | 1 | 1 day |
| **State Management (Zustand)** | ✅ Easy | 🟡 Moderate | zustand | No | 1 | 1 day |
| **IndexedDB Data Layer** | 🟡 Moderate | ✅ Easy | idb | No | 1 | 2 days |
| **Image Upload + Compression** | 🟡 Moderate | ✅ Easy | browser-image-compression | No | 2 | 2 days |
| **Artwork CRUD** | ✅ Easy | 🟡 Moderate | None | No | 2 | 2 days |
| **Personal Gallery/Sketchbook** | ✅ Easy | 🟡 Moderate | None | No | 2 | 2 days |
| **Artwork Detail (Personal)** | ✅ Easy | ✅ Easy (exists) | None | No | 2 | 1 day |
| **Artwork Metadata Editing** | ✅ Easy | 🟡 Moderate | None | No | 2 | 2 days |
| **Favorites/Starring** | ✅ Easy | ✅ Easy (exists) | None | No | 2 | 0.5 days |
| **Tags System** | 🟡 Moderate | 🟡 Moderate | None | No | 2 | 1.5 days |
| **Collections/Albums** | 🟡 Moderate | 🟡 Moderate | None | No | 2 | 2 days |
| **Filtering (medium, date, tags)** | 🟡 Moderate | 🟡 Moderate | date-fns | No | 2 | 2 days |
| **Basic Responsive Layout** | 🟡 Moderate | 🟡 Moderate | None | No | 2 | 2 days |
| **Error Boundaries + States** | ✅ Easy | 🟡 Moderate | None | No | 2 | 1 day |

---

## Timeline + Progress Features

| Feature | Technical Difficulty | Design Complexity | External Dependencies | Mock-First? | Phase | Estimated Effort |
|---|---|---|---|---|---|---|
| **Calendar View** | 🟡 Moderate | 🔴 Hard | date-fns | No | 4 | 3 days |
| **Timeline Chronological Browse** | 🟡 Moderate | 🟡 Moderate | None | No | 4 | 2 days |
| **Calendar Grouping by Date** | ✅ Easy | 🟡 Moderate | date-fns | No | 4 | 1 day |
| **Timeline Filters** | ✅ Easy | 🟡 Moderate | None | No | 4 | 1 day |
| **Progress Projects CRUD** | 🟡 Moderate | 🟡 Moderate | None | No | 4 | 2 days |
| **Version Upload (to Project)** | 🟡 Moderate | 🟡 Moderate | None | No | 4 | 1.5 days |
| **Side-by-Side Comparison** | ✅ Easy (exists) | ✅ Easy (exists) | None | No | 4 | 0.5 days |
| **Overlay Slider Comparison** | 🟡 Moderate | 🟡 Moderate | None | No | 4 | 2 days |
| **Version Notes** | ✅ Easy | ✅ Easy | None | No | 4 | 0.5 days |

---

## Discovery Features

| Feature | Technical Difficulty | Design Complexity | External Dependencies | Mock-First? | Phase | Estimated Effort |
|---|---|---|---|---|---|---|
| **Mock Discovery Service** | ✅ Easy | ✅ Easy | None | Yes (it IS the mock) | 2 | 0.5 days |
| **Client-Side Palette Extraction** | 🟡 Moderate | ✅ Easy | Canvas API | No | 5 | 1.5 days |
| **Google Vision Web Detection** | 🟡 Moderate | ✅ Easy | Google Cloud Vision API | Yes (mock first) | 5 | 2 days |
| **Artwork vs Photo Filtering** | 🔴 Hard | ✅ Easy | Vision Labels + heuristics | Yes (mock first) | 5 | 3 days |
| **Results Display** | ✅ Easy (exists) | ✅ Easy (exists) | None | No | 5 | 0.5 days |
| **Source Attribution** | 🟡 Moderate | 🟡 Moderate | None | No | 5 | 1 day |
| **Save to References** | ✅ Easy | ✅ Easy (like favorites) | None | No | 5 | 1 day |
| **Saved References View** | ✅ Easy | ✅ Easy (like favorites) | None | No | 5 | 1 day |

---

## AI Features

| Feature | Technical Difficulty | Design Complexity | External Dependencies | Mock-First? | Phase | Estimated Effort |
|---|---|---|---|---|---|---|
| **AI Medium Detection** | 🟡 Moderate | ✅ Easy | Gemini API | Yes | 7 | 1 day |
| **AI Subject Tagging** | ✅ Easy | ✅ Easy | Vision Labels or Gemini | Yes | 7 | 1 day |
| **AI Style Tagging** | 🔴 Hard | ✅ Easy | Gemini API | Yes | 7 | 1 day |
| **AI Similarity Explanations** | 🟡 Moderate | ✅ Easy (exists) | Gemini API | Yes (exists) | 7 | 1.5 days |
| **AI Progress Observations** | ⚠️ Risky | 🟡 Moderate | Gemini API | Skip initially | 8 | 2 days |
| **AI Tone/Mood Detection** | ⚠️ Risky | ✅ Easy | Gemini API | Skip initially | 8 | 1 day |
| **AI Creative Summaries** | ✅ Easy | ✅ Easy | Gemini or template | Template first | 4 | 0.5 days |
| **AI Artwork Descriptions** | ✅ Easy | ✅ Easy | Gemini API | Yes | 7 | 1 day |

---

## Creative Space Features

| Feature | Technical Difficulty | Design Complexity | External Dependencies | Mock-First? | Phase | Estimated Effort |
|---|---|---|---|---|---|---|
| **Creative Space Page** | ✅ Easy | 🔴 Hard | None | No | 6 | 3 days |
| **Inspiration Wall** | 🟡 Moderate | 🔴 Hard | None | No | 6 | 2 days |
| **Supplies List CRUD** | ✅ Easy | 🟡 Moderate | None | No | 6 | 1.5 days |
| **Material-to-Artwork Linking** | 🟡 Moderate | 🟡 Moderate | None | No | 6 | 1.5 days |
| **Room Setup Checklist** | ✅ Easy | ✅ Easy | None | No | 6 | 0.5 days |

---

## Infrastructure

| Feature | Technical Difficulty | Design Complexity | External Dependencies | Mock-First? | Phase | Estimated Effort |
|---|---|---|---|---|---|---|
| **Reusable Component Library** | 🟡 Moderate | 🟡 Moderate | None | No | 1 | 3 days |
| **Image Optimization Pipeline** | 🟡 Moderate | ✅ Easy | browser-image-compression | No | 2 | 1.5 days |
| **Data Export (JSON + Images)** | 🟡 Moderate | ✅ Easy | File System Access API | No | 3 | 1.5 days |
| **Data Import** | 🔴 Hard | 🟡 Moderate | File System Access API | No | 3 | 2 days |
| **Cloud Auth (Supabase)** | 🟡 Moderate | 🟡 Moderate | Supabase Auth | No | 8 | 3 days |
| **Cloud Storage Migration** | 🔴 Hard | ✅ Easy | Supabase Storage | No | 8 | 4 days |
| **Cloud Sync** | 🔴 Hard | 🟡 Moderate | Supabase Realtime | No | 8 | 5 days |
| **PWA (offline support)** | 🟡 Moderate | ✅ Easy | Service Worker | No | 3 | 2 days |

---

## Total Effort Estimates by Phase

| Phase | Features | Estimated Days |
|---|---|---|
| Phase 1: Foundation | Router, state, data layer, component library | 7 days |
| Phase 2: Personal Sketchbook MVP | Upload, gallery, detail, edit, favorites, tags, collections, filters | 15 days |
| Phase 3: Polish + Infrastructure | Error handling, responsive, PWA, export/import | 7 days |
| Phase 4: Timeline + Progress | Calendar, timeline, projects, comparison | 13 days |
| Phase 5: Discovery | Real search pipeline, palette extraction, references | 10 days |
| Phase 6: Creative Space | Creative space page, supplies, inspiration wall | 9 days |
| Phase 7: AI Enhancement | Medium detection, tagging, descriptions, explanations | 6 days |
| Phase 8: Cloud + Auth | Authentication, cloud storage, sync | 12 days |
| **Total** | | **~79 days** |

> [!NOTE]
> These are rough estimates for a single developer working full-time. Actual time depends heavily on polish level, edge case handling, and iteration based on user feedback. Multiply by 1.5-2x for realistic scheduling.
