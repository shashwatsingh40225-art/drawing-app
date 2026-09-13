# Antigravity Implementation Spec

**Purpose:** Build the UI for an app where a user uploads a drawing and the app finds visually/artistically similar art online. This spec is self-contained — implement directly from it. Background context lives in `DESIGN_SYSTEM.md`, `ARTWORK_ASSET_MAP.md`, and `VISUAL_REFERENCE.md` if more detail is needed, but everything required to build is below.

**Visual identity in one sentence:** A warm, ink-and-paper sketchbook aesthetic — hand-drawn line quality, earthy sepia/rust neutrals with jewel-tone (plum/magenta/teal) accents used sparingly, real artwork from the source collection used as actual UI assets, not just color inspiration.

---

## 1. Color Tokens (implement as CSS variables / design tokens)

```
--color-primary:        #3A2140   /* deep plum — buttons, nav, headings */
--color-primary-dark:   #241329   /* dark surface shade */
--color-secondary:      #B4531F   /* rust/burnt orange — secondary accents */
--color-accent:         #D6337A   /* magenta — CTA + match/active states, sparing use only */
--color-accent-teal:    #2E8B72   /* teal — success, strong-match indicator */
--color-background:     #F6F0E4   /* app base background, warm cream */
--color-surface:        #FBF7EE   /* cards, panels */
--color-surface-elevated: #FFFFFF /* modals/popovers */
--color-dark-surface:   #2E1533   /* processing screen ONLY, full-bleed */
--color-text-primary:   #231710
--color-text-secondary: #6B5B4D
--color-text-muted:     #A79883
--color-text-on-dark:   #F5EFE6
--color-border:         #DED2BC
--color-success:        #2E8B72
--color-warning:        #C99A2E
--color-error:          #B23A2E
```

**Rules:**
- `--color-background`, `--color-surface`, `--color-text-primary/secondary`, and `--color-primary` should account for ~80% of visual weight on any screen.
- `--color-accent` (magenta) is reserved for: the primary "Find Similar Art" CTA, active/selected states, hover double-outline effect, and match-strength indicators. Do not use it as a large background fill or on more than one or two elements per screen.
- `--color-dark-surface` is used **only** on the Processing/Loading screen (and optionally a full-bleed artwork lightbox view). Do not implement it as a general dark-mode background.
- Never introduce a gradient that isn't explicitly specified below. No purple-to-blue "AI" mesh gradients anywhere.

## 2. Typography

- **Display/Headings font:** `Fraunces` (Google Fonts, variable font, use "soft"/opsz-low optical settings if available) — used for the app name, H1, and H2.
- **Body/UI font:** `Inter` — used for all body copy, buttons, labels, form fields, metadata, H3 and below.
- Load both via standard web font loading (Google Fonts or self-hosted); no other font families should appear.
- Minimum body text size 16px equivalent; maintain WCAG AA contrast at minimum for all text/background pairs (validate `--color-text-secondary` and `--color-text-muted` against `--color-background` and `--color-surface` specifically — adjust luminance if they fail AA at small sizes).
- Do not use script/handwritten fonts for any functional text.

## 3. Shape, Border, Elevation

- Corner radius: 12–16px on cards/buttons/inputs/modals (soft-organic, not sharp, not full-pill).
- Borders: 1px solid `--color-border` as the default structural cue.
- Elevation: prefer border + subtle surface-tone shift over drop shadows. If a shadow is used (modals only), it must be a warm-tinted dark (derived from `--color-primary-dark` at low opacity, e.g. `rgba(36,19,41,0.18)`), never neutral gray/black.
- **Signature hover/focus effect ("double outline"):** on hover/focus of buttons and result cards, render a second outline in `--color-accent`, offset 2–3px down-and-right from the element's normal border, visible behind/around it, transitioning in over ~150ms. This references a recurring visual habit in the source artwork (two offset outlines in different colors) and should be used consistently as the app's signature interaction cue — implement once as a reusable style/class, apply everywhere hover/focus emphasis is needed.

## 4. Iconography & Illustration

