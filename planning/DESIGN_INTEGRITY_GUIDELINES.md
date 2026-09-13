# Design Integrity Guidelines

## Purpose

This document defines how every new screen, component, and interaction must relate to the existing design system defined in `DESIGN_SYSTEM.md`, `ANTIGRAVITY_UI_SPEC.md`, and `ARTWORK_ASSET_MAP.md`. Its purpose is to prevent a common failure mode: a future coding agent implementing functional features that work correctly but violate the artistic identity.

---

## The Golden Rule

> Every new pixel must look like it was designed by someone who had the 20-drawing collection open on their desk.

If a new component could appear in any SaaS dashboard, it has failed. If a new screen feels like a different app, it has failed. If a color appears that doesn't exist in `index.css`, it has failed.

---

## Color Discipline

### Approved Color Sources

Every color used in the application MUST come from the CSS custom properties defined in `src/index.css`. No hex codes, no `rgb()` values, no `hsl()` values should appear inline except as references to these tokens.

### Accent Color Budget (Per Screen)

| Color | Max Elements Per Screen | Reserved For |
|---|---|---|
| `--color-accent` (magenta `#D6337A`) | 1-2 elements | Primary CTA, active/selected state, match indicator |
| `--color-secondary` (rust `#B4531F`) | 2-3 elements | Secondary actions, tags, warm accents |
| `--color-accent-teal` (`#2E8B72`) | 1-2 elements | Success states, strong-match indicators |
| `--color-error` (`#B23A2E`) | Only when needed | Error states, destructive actions |
| `--color-warning` (`#C99A2E`) | Only when needed | Warnings |

### Forbidden Colors

- Pure black (`#000000`) — use `--color-text-primary` (`#231710`)
- Pure white (`#FFFFFF`) as a standalone surface — use `--color-surface` (`#FBF7EE`)
- Any blue — does not exist in the artist's palette
- Any pastel — the artist works in saturated or earthy tones, never pastels
- Any gradient not explicitly specified — especially "AI product" purple-to-blue mesh gradients

### The Dark Surface Rule

`--color-dark-surface` (`#2E1533`) is used **only** on:
1. The processing/loading screen
2. A full-bleed artwork lightbox (if implemented)

It must NEVER be used as a general dark mode background, sidebar color, or card variant.

---

## Typography Discipline

### Font Usage

| Context | Font | Weight | Size Range |
|---|---|---|---|
| App name, H1, H2 | Fraunces (serif) | 400-700 | 1.6rem - 3.2rem |
| H3 and below, body, UI | Inter (sans-serif) | 300-700 | 0.78rem - 1.1rem |
| Labels, metadata, small text | Inter | 500-600 | 0.78rem - 0.88rem |

### Forbidden Typography

- Script/handwritten fonts — the artwork supplies the hand-made feeling
- Geometric/grotesque display faces (Poppins, Montserrat, Bebas) — read as generic tech startup
- All-caps body text — labels and eyebrows only
- Font sizes below 14px for any interactive element

---

## The Double-Outline Signature

This is the app's single most distinctive interaction pattern. It MUST be used consistently:

### Where to Apply

- Button hover and focus states
- Card hover and focus states
- Input focus states
- Interactive element hover states

### How It Works

A second outline appears in `--color-accent`, offset 2-3px down-and-right from the element's normal border, transitioning in over ~150ms. This is implemented as `box-shadow` in the existing CSS class `.double-outline-btn` and `.double-outline-card`.

### Where NOT to Apply

- Static, non-interactive elements
- Text
- Images
- Section dividers

---

## Image Treatment Standards

### Artwork Display Rules

1. **Never crop artwork** unless the design document explicitly says to
2. **Always use the artwork mat** — cream background (`#FAF5EC`), rounded corners, 1px warm border
3. **Generous padding** — artwork should never touch the mat edges
4. **Never overlay text** on artwork images (no gradient overlays, no text on top)
5. **Original aspect ratio** — never stretch or distort

### Artwork Asset Usage

Only the assets specified in `ARTWORK_ASSET_MAP.md` Section 6 may be placed directly in the UI:

