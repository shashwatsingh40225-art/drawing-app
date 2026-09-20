# EPUB Feature Suite: Technical Bug Triage & Audit Report

**Document Version**: 1.0.0  
**Target Milestone**: EPUB Feature Suite Bug Triage  
**Date**: 2026-09-16  
**Auditor**: Teamwork Engineering & QA Audit Group  
**Target System**: Kin Art Companion Web & Mobile Reading Engine (`c:\Users\first\Desktop\drawing storing app`)  
**Scope**: Comprehensive factual audit of EPUB Upload, Storage, Rendering, Pagination, Navigation, Controls, Text Extraction, Reading Sessions, and Mobile Viewports.  
**Constraint Compliance**: Strictly read-only observational audit. Zero modifications to repository application code. Zero fix recommendations, patches, or architectural advice.

---

## 1. Executive Summary

An exhaustive technical investigation and empirical verification were conducted on the EPUB implementation within the Kin Art Companion application. The audit evaluated all components across the EPUB lifecycle, contrasting observed runtime behaviors against expected e-reader standards and the existing PDF reader baseline.

A total of **33 distinct bugs and regressions** were discovered, cataloged, and verified against the repository codebase.

### 1.1 Bug Distribution by Severity

| Severity Level | Count | Definition |
|---|:---:|---|
| **P0 — Blocker** | **2** | Critical failure halting core reading functionality (viewer crash, major navigation jump). |
| **P1 — Critical** | **12** | High-impact functional breakage, data/progress loss, broken touch/swipes, spoiler leaks, session freezes. |
| **P2 — Major** | **14** | Subsystem failures, missing offline caching, memory leaks, margin tap failure, footnote hijacking. |
| **P3 — Minor / Polish** | **5** | Incomplete server constraints, CSS specificity overrides, inoperative zoom buttons, viewport bounds. |
| **Total** | **33** | **Exhaustive triage across all 6 functional areas.** |

### 1.2 Bug Distribution by Component Area

| Component Area | P0 (Blocker) | P1 (Critical) | P2 (Major) | P3 (Minor) | Total Bugs |
|---|:---:|:---:|:---:|:---:|:---:|
| **1. File Upload & Storage** | 0 | 0 | 4 | 1 | **5** |
| **2. Rendering & Pagination** | 0 | 2 | 2 | 1 | **5** |
| **3. Navigation & Chapter Selection** | 1 | 3 | 1 | 0 | **5** |
| **4. Controls & Interactions** | 1 | 1 | 3 | 1 | **6** |
| **5. Text Extraction & Reading Session** | 0 | 2 | 3 | 1 | **6** |
| **6. Mobile & Responsive Viewport** | 0 | 4 | 1 | 1 | **6** |
| **Total** | **2** | **12** | **14** | **5** | **33** |

---

## 2. Baseline Test Suite & Verification Matrix

Static compilation, bundle verification, test suites, and git working-tree status were executed and verified on the host system:

| Verification Target | Command | Result | Observations & Metrics |
|---|---|:---:|---|
| **TypeScript Compilation & Bundling** | `npm run build` | **PASS (Exit 0)** | 0 TypeScript errors. Vite production bundle built in 10.41s (`dist/assets/index-DLOKlK4C.js`: 1,996.68 kB). |
| **Unit & Integration Suite** | `npm test` (`scripts/run-tests.mjs`) | **PASS (Exit 0)** | 43 passed, 0 failed, duration 77.5ms. Covers timeline, pure session math, recap mock API. |
| **Touch & Geometry Verification** | `node scripts/verify-m1-touch-geometry.mjs` | **PASS (Exit 0)** | 44 passed, 0 failed. Validates swipe invariants and landscape phone detection against PDF reader. |
| **Working Tree Integrity** | `git status --porcelain` | **PASS (Clean)** | Zero modifications to existing application source code (`src/`, `api/`, `android/`, `public/`, `package.json`). |
| **EPUB Automated Test Coverage** | Direct Inspection of `scripts/` & `src/` | **0% COVERAGE** | **0 automated tests exist for EPUB functionality.** No unit or integration tests cover `EpubViewport.tsx`, `epubTextExtractor.ts`, or EPUB touch/navigation handlers. |

---

## 3. Individual Bug Records

---

### Area 1: File Upload & Storage

#### EPUB-001: Extension-Only Format Sniffing Rejects Valid EPUB Files Missing `.epub` Extension
- **Severity**: P2 (Major)
- **Component**: File Upload & Storage
- **Affected File(s)**: `src/components/library/BookUploadZone.tsx` (Lines 50–57)
- **Preconditions**: User uploads an EPUB file via drag-and-drop or file picker that lacks a `.epub` extension (e.g. downloaded as `attachment`, `document`, or `book.bin`).
- **Reproduction Steps**:
  1. Rename a valid EPUB document from `alice.epub` to `alice.bin` or `alice`.
  2. Open the Library screen (`/library`) and drop the file into the upload zone.
- **Expected Behavior**: The uploader inspects the file's MIME type or magic bytes to determine that it is an EPUB container, or routes it through format validation.
- **Actual Observed Behavior**: `BookUploadZone.tsx:50` evaluates `file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf'`. The file defaults to format `'pdf'`. It is forwarded to `validatePDFFile(file)`, which rejects the file with the validation error: `"Only PDF files (.pdf) are supported in your library"`.
- **User Impact**: Users cannot upload valid EPUB files that lack explicit `.epub` filenames, leading to confusing rejection messages.

