# Codebase Audit

## Executive Summary

The project is a **visual-only prototype** of an artistic similarity discovery app called **"Kin — Kindred Artistic Expressions Discovery."** It is built with React 19, TypeScript, and Vite. The app currently demonstrates a single user flow: upload a drawing → see a simulated processing animation → view mock "kindred" results → examine a detail view → save favorites. **No real backend, database, authentication, or API integrations exist.** All data is hardcoded mock data. The design system is well-defined across 4 design documents and is faithfully implemented in the CSS and components.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.0.0 |
| Language | TypeScript | 5.7.3 |
| Build Tool | Vite | 6.2.0 |
| Icons | lucide-react | 1.16.0 |
| Styling | Vanilla CSS (CSS custom properties) | N/A |
| Fonts | Google Fonts (Fraunces + Inter) | Loaded via CDN |
| Package Manager | npm | N/A |
| Module System | ESM (`"type": "module"`) | N/A |

**Notable absences:** No router library, no state management library, no backend framework, no database ORM, no image processing library, no testing framework.

---

## Folder Structure

```
drawing storing app/
├── artist-refrence/          # 20 original artwork JPEGs (root copy, misspelled)
├── design/                   # 4 design documents
│   ├── ANTIGRAVITY_UI_SPEC.md
│   ├── ARTWORK_ASSET_MAP.md
│   ├── DESIGN_SYSTEM.md
│   └── VISUAL_REFERENCE.md
├── dist/                     # Build output
├── public/
│   ├── artist-reference/     # 60 files: 20 originals + 20 art-NN aliases + 20 underscore aliases
│   └── favicon.svg
├── screenshots/              # 15 UI screenshots documenting the prototype
├── scripts/
│   └── setup-assets.js       # Copies WhatsApp-named files → art-NN.jpeg aliases
├── src/
│   ├── components/           # 4 shared components
│   ├── data/
│   │   └── artworks.ts       # All mock data: types, source artwork index, samples, mock results
│   ├── screens/              # 7 screen components
│   ├── App.tsx               # Root component, screen router, state holder
│   ├── index.css             # Complete design system tokens + global styles
│   └── main.tsx              # React entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Existing Routes/Screens

The app uses **manual screen switching via React state** (no URL routing library):

| Screen Key | Component | Status |
|---|---|---|
| `home` | `HomeScreen` | Visual only — landing page |
| `upload` | `UploadScreen` | Functional — accepts file drag/drop, creates object URL |
| `processing` | `ProcessingScreen` | Visual only — animated, no real processing |
| `results` | `ResultsScreen` | Visual only — displays mock data with filter/slider |
| `detail` | `ArtworkDetailScreen` | Visual only — side-by-side compare, palette, dimension bars |
| `favorites` | `FavoritesScreen` | Functional — saves/removes from in-memory array |
| `about` | `AboutScreen` | Complete editorial page |

---

## Existing Components

| Component | Purpose | Reusability |
|---|---|---|
| `Navigation` | Sticky header with brand, nav links, upload CTA | High — will need modification for new nav items |
| `EyeMark` | Custom SVG eye logo/mark | High — brand element |
| `ConcentricPortal` | Animated SVG concentric discs for processing | Medium — specific to processing screen |
| `FeatherDivider` | SVG decorative section divider | High — used across multiple screens |

---

## Current State Management

- All state lives in `App.tsx` via `useState` hooks
- `currentScreen`, `uploadedDrawing`, `selectedArtwork`, `savedArtworks`, `hasSearched`
- No external state management, no persistence, no URL-based routing

---

## Existing Mock Data

- `Artwork` interface — 15 fields including matchScore, similarityReason, dimensions
- `SOURCE_ARTWORKS` — Record of all 20 original drawings
- `SAMPLE_USER_DRAWINGS` — 5 preset drawings
- `MOCK_KINDRED_ARTWORKS` — 8 mock similar art results

---

## Existing Artwork Assets

- 20 original drawings in `public/artist-reference/` with 3 naming variants (60 files total)
- 20 copies in root `artist-refrence/` (redundant, misspelled)
- File sizes: 136KB–617KB, no optimization applied

---

## What Is Already Functional

1. File upload via drag-and-drop and file picker
2. Image preview after upload
3. Mock processing animation
4. Mock results with filtering
5. Artwork detail with side-by-side comparison
6. Color palette display (mock)
7. Save/unsave to in-memory favorites
8. Favorites view with empty state
9. About/manifesto page
10. Design system tokens in CSS

## What Is Visual Only

1. No real image upload/storage
2. No real similarity search
3. No computed match scores
4. No AI-generated similarity reasons
5. No real color palette extraction
6. No data persistence
7. No URL routing
8. No authentication
9. No responsive mobile layout

---

## Technical Debt

| Issue | Severity |
|---|---|
| No URL router | High |
| All state in App.tsx | Medium |
| No data persistence | High |
| Inline styles everywhere (200-450 line components) | Medium |
| No error boundaries | Medium |
| No loading/error states for real data | High |
| 60 redundant image files (~18MB duplicates) | Low |
| No image optimization | Medium |
| No test suite | Medium |

---

## Risks of Modifying Existing Code

1. Inline styles tightly coupled — CSS extraction touches every file
2. Screen switching in App.tsx — router introduction requires full refactor
3. `Artwork` type designed for "results" not "personal sketchbook" — needs expansion
4. Navigation hardcoded for 4 screens
5. No test suite — refactoring risk with zero automated validation