- Use a plain, consistent-stroke icon set (e.g., a Feather/Lucide-style line icon set) for **utility icons only** (close, chevron, settings, save/bookmark, share).
- For hero/brand moments, use the actual artwork assets specified in Section 6 below — do not commission or generate generic illustrations for hero/empty/loading states.
- App icon / favicon: derive from **ART-05** (tight crop of the central eye/orb from `WhatsApp_Image_2026-09-12_at_12_50_47_PM.jpeg`), isolated on transparent background, simplified only as much as needed for legibility at 16–32px.

## 5. Motion Principles

- Easing: use soft ease-in-out or slight-overshoot curves (e.g., cubic-bezier(0.34, 1.2, 0.64, 1) for small UI feedback) — avoid purely linear timing.
- Loading/processing states should use the specific animated motifs described in Section 7 (concentric discs, spiral) rather than a generic spinner or shimmer-gradient skeleton loader.
- Page/section transitions: soft fade + slight upward motion (200–300ms), no hard cuts, no flashy 3D/parallax effects.
- Respect `prefers-reduced-motion`: provide a static-fade fallback for all animated motifs.

## 6. Artwork Assets — Where They Go

All source files are provided as `ART-01` … `ART-20` (see `ARTWORK_ASSET_MAP.md` for the full filename table). Implement the following placements. For each, an isolated/background-removed PNG or SVG version should be prepared (the surrounding paper/gray/dark background stripped) unless noted otherwise.

| Screen | Asset | Treatment |
|---|---|---|
| App icon / favicon | ART-05 (eye crop) | Isolated, simplified, functional |
| Landing/Home hero | ART-03 (winged pink creature) | Large, uncropped, isolated, right of or behind headline |
| Landing/Home (optional alt hero / splash) | ART-06 (symmetric mask) | Large, intact, keep its own flame border |
| Loading/Processing screen | ART-12 (concentric discs, figure removed) as primary animated motif; ART-07 or ART-08 as full-bleed background, restyled to `--color-dark-surface` field with linework kept cream/white | Full-bleed dark screen, animated |
| Upload screen (dropzone) | Ruled-paper texture pattern (derived from the ruled backgrounds visible across ART-01/11–19), NOT a specific character asset | Low-opacity horizontal rule lines as dropzone background |
| Results grid — empty state | ART-01 (top-hatted crane) | Isolated, medium size, centered above empty-state text |
| Favorites — empty state | ART-01 (reuse) | Same as above |
| Error / 404 state | ART-09 (mushroom creature) | Isolated, medium size |
| About/Artist section | ART-04 (Victorian lemur figure), ART-19 (beaked afro figure), ART-20 (feather bird) | Large, intact, generous spacing, monochrome pieces kept monochrome |
| Inline "searching" spinner (small, in-grid) | ART-11 (spiral caterpillar, simplified/cropped) | Small, animatable loop |
| Optional subtle background texture (Landing hero / Processing screen) | ART-20 feather texture, cropped tight | Extremely low opacity (4–8%), never full-strength |

**Do not** place every uploaded drawing in the UI. Only the assets listed above are approved for direct placement; all others are reference-only for line/color/shape language (see `ARTWORK_ASSET_MAP.md`, "Reference-Only" section) and should not appear as standalone UI elements in v1.

## 7. Screen Specifications

### Landing / Home
- Centered/split layout: serif display headline + sans subheadline on one side, ART-03 hero illustration on the other (stack vertically on mobile, illustration below headline).
- One primary CTA button ("Upload a drawing"), `--color-primary` fill, `--color-text-on-dark`-equivalent light text.
- Subtle ruled-paper texture strip behind the hero illustration at ~5–8% opacity.
- No other color accents on this screen besides the CTA and the hero artwork's own native color.

### Upload Drawing
- Centered dropzone card styled as a ruled notebook page (cream fill, horizontal rule lines at low opacity, dashed warm border).
- Drag-hover state: border transitions to `--color-accent`, apply the double-outline hover effect.
- "Browse files" secondary/outline button inside the zone.
- Minimal supporting copy, no decorative illustration beyond the paper texture.