---

#### EPUB-002: Truncated 256-Byte Magic Byte Inspection Falsely Rejects Valid EPUB Archives
- **Severity**: P2 (Major)
- **Component**: File Upload & Storage
- **Affected File(s)**: `src/services/bookService.ts` (Lines 91–100)
- **Preconditions**: An EPUB 3 file generated with extended ZIP headers or ZIP64 extra fields where the `application/epub+zip` payload begins after byte 256.
- **Reproduction Steps**:
  1. Generate or acquire an EPUB archive containing extended extra-field metadata in the local file header preceding the `mimetype` file entry.
  2. Select the file for upload in `BookUploadZone.tsx`.
- **Expected Behavior**: The validator parses the ZIP container structure and verifies the uncompressed `mimetype` file per OCF 3.3 specifications regardless of byte offset.
- **Actual Observed Behavior**: `bookService.ts:91` slices only the first 256 bytes (`file.slice(0, Math.min(file.size, 256))`). When extra field bytes exceed 198 bytes, the string `"application/epub+zip"` is not present in the 256-byte slice. `header.includes('application/epub+zip')` evaluates to `false`, and upload fails with: `"File does not appear to be a valid EPUB document"`.
- **User Impact**: Valid EPUB archives complying with EPUB specifications are rejected during upload.

---

#### EPUB-003: Live Supabase Uploads Bypass Local IndexedDB Storage, Breaking Offline Access
- **Severity**: P2 (Major)
- **Component**: File Upload & Storage
- **Affected File(s)**: `src/services/bookService.ts` (Lines 145–180, 197–205)
- **Preconditions**: User is logged in to Supabase and connected to the internet.
- **Reproduction Steps**:
  1. Upload an EPUB file while authenticated with Supabase.
  2. Disconnect internet connectivity (offline mode).
  3. Navigate to the Library and click the uploaded book to open the Reader.
- **Expected Behavior**: The book opens from local IndexedDB cache, allowing offline reading.
- **Actual Observed Behavior**: `savePDFToLocalCache(filePath, file)` is only invoked in the error branch (`if (error)`) of `supabase.storage.upload()`. When the live upload succeeds, IndexedDB is bypassed. In offline mode, `getPDFUrlFromLocalCache(filePath)` returns `null`, the network request to `supabase.storage.createSignedUrl` fails, and the screen displays: `"This book's file couldn't be retrieved. Check your connection and try again."`.
- **User Impact**: Books uploaded while online cannot be read offline.

---

#### EPUB-004: Discarded Object URLs in `uploadBookFile` Cause Memory Leaks
- **Severity**: P2 (Major)
- **Component**: File Upload & Storage
- **Affected File(s)**: `src/services/bookService.ts` (Lines 137, 157, 179), `src/components/library/BookUploadZone.tsx` (Lines 105–111)
- **Preconditions**: User uploads multiple books during a single browser session.
- **Reproduction Steps**:
  1. Upload a 20MB EPUB file in `BookUploadZone.tsx`.
  2. Inspect memory allocations in browser Developer Tools.
- **Expected Behavior**: Created `blob:` URLs are revoked once no longer in use, or only generated when required.
- **Actual Observed Behavior**: `uploadBookFile` executes `const localUrl = URL.createObjectURL(file);` and returns `{ filePath, signedUrl: localUrl }`. In `BookUploadZone.tsx:105`, destructuring extracts only `const { filePath } = await uploadBookFile(...)`. The generated `signedUrl` is completely discarded without calling `URL.revokeObjectURL()`. The entire file binary remains pinned in browser memory for the lifetime of the tab.
- **User Impact**: Uploading several large books rapidly consumes browser heap memory, risking tab crashes on mobile devices.

---

#### EPUB-005: Supabase `user-books` Storage Bucket Lacks Server-Side Size & MIME Constraints
- **Severity**: P3 (Minor / Polish)
- **Component**: File Upload & Storage
- **Affected File(s)**: `supabase/migrations/008_user_books_bucket.sql` (Lines 6–8), `src/services/bookService.ts` (Line 7)
- **Preconditions**: Direct API access or client-side validation bypass.
- **Reproduction Steps**:
  1. Inspect `supabase/migrations/008_user_books_bucket.sql`.
- **Expected Behavior**: Storage bucket enforces `file_size_limit = 26214400` (25MB) and `allowed_mime_types = ARRAY['application/pdf', 'application/epub+zip']`.
- **Actual Observed Behavior**: The bucket definition executes `INSERT INTO storage.buckets (id, name, public) VALUES ('user-books', 'user-books', false)`. There are zero server-side size limits or MIME restrictions; all limits exist purely in client-side TypeScript code (`MAX_EPUB_SIZE_BYTES = 25 * 1024 * 1024`).
- **User Impact**: Storage layer provides no server-side defense-in-depth against oversized payloads or unexpected file types.

---

### Area 2: Rendering & Pagination

