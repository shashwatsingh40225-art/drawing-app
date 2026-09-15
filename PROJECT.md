# Project: Kin Art Companion - Mobile Smoke Test Audit Fixes

## Architecture
- **Reader Subsystem**: `ReaderToolbar.tsx`, `ReaderSidebar.tsx`, `MemoryBridgeCard.tsx`, `ReaderViewport.tsx`, `useSwipeGesture.ts`, `ReaderScreen.tsx`.
- **Navigation Subsystem**: `Navigation.tsx`, mobile menu drawer, avatar dropdown.
- **Upload & Artwork Subsystem**: `UploadScreen.tsx`, `ArtworkEditScreen.tsx`, `ArtworkMat.tsx`, `Badge.tsx`.
- **Typography & Responsive Overflows**: `src/index.css`, `HomeScreen.tsx`, `AboutScreen.tsx`.

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone. No feature is unassigned.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Landscape Phone Toolbar Detection | Recognize `innerHeight <= 500` as mobile in `ReaderToolbar.tsx` to prevent 751px overflow and show compact toolbar | M1 (DONE) | Survey 1 (R1) |
| 2 | Mobile Reader Sidebar Drawer | Convert 320px inline sidebar to overlay modal drawer on viewports <= 768px in `ReaderSidebar.tsx` | M1 (DONE) | Survey 1 (R1) |
| 3 | MemoryBridgeCard Layout & Scroll | Prevent 38px width collapse when sidebar is open; add vertical scrolling (`maxHeight: calc(100vh - 120px)`) | M1 (DONE) | Survey 1 (R1) |
| 4 | ReaderViewport Vertical Space Reclamation | Reduce bottom padding from 80px to 16px when in landscape phone mode (`innerHeight <= 500`) or focus mode | M1 (DONE) | Survey 1 (R1) |
| 5 | Single-Touch & Duration in useSwipeGesture | Enforce single-touch (`touches.length === 1`) and max gesture duration (< 350ms) to prevent pinch-to-zoom triggering page turns | M1 (DONE) | Survey 1 (R2) |
| 6 | Zoom-Isolated Swipe in ReaderScreen | Disable swipe page turns when `zoomScale > 1.0` so panning across enlarged documents does not flip pages | M1 (DONE) | Survey 1 (R2) |
| 7 | Touch Propagation Isolation in Panels | Stop touch event propagation (`e.stopPropagation()`) in `ReaderSidebar` and `MemoryBridgeCard` | M1 (DONE) | Survey 1 (R2) |
| 8 | PDF Text Layer Selection Protection | Ensure text selection is not interrupted or treated as a swipe turn | M1 (DONE) | Survey 1 (R2) |
| 9 | Navigation Menus Mutual Exclusion | Ensure `avatarMenuOpen` and `menuOpen` in `Navigation.tsx` are mutually exclusive | M2 | Survey 2 (R3) |
| 10 | Mobile Hamburger Button Touch Target | Increase `.mobile-menu-btn` touch target to >= 44x44px for WCAG 2.5.5 compliance | M2 | Survey 2 (R3) |
| 11 | Minimum 16px Form Input Font Size | Enforce `font-size: 16px !important;` on mobile inputs/selects/textareas in `src/index.css` to prevent iOS Safari auto-zoom | M2 | Survey 2 (R5) |
| 12 | HomeScreen Hero Grid Overflow Fix | Replace `minmax(320px, 1fr)` with `minmax(min(100%, 280px), 1fr)` and reduce horizontal padding on <= 360px viewports | M2 | Survey 2 (R5) |
| 13 | AboutScreen Figcaption Wrap | Add `flexWrap: 'wrap'` and gap to all `<figcaption>` elements in `AboutScreen.tsx` to prevent text overlap at 320px | M2 | Survey 2 (R5) |
| 14 | Native Camera Intent via `image/*` | Add `image/*` and `.heic,.heif` to file input `accept` in `UploadScreen.tsx` for Android/iOS camera chooser | M3 | Survey 3 (R4) |
| 15 | Direct "Take Photo of Sketch" | Add direct capture button with `capture="environment"` in `UploadScreen.tsx` | M3 | Survey 3 (R4) |
| 16 | Eliminate Silent Badger Substitution | In `ArtworkMat.tsx`, eliminate fallback to `art-01.jpeg`; render explicit error card on decode failure and empty state on no image | M3 | Survey 3 (R4) |
| 17 | Tag & Collection Touch Targets >= 44px | Increase touch targets on tag "Add" button, collection toggle pills, and tag remove buttons to >= 44px | M3 | Survey 3 (R4) |
| 18 | E2E Integration & Verification | Run full build (`tsc && vite build`) and automated verification scripts for all R1-R5 features | M4 | Survey 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Reader Geometry & Touch Isolation | Features 1-8 (R1 & R2) | none | DONE |
| M2 | Navigation, Typography & Responsive Overflows | Features 9-13 (R3 & R5) | none | IN_PROGRESS |
| M3 | Camera, Upload & Touch Targets | Features 14-17 (R4) | none | PLANNED |
| M4 | Final Build & E2E Verification | Feature 18 (All R1-R5) | M1, M2, M3 | PLANNED |

## Code Layout & Write Boundaries
- **M1 Files**:
  - `src/components/reader/ReaderToolbar.tsx`
  - `src/components/reader/ReaderSidebar.tsx`
  - `src/components/reader/MemoryBridgeCard.tsx`
  - `src/components/reader/ReaderViewport.tsx`
  - `src/hooks/useSwipeGesture.ts`
  - `src/screens/ReaderScreen.tsx`
- **M2 Files**:
  - `src/components/Navigation.tsx`
  - `src/index.css`
  - `src/screens/HomeScreen.tsx`
  - `src/screens/AboutScreen.tsx`
- **M3 Files**:
  - `src/screens/UploadScreen.tsx`
  - `src/screens/ArtworkEditScreen.tsx`
  - `src/components/ui/ArtworkMat.tsx`
  - `src/components/ui/Badge.tsx`
- **M4 Files**:
  - Verification scripts in `scripts/`