### Processing / Loading
- Full-bleed `--color-dark-surface` background.
- Centered animated motif (concentric discs from ART-12, pulsing/rotating; or spiral from ART-11) rendered in `--color-text-on-dark`, with a single `--color-accent` pulse accent.
- Rotate through 2–3 short status strings ("Reading your lines…", "Looking for kin…", "Almost there…") in sans font, `--color-text-on-dark`.
- Optional faint drifting swirl-line background layer at very low opacity for atmosphere.

### Results Grid
- Responsive card grid (e.g., 2 columns mobile, 3–4 desktop), generous gutters (24px+).
- User's original upload shown as a small pinned reference thumbnail at the top ("Matches for: [thumbnail]").
- Each card: artwork image (uncropped, centered, padded), title/creator line, small match-strength pill (`--color-accent-teal` background for strong matches, `--color-text-muted` for weaker).
- Card hover: double-outline effect + slight surface-tone lift, no heavy shadow.
- Empty state: ART-01 illustration + message, centered.

### Individual Artwork / Result Detail
- Two-column desktop (artwork left ~60%, metadata right ~40%), single column stacked on mobile.
- Artwork shown large, uncropped, on a neutral mat/card.
- Metadata panel: title, creator/source (with outbound link, clearly attributed), a short "why it's similar" explanation, and 2–4 small tag chips (e.g., "line quality," "color palette," "subject") in `--color-secondary`/`--color-accent-teal` outline style.
- Thin tapering-line divider graphic between image and metadata (simple SVG line asset, derived from the beak/feather line quality — a single custom line asset can be built for reuse here, not a photo crop).
- Secondary actions (save, share, view source) as outline buttons.

### Saved / Favorites
- Identical grid/card system to Results — do not introduce new visual language here.
- Empty state: reuse ART-01 with adjusted copy.

### About / Artist Section
- Long-form single column, editorial reading width (~680px max).
- Body text in `Inter` (sans) for consistency with the rest of the app, even though this section is the "most editorial" — headings may use `Fraunces`.
- ART-04, ART-19, ART-20 shown large (500px+) as punctuation between paragraphs, generous margin above/below each.

## 8. Responsive Behavior

- Mobile-first: hero illustrations stack below headline text; two-column detail views collapse to single column; grid reduces from 3–4 columns to 2 (then 1 on very small screens).
- Touch targets minimum 44×44px for all interactive elements.
- Ruled-paper and texture elements should scale/tile appropriately without becoming visually heavy on small screens — reduce opacity further on mobile if needed (test at implementation time).

## 9. Accessibility Requirements

- Maintain WCAG AA contrast for all text against its background token; verify `--color-text-secondary` and `--color-text-muted` specifically, as warm mid-tones can fail contrast checks — adjust darkness if needed while staying in the warm-brown family.
- All decorative artwork must have empty/appropriate `alt=""` (decorative) vs. descriptive `alt` text (functional/content images — e.g., actual result artworks need real alt text describing the artwork).
- Respect `prefers-reduced-motion` — provide static equivalents for the Processing screen animation and hover double-outline transition.
- Ensure focus states (keyboard navigation) use the same double-outline treatment as hover, not just a default browser outline, but never remove focus indication entirely.
- Match-strength indicators (color-coded pills) must not rely on color alone — include the percentage/label text alongside the color.

## 10. Explicitly Avoid

- Generic purple/blue "AI product" gradients or gradient text.
- Flat corporate/SaaS illustration packs (rounded mascots, generic isometric people) for any empty/onboarding/error state — use the specified artwork assets instead.
- Heavy neumorphism or skeuomorphic drop shadows.
- Pure black or pure white as a primary surface color.
- Shimmer-gradient skeleton loaders — use the specified illustrative loading motifs instead.
- Overuse of the magenta accent color as a background fill or on more than 1–2 elements per screen.
- Using more than the approved asset list from Section 6 directly in the interface — additional source drawings are reference-only.
- A uniform "dark mode" built by simply inverting the light palette — the dark surface in this system is a deliberate special state (Processing/lightbox), not a toggleable theme, unless a future phase explicitly designs one from the same source material.