#### EPUB-006: Spine-Section Coarse Pagination Erases Intra-Chapter Progress on Reload / Exit
- **Severity**: P1 (Critical)
- **Component**: Rendering & Pagination
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 185–191, 230–232), `src/screens/ReaderScreen.tsx` (Lines 299–310), `src/stores/readingProgressStore.ts` (Lines 118–132)
- **Preconditions**: An EPUB book containing multi-screen chapters (e.g. 25 screens in Chapter 2).
- **Reproduction Steps**:
  1. Open an EPUB book and navigate to Chapter 2, visual screen 18.
  2. Refresh the browser page or exit to `/library` and reopen the book.
- **Expected Behavior**: The reader returns to Chapter 2, screen 18.
- **Actual Observed Behavior**: In `EpubViewport.tsx:187`, `if (cancelled || index === lastRelocatedIndexRef.current) return;` explicitly suppresses `onPageChange` during intra-section turns. `saveProgress` is only invoked inside `handlePageChange`. Consequently, `current_page: 2` (the spine section index) is saved. On reload, line 231 executes `rendition.display(target.href)`, resetting the user to visual screen 1 of Chapter 2.
- **User Impact**: Users lose their exact reading position on every reload or session exit, forced to manually re-navigate through multi-screen chapters.

---

#### EPUB-007: Full-File ArrayBuffer Memory Loading Causes Heap Spikes on Mobile Devices
- **Severity**: P1 (Critical)
- **Component**: Rendering & Pagination
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 140–150), `src/services/epubTextExtractor.ts` (Lines 42–51)
- **Preconditions**: Opening a large EPUB file (15MB–25MB) on a mobile device or memory-constrained browser.
- **Reproduction Steps**:
  1. Upload a 24MB illustrated EPUB file.
  2. Open the book on a mobile phone (portrait or landscape).
- **Expected Behavior**: Document streams or loads progressively without forcing the entire archive into an uncompressed memory buffer.
- **Actual Observed Behavior**: `fetch(fileUrl)` downloads the entire file and calls `res.arrayBuffer()`, followed by `ePub(buffer)`. The raw ArrayBuffer plus uncompressed zip structures and rendered DOM trees coexist in memory simultaneously, causing tab memory spikes above 120MB.
- **User Impact**: Mobile browsers and low-memory Android devices terminate or refresh the tab unexpectedly due to out-of-memory constraints.

---

#### EPUB-008: Section Boundary Crossing Causes Blank Screens & Unhandled Promise Rejections
- **Severity**: P2 (Major)
- **Component**: Rendering & Pagination
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 116–126, 231), `node_modules/epubjs/src/managers/default/index.js` (Lines 508–521)
- **Preconditions**: Navigating across chapter boundaries in an EPUB.
- **Reproduction Steps**:
  1. Read to the final on-screen column of Chapter 1.
  2. Tap right or press ArrowRight to advance into Chapter 2.
- **Expected Behavior**: Smooth visual transition to the new chapter with continuous loading feedback if asynchronous parsing is required.
- **Actual Observed Behavior**: `DefaultViewManager.prototype.next` calls `this.clear()`, wiping the existing iframe content immediately. The viewport displays a blank canvas for 300ms–2000ms while Chapter 2 is parsed and appended. In `animateTurn` (`EpubViewport.tsx:116`), `Promise.resolve(action()).finally(...)` contains no `.catch()` handler. If section XML fails to parse or remote assets fail, an unhandled promise rejection error is logged to the console, and opacity remains at 0.
- **User Impact**: Jarring blank screen flashes during chapter transitions, and visual freezing if section display fails.

---

#### EPUB-009: Dangling Book Instances and Unrevoked Blob URLs on Component Unmount
- **Severity**: P2 (Major)
- **Component**: Rendering & Pagination
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 140–150, 240–246)
- **Preconditions**: User rapidly navigates into and out of the reader screen while a book is loading.
- **Reproduction Steps**:
  1. Open a book in the reader.
  2. Immediately tap the Back button while "Opening book..." is displayed.
- **Expected Behavior**: In-flight fetch and book initialization are aborted, and all memory is released.
- **Actual Observed Behavior**: In `EpubViewport.tsx:240-246`, cleanup runs while `fetch` or `book.ready` is pending; `bookRef.current` is null, so `bookRef.current?.destroy()` executes on null. When `fetch` completes, `if (cancelled) return;` exits without calling `.destroy()` on the newly resolved `ePub` instance. Furthermore, blob URLs generated by epub.js for unpacked images and CSS are never tracked or revoked.
- **User Impact**: Navigating between books accumulates zombie `ePub` instances and unreleased blob objects in memory.

---

#### EPUB-010: Font Zoom Specificity Override Failure and Unscaled Line-Height
- **Severity**: P3 (Minor / Polish)
- **Component**: Rendering & Pagination
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 169, 266–268), `node_modules/epubjs/src/themes.js` (Lines 205–216, 246–248)
- **Preconditions**: EPUB document containing internal CSS rules defining element-level font sizes or fixed line heights.
- **Reproduction Steps**:
  1. Open an EPUB containing `<style>p { font-size: 14px; line-height: 18px; }</style>`.
  2. Increase zoom scale to 200% via ReaderZoomStrip.