| Asset | Approved Use | Never Use For |
|---|---|---|
| ART-01 | Empty states (no results, nothing saved) | Background, hero, icon |
| ART-03 | Landing/Home hero | Empty states, thumbnails |
| ART-04 | About section, large editorial | Thumbnails, icons |
| ART-05 | App icon/favicon (eye crop) | Large display |
| ART-06 | Splash/hero alternative | Thumbnails |
| ART-07 | Processing screen background | Regular pages |
| ART-08 | Processing screen alternative / About section | Regular pages |
| ART-09 | Error/failure states | Success states, regular pages |
| ART-11 | Small inline loading spinner | Large display |
| ART-12 | Processing animation (concentric discs) | Static display |
| ART-19 | About section (large) | Icons, thumbnails |
| ART-20 | About section (large), subtle texture (4-8% opacity) | Full-strength display as background |

---

## Spacing Philosophy

### Minimum Spacing Rules

| Between | Minimum Gap |
|---|---|
| Artwork and container edge | 12px padding |
| Grid cards | 24px gap |
| Section title and content | 16px |
| Page top and first content | 36px |
| Content and page bottom | 96px (nav clearance) |
| Inline elements (buttons, badges) | 8-10px |

### Anti-Density Rule

If more than 60% of a screen's viewport is filled with non-whitespace content, the layout is too dense. The artwork collection lives in generous negative space — the app should too.

---

## Card Design Standards

All cards must follow:

```css
background-color: var(--color-surface);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);    /* 12-16px */
box-shadow: var(--shadow-subtle);   /* warm-tinted, not gray */
```

### Forbidden Card Styles

- Heavy drop shadows (>4px blur, any opacity above 0.15)
- Gradient backgrounds on cards
- Pure white cards on cream backgrounds (use `--color-surface`)
- Cards without any border
- Cards with colored borders (except on hover/active with accent)

---

## Motion Standards

### Approved Easing

```css
/* Standard UI transitions */
transition: all 150ms ease-in-out;

/* Slightly bouncy (button press, card hover) */
transition: transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);

/* Page transitions */
animation: fadeIn 200ms ease-out;
```

### Forbidden Motion

- Linear timing (`transition: linear`)
- 3D transforms, parallax effects
- Flashy slide-in animations
- Shimmer/skeleton loaders (use the artist's motifs instead)
- Any animation longer than 500ms for UI feedback (processing screen exempted)

### `prefers-reduced-motion`

All animations must degrade to a static or simple fade when `prefers-reduced-motion: reduce` is set.

---

## New Screen Checklist

Before a new screen is considered complete, verify:

- [ ] Background uses `--color-background` (cream) for standard pages
- [ ] All text colors come from `--color-text-*` tokens
- [ ] All borders use `--color-border` or `--color-border-subtle`
- [ ] No more than 2 magenta-accented elements on the screen
- [ ] Page has generous top and bottom padding
- [ ] Any artwork displayed uses the `ArtworkMat` component
- [ ] Empty state uses ART-01 (or ART-09 for errors)
- [ ] All interactive elements have the double-outline hover/focus effect
- [ ] Typography uses only Fraunces (display) and Inter (body/UI)
- [ ] No pure black or pure white backgrounds
- [ ] No generic gradients
- [ ] Loading states use the artist's motifs (spiral, concentric discs)
- [ ] `prefers-reduced-motion` is respected
- [ ] All focus states are visible (keyboard navigation)
- [ ] The screen looks like it belongs in the same app as HomeScreen and AboutScreen

---

## Testing the Design

### Visual Regression Questions

For any new or modified screen, ask:

1. "Does this screen use any color not in the design tokens?" → If yes, fix.
2. "Could this screen appear in a generic dashboard app?" → If yes, it needs more personality.
3. "Is the artwork breathing or crammed?" → If crammed, add padding.
4. "Are there more than 2 accent-colored elements?" → If yes, reduce.
5. "Does the hover state use the double-outline?" → If not, add it.
6. "Does this feel warm and papery, or cold and corporate?" → If cold, adjust.