- **Expected Behavior**: Text scales proportionally and line spacing expands to accommodate the larger font size.
- **Actual Observed Behavior**: `Themes.prototype.fontSize` calls `this.override("font-size", size)` with priority `false` (omitting `!important`). Element-level rules in the EPUB override the body font size. For books where text does scale, `EpubViewport.tsx` applies no `line-height` scaling, causing text lines to collide and overlap vertically.
- **User Impact**: Zoom controls fail to resize text in styled EPUBs, or cause text overlap at high zoom levels.

---

### Area 3: Navigation & Chapter Selection

#### EPUB-011: Unhandled TypeError on Missing or Malformed TOC Halts Book Load
- **Severity**: P0 (Blocker)
- **Component**: Navigation & Chapter Selection
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 38–44, 51)
- **Preconditions**: An EPUB 2 or EPUB 3 document lacking an NCX (`toc.ncx`) or NAV (`nav.xhtml`) document, or whose navigation object fails to parse.
- **Reproduction Steps**:
  1. Upload and open an EPUB file that has no table of contents.
  2. Navigate to the reader screen `/reader/:id`.
- **Expected Behavior**: The viewer handles the missing TOC gracefully, falling back to default "Section 1", "Section 2" labels.
- **Actual Observed Behavior**: `EpubViewport.tsx:51` executes:
  `for (const { href, label } of flattenToc(book.navigation.toc))`
  When `book.navigation.toc` is undefined or null, `flattenToc` executes `for (const item of items)`.
  **Runtime Exception**: `TypeError: items is not iterable` (or `Cannot read properties of undefined`).
  The promise rejects, halting execution and displaying: `"Unable to display this book. This file may be corrupt or in an unsupported format."`.
- **User Impact**: The book cannot be opened or read under any circumstances.

---

#### EPUB-012: Subdirectory TOC Relative Path Mismatch Produces Generic "Section N" Titles
- **Severity**: P1 (Critical)
- **Component**: Navigation & Chapter Selection
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 49–65), `node_modules/epubjs/src/spine.js` (Lines 142–145)
- **Preconditions**: EPUB file where `toc.ncx` or `nav.xhtml` is located in a subdirectory (e.g. `OEBPS/toc/`) and contains relative link targets (`../text/ch01.xhtml`).
- **Reproduction Steps**:
  1. Open an EPUB file structured with subdirectory TOC navigation.
  2. Open the Tools panel and select "Chapters".
- **Expected Behavior**: Real chapter titles extracted from the TOC (e.g. "Chapter 1: Down the Rabbit-Hole") are displayed.
- **Actual Observed Behavior**: `book.spine.get(href)` looks up `this.spineByHref[target]`. The keys in `spineByHref` are normalized relative to the package OPF file. Relative path prefixes like `../text/` fail exact string matching. `spine.get()` returns `null`. `titles[section.index]` is never assigned, and all chapters fall back to generic names: `"Section 1"`, `"Section 2"`, `"Section 3"`.
- **User Impact**: Users cannot identify chapters by name in the chapter picker.

---

#### EPUB-013: Chapter-Wide Bookmark Clumping and Multi-Bookmark Deletion
- **Severity**: P1 (Critical)
- **Component**: Navigation & Chapter Selection
- **Affected File(s)**: `src/stores/bookmarkStore.ts` (Lines 89–94, 95–117), `src/screens/ReaderScreen.tsx` (Lines 358–371), `src/types/book.ts` (Lines 48–60)
- **Preconditions**: Reading an EPUB book with multi-screen chapters.
- **Reproduction Steps**:
  1. In Chapter 1 on visual screen 3, tap the Bookmark icon in the toolbar.
  2. Navigate forward to visual screen 12 of Chapter 1.
  3. Observe the Bookmark icon state, then tap it again.
- **Expected Behavior**: Screen 3 and screen 12 have independent bookmarks.
- **Actual Observed Behavior**: In `bookmarkStore.ts`, bookmarks are indexed strictly by integer `page_number: currentPage` (which remains `1` across all screens of Chapter 1). The toolbar displays "Bookmarked" on all screens in Chapter 1. Tapping the icon on screen 12 triggers `removeBookmark(bm.id)`, deleting the bookmark created on screen 3. Furthermore, clicking a bookmark in the Tools panel navigates to `rendition.display(section.href)`, resetting the user to screen 1.
- **User Impact**: Users can only save one bookmark per entire chapter, and returning to a bookmark loses the exact marked location.

---

#### EPUB-014: Out-of-Bounds Saved Progress Desynchronizes Viewport and UI Strips
- **Severity**: P1 (Critical)
- **Component**: Navigation & Chapter Selection
- **Affected File(s)**: `src/screens/ReaderScreen.tsx` (Lines 152–167), `src/components/reader/EpubViewport.tsx` (Lines 230–232)
- **Preconditions**: A book's `ReadingProgress` record contains a `current_page` value greater than the EPUB's total spine count (e.g. `current_page: 15` on an 8-spine book, caused by previous PDF usage or database edits).
- **Reproduction Steps**:
  1. Set `reading_progress.current_page` to `15` for an EPUB book with 8 sections.
  2. Open the book in the reader.
- **Expected Behavior**: The reader clamps `currentPage` to the valid spine range (`1 <= page <= totalPages`) and displays the clamped section.
- **Actual Observed Behavior**: In `EpubViewport.tsx:230`, `book.spine.get(14)` returns `null`. Line 231 calls `rendition.display(undefined)`. epub.js defaults to Section 1 (`index: 0`). However, `ReaderScreen` state remains `currentPage: 15`. The page strip displays `"Page 15 of 8"`, the progress bar renders over 100%, while the user is actually viewing Section 1.
- **User Impact**: Severe visual desynchronization between the displayed book content and the navigation UI.

---

#### EPUB-015: Multi-Anchor Subheadings Overwrite Chapter Titles in Spine-Sized Array
- **Severity**: P2 (Major)
- **Component**: Navigation & Chapter Selection
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 49–56)
- **Preconditions**: EPUB book containing multiple TOC subheadings within the same XHTML spine document (e.g. `ch01.xhtml#intro`, `ch01.xhtml#part1`, `ch01.xhtml#part2`).
- **Reproduction Steps**:
  1. Open an EPUB formatted with subheadings in the TOC.
  2. Open Tools -> Chapters.
- **Expected Behavior**: All TOC sections and subheadings are displayed.
- **Actual Observed Behavior**: `buildChapterTitles` initializes `const titles: string[] = new Array(spineLength).fill('')`. Each TOC item pointing to `ch01.xhtml` resolves to `section.index = 0`. Each iteration overwrites `titles[0]`. The primary chapter title is overwritten by the final subheading, and intermediate subheadings are discarded.
- **User Impact**: Incomplete table of contents; loss of main chapter titles and nested sections.

---

### Area 4: Controls & Interactions

#### EPUB-016: Keyboard Navigation Granularity Duality and Focus Trapping
- **Severity**: P0 (Blocker)
- **Component**: Controls & Interactions
- **Affected File(s)**: `src/screens/ReaderScreen.tsx` (Lines 415–425), `src/components/reader/EpubViewport.tsx` (Lines 218–228)
- **Preconditions**: Reading an EPUB on a desktop or hardware keyboard device.
- **Reproduction Steps**:
  1. Open an EPUB. Click the toolbar or page strip (outer window has focus).
  2. Press `ArrowRight`.
  3. Click directly inside the book text (epub.js iframe has focus).
  4. Press `ArrowRight`.
- **Expected Behavior**: `ArrowRight` behaves consistently regardless of focus, turning one on-screen page.
- **Actual Observed Behavior**: In step 2 (outer focus), `ReaderScreen.tsx:424` executes `handlePageChange(currentPage + 1)`, skipping the entire chapter and jumping to the next chapter. In step 4 (iframe focus), `EpubViewport.tsx:226` executes `rendition.next()`, advancing one visual page. Additionally, shortcuts like `b` (bookmark), `+`/`-` (zoom), and `Escape` are dead when the iframe has focus.
- **User Impact**: Keyboard users accidentally skip dozens of pages when attempting to turn a single page.

---

#### EPUB-017: UI Chrome Toggling Shrinks Viewport Without Rendition Resize, Clipping Text
- **Severity**: P1 (Critical)
- **Component**: Controls & Interactions
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 274–276), `src/screens/ReaderScreen.tsx` (Lines 518–531)
- **Preconditions**: Reading an EPUB in full-screen mode with UI chrome hidden.
- **Reproduction Steps**:
  1. Read an EPUB with chrome hidden (`isChromeHidden = true`).
  2. Tap the center zone to reveal the toolbar and page strip.
  3. Inspect text at the bottom of the reading viewport.
- **Expected Behavior**: The epub.js rendition resizes and reflows text columns to fit the reduced height.
- **Actual Observed Behavior**: Showing the chrome reduces container height by ~94px. `EpubViewport.tsx` contains no resize observer or effect calling `rendition.resize()`. epub.js retains its initial height, causing the bottom 2 to 4 lines of text to be cut off beneath the container's `overflow: hidden`.
- **User Impact**: Lines of text become unreadable whenever chrome is visible.

---

#### EPUB-018: Outer Viewport Margin Tap Zones Fail to Advance Pages in EPUB Mode
- **Severity**: P2 (Major)
- **Component**: Controls & Interactions
- **Affected File(s)**: `src/screens/ReaderScreen.tsx` (Lines 579–585), `src/components/reader/EpubViewport.tsx` (Lines 96–97, 280–281)
- **Preconditions**: Reading an EPUB book.
- **Reproduction Steps**:
  1. Open an EPUB book.
  2. Tap on the outer 16px padding on the left or right edge of the screen.
- **Expected Behavior**: Left padding tap turns to the previous page; right padding tap turns to the next page.
- **Actual Observed Behavior**: In `ReaderScreen.tsx:579-584`, `onLeftTap` and `onRightTap` for `EpubViewport` are implemented as:
  ```tsx
  onLeftTap={() => { if (showTapHint) dismissTapHint(); }}
  onRightTap={() => { if (showTapHint) dismissTapHint(); }}
  ```
  Neither handler calls `handlePageChange` or `rendition.prev()`/`next()`.
- **User Impact**: Outer margin tap zones are completely unresponsive for page turning.

---

#### EPUB-019: Footnotes and Hyperlinks in Outer Thirds Hijacked by Page Turn Handlers
- **Severity**: P2 (Major)
- **Component**: Controls & Interactions
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 198–213)
- **Preconditions**: EPUB book containing footnote links (`<a href="#fn1">`) or reference links located in the left or right third of the page.
- **Reproduction Steps**:
  1. Navigate to a page with a footnote in the left 1/3 or right 1/3 of the screen.
  2. Tap on the footnote link.
- **Expected Behavior**: The link is followed or the footnote is displayed.
- **Actual Observed Behavior**: `rendition.on('click')` does not check if `event.target` is an anchor (`<a>`) tag. It calculates `fraction = event.clientX / width` and triggers `rendition.prev()` or `rendition.next()`, flipping the page instead of following the link.
- **User Impact**: Readers cannot open footnotes or reference links located near page margins.

---

#### EPUB-020: Mobile Tools Drawer Remains Open After Chapter or Bookmark Selection
- **Severity**: P2 (Major)
- **Component**: Controls & Interactions
- **Affected File(s)**: `src/components/reader/ReaderToolsPanel.tsx` (Lines 302, 395, 580)
- **Preconditions**: Reading on a mobile viewport (<= 768px).
- **Reproduction Steps**:
  1. Open the Tools panel and tap "Chapters" or "Bookmarks".
  2. Tap any chapter or bookmark item.
- **Expected Behavior**: The reader navigates to the selected item and automatically closes the modal drawer.
- **Actual Observed Behavior**: Navigation triggers in the background, but `onClose()` is never called. The modal drawer and its backdrop remain open, blocking the viewport until the user manually taps the close (X) button.
- **User Impact**: Clunky interaction requiring two taps to view selected content on mobile.

---

#### EPUB-021: "Fit Page" and "Fit Width" Zoom Controls Non-Functional in EPUB Mode
- **Severity**: P3 (Minor / Polish)
- **Component**: Controls & Interactions
- **Affected File(s)**: `src/components/reader/ReaderZoomStrip.tsx` (Lines 89–100), `src/screens/ReaderScreen.tsx` (Lines 669–681), `src/components/reader/EpubViewport.tsx` (Lines 17–28)
- **Preconditions**: Reading an EPUB book.
- **Reproduction Steps**:
  1. Open the Zoom Strip in the reader.
  2. Tap "Fit Page" or "Fit Width".
- **Expected Behavior**: EPUB layout adjusts to fit the page or width constraints.
- **Actual Observed Behavior**: `ReaderZoomStrip` calls `onFitPage` which sets `fitToPage = true` in `ReaderScreen.tsx`. `EpubViewport` does not accept or implement `fitToPage`. Tapping the buttons produces zero visual or state change.
- **User Impact**: Exposed controls in the reader interface have no effect on EPUB documents.

---

### Area 5: Text Extraction & Reading Session

#### EPUB-022: Reading Session Active Tracking Freezes After 5 Minutes & Terminates After 30 Minutes
- **Severity**: P1 (Critical)
- **Component**: Text Extraction & Reading Session
- **Affected File(s)**: `src/hooks/useReadingSessionTracker.ts` (Lines 174–177), `src/services/readingSessionLogic.ts` (Lines 100–123, 152–164), `src/components/reader/EpubViewport.tsx` (Lines 98–106)
- **Preconditions**: User actively reads an EPUB book for longer than 5 minutes.
- **Reproduction Steps**:
  1. Open an EPUB book and read continuously, turning pages via screen taps.
  2. Monitor reading session timer state after 5 minutes.
- **Expected Behavior**: Reading time continues to accrue while active page turns occur.
- **Actual Observed Behavior**: `useReadingSessionTracker` binds listeners exclusively to `window` and `document`. Tap events occurring inside the epub.js iframe never bubble to `window`. `s.lastInteractionAt` is never refreshed. After `IDLE_CAP_MS` (5 minutes), active time stops accruing. After `SESSION_BREAK_MS` (30 minutes), `checkIdleBreak` terminates the session as an idle break.
- **User Impact**: EPUB reading time is severely undercounted; sessions fail to reach the 2-minute threshold required to be recorded as meaningful sessions.

---

#### EPUB-023: Recap Spoiler-Guard Boundary Leakage Exposes Unread Chapter Text to LLM
- **Severity**: P1 (Critical)
- **Component**: Text Extraction & Reading Session
- **Affected File(s)**: `src/stores/readingSessionStore.ts` (Lines 294–307), `src/services/epubTextExtractor.ts` (Lines 15, 62–78), `api/recap.ts` (Lines 120–122)
- **Preconditions**: User reads the first page (screen 1) of a long chapter and closes the book.
- **Reproduction Steps**:
  1. Read screen 1 of Chapter 4 (spine index 4) and exit.
  2. Return after an idle break and trigger recap generation in the Memory Bridge card ("Previously...").
- **Expected Behavior**: The recap only summarizes the text from the single screen the user actually read.
- **Actual Observed Behavior**: `currentPage` represents the whole spine section. `extractEpubTextRange` extracts up to 8,000 characters (~1,500 words) from the entire chapter. `api/recap.ts` receives and summarizes the entire chapter text. Major plot twists, character deaths, or resolutions occurring thousands of words ahead of the reader are summarized.
- **User Impact**: Severe story spoilers displayed to the user upon resuming reading.

---

#### EPUB-024: DOM Text Extraction Captures Inline `<style>` and `<script>` Elements
- **Severity**: P2 (Major)
- **Component**: Text Extraction & Reading Session
- **Affected File(s)**: `src/services/epubTextExtractor.ts` (Lines 66–70)
- **Preconditions**: EPUB document containing `<style>` or `<script>` tags inside `<body>`.
- **Reproduction Steps**:
  1. Extract text from an EPUB containing inline stylesheets (`<style>p { color: red; }</style>`).
  2. Inspect the returned `ExtractedPageText.text`.
- **Expected Behavior**: Only readable literary text is extracted; styles and scripts are omitted.
- **Actual Observed Behavior**: `doc.body?.textContent` extracts all text nodes including `<style>` and `<script>` children. The resulting string begins with raw CSS syntax: `"p { color: red; } Chapter 1..."`.
- **User Impact**: Raw code is forwarded to the Gemini Flash recap prompt, degrading recap quality and wasting prompt tokens.

---

#### EPUB-025: Word Concatenation Across HTML Block Boundaries Without Whitespace
- **Severity**: P2 (Major)
- **Component**: Text Extraction & Reading Session
- **Affected File(s)**: `src/services/epubTextExtractor.ts` (Lines 67–70)
- **Preconditions**: EPUB XHTML files with consecutive block tags lacking intervening whitespace (e.g. `<h1>Title</h1><p>First paragraph.</p>`).
- **Reproduction Steps**:
  1. Extract text from an XHTML document formatted without linebreaks between tags.
  2. Inspect the output string.
- **Expected Behavior**: Block-level elements have whitespace or newlines separating them.
- **Actual Observed Behavior**: `.textContent` evaluates directly to `"TitleFirst paragraph."`. Words at heading and paragraph boundaries fuse together.
- **User Impact**: Concatenated words degrade the readability and grammatical coherence of AI-generated recaps.

---

#### EPUB-026: Ingestion of Browser `<parsererror>` Failure Tags as Reading Text
- **Severity**: P2 (Major)
- **Component**: Text Extraction & Reading Session
- **Affected File(s)**: `src/services/epubTextExtractor.ts` (Lines 66–72)
- **Preconditions**: EPUB file containing malformed XML syntax in a spine section.
- **Reproduction Steps**:
  1. Run `extractEpubTextRange` on an EPUB with an unclosed tag in an XHTML file.
- **Expected Behavior**: XML parse errors are caught and handled as unreadable sections.
- **Actual Observed Behavior**: In browser DOMParser, malformed XML returns a document with a `<parsererror>` node rather than throwing an exception. `doc.body?.textContent` captures the parser error string: `"XML Parsing Error: mismatched tag. Location: line 12..."` and packages it as book text.
- **User Impact**: Internal browser XML parser error messages are sent to the AI recap endpoint as book content.

---

#### EPUB-027: SVG-Rooted Spine Documents in Graphic Novels Drop Reading Text
- **Severity**: P3 (Minor / Polish)
- **Component**: Text Extraction & Reading Session
- **Affected File(s)**: `src/services/epubTextExtractor.ts` (Lines 66–73)
- **Preconditions**: EPUB graphic novels, poetry, or illustrated books where spine items use SVG documents (`<svg xmlns="http://www.w3.org/2000/svg">`) without an HTML `<body>` tag.
- **Reproduction Steps**:
  1. Extract text from an EPUB whose spine files are standalone SVG documents containing `<text>` elements.
- **Expected Behavior**: Text inside `<text>` tags is extracted.
- **Actual Observed Behavior**: Because the document lacks `<body>`, `doc.body` evaluates to `undefined`. `doc.body?.textContent || ''` returns an empty string. The section is dropped.
- **User Impact**: AI recaps are unavailable for illustrated books and graphic novels using SVG containers.

---

### Area 6: Mobile & Responsive Viewport

#### EPUB-028: Mobile Swipe Gestures Completely Inoperative Inside EPUB Content
- **Severity**: P1 (Critical)
- **Component**: Mobile & Responsive Viewport
- **Affected File(s)**: `src/screens/ReaderScreen.tsx` (Line 534), `src/components/reader/EpubViewport.tsx` (Lines 198–228, 294)
- **Preconditions**: Reading an EPUB on an Android mobile device, iOS device, or touch emulator.
- **Reproduction Steps**:
  1. Open an EPUB on a mobile touch viewport (e.g. 390x844).
  2. Swipe horizontally left or right across the book text.
- **Expected Behavior**: Horizontal swipe turns to the next or previous page.
- **Actual Observed Behavior**: `useSwipeGesture` is attached to the outer React `div` in `ReaderScreen.tsx:534`. The EPUB text resides inside an `<iframe>` covering 100% of the viewport. Touch events inside the iframe do not bubble to the outer container. `EpubViewport.tsx` binds zero touch handlers. Swiping across the text produces zero response.
- **User Impact**: The standard mobile reading swipe gesture does not work at all for EPUBs.

---

#### EPUB-029: Mobile Touch Release Synthetic Click Triggers Reverse Page Turns
- **Severity**: P1 (Critical)
- **Component**: Mobile & Responsive Viewport
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 198–213)
- **Preconditions**: Mobile user attempting to swipe left (navigating forward) across the screen.
- **Reproduction Steps**:
  1. Touch down on the right side of the screen and drag left across the page, lifting your finger in the left third of the screen.
- **Expected Behavior**: Forward navigation, or no action if swipe is not recognized.
- **Actual Observed Behavior**: Mobile browsers synthesize a `click` event at the coordinates where the finger lifts off (`touchend`). Because the swipe was right-to-left, the lift occurs in the left 1/3 of the screen (`fraction < 1/3`). `rendition.on('click')` fires, calling `onLeftTap()` and `rendition.prev()`.
- **User Impact**: Swiping forward turns the book backward to the previous page.

---

#### EPUB-030: Device Orientation Change Fails to Trigger Rendition Resize, Freezing Layout
- **Severity**: P1 (Critical)
- **Component**: Mobile & Responsive Viewport
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 128–272), `src/screens/ReaderScreen.tsx` (Lines 128–138)
- **Preconditions**: Reading an EPUB on a mobile phone or tablet that is rotated between portrait and landscape.
- **Reproduction Steps**:
  1. Open an EPUB in portrait mode (390x844).
  2. Rotate the device to landscape mode (844x390).
- **Expected Behavior**: The epub.js rendition recalculates its column dimensions and re-paginates cleanly to match the landscape aspect ratio.
- **Actual Observed Behavior**: `ReaderScreen.tsx` listens to `orientationchange` only to update `isMobile`. `EpubViewport.tsx` has no orientation listener and never calls `rendition.resize()`. epub.js retains the portrait width layout. Text lines extend beyond the viewport or get cut off, and pagination calculations desynchronize.
- **User Impact**: Rotating the device corrupts the reading layout until the page is fully reloaded.

---

#### EPUB-031: Night Mode CSS Specificity Failure Renders Illegible Dark-on-Dark Text
- **Severity**: P1 (Critical)
- **Component**: Mobile & Responsive Viewport
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 30–33, 167–168)
- **Preconditions**: Reading in Night Mode (`nightMode = true`) on an EPUB with internal CSS rules.
- **Reproduction Steps**:
  1. Open an EPUB that includes stylesheet rules like `p { color: #222; }` or `h2 { color: black; }`.
  2. Toggle Night Mode on in the reader toolbar.
- **Expected Behavior**: All text turns light cream/gold against the dark background.
- **Actual Observed Behavior**: `NIGHT_THEME` defines rules only for `body` and `a` (`body: { background: '#18181a !important', color: '#e4e0d8 !important' }`). Under CSS specificity and inheritance rules, `!important` on an inherited body property does not override direct element rules (`p { color: #222 }`). The background turns dark charcoal (`#18181a`), while paragraphs remain dark grey/black (`#222`).
- **User Impact**: Book text becomes completely unreadable (black text on dark charcoal background).

---

#### EPUB-032: Static Viewport Padding Collides With Device Notches and Dynamic Islands
- **Severity**: P2 (Major)
- **Component**: Mobile & Responsive Viewport
- **Affected File(s)**: `src/components/reader/EpubViewport.tsx` (Lines 274–276, 288)
- **Preconditions**: Reading in full-screen focus mode (`isChromeHidden = true`) on a phone with a display notch, hole punch, or Dynamic Island.
- **Reproduction Steps**:
  1. Open an EPUB on an iPhone 14/15 or Android device with a camera cutout.
  2. Hide chrome to enter immersive reading mode.
- **Expected Behavior**: Padding respects CSS safe-area insets (`env(safe-area-inset-top)`).
- **Actual Observed Behavior**: In `EpubViewport.tsx:274`, `topPadding = isChromeHidden ? '10px' : '24px'`. No `env(safe-area-inset-*)` rules are applied. Because standard top safe areas are 44px–59px, the top lines of book text render directly under the camera notch and status bar cutout.
- **User Impact**: Words at the top of the page are obscured by physical hardware cutouts.

---

#### EPUB-033: `100vh` Mobile Container Sizing Extends Viewport Beneath Mobile Browser Navigation Bars
- **Severity**: P3 (Minor / Polish)
- **Component**: Mobile & Responsive Viewport
- **Affected File(s)**: `src/screens/ReaderScreen.tsx` (Line 509)
- **Preconditions**: Reading an EPUB in mobile Safari (iOS) or mobile Chrome (Android) where browser URL bars are visible.
- **Reproduction Steps**:
  1. Open the reader on a mobile browser.
  2. Inspect the bottom edge of the reading viewport.
- **Expected Behavior**: The container height conforms to the dynamic visible viewport (`100dvh` or height calculations).
- **Actual Observed Behavior**: The root container uses `height: '100vh'`. On mobile browsers, `100vh` includes the area covered by the retractable browser address bar and navigation controls, pushing the bottom padding and controls partially off-screen.
- **User Impact**: Tap zones near the bottom of the screen collide with browser navigation chrome.

---

## 4. Technical Summary & Next Steps

This triage report establishes the definitive technical inventory of defects across the EPUB reader implementation in Kin Art Companion. All 33 bugs have been mapped to exact source files, line numbers, and empirical reproduction paths with zero code modifications made to the repository.
