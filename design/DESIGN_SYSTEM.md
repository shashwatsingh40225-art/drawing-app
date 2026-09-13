# Design System

Derived from the 20-drawing collection catalogued in `VISUAL_REFERENCE.md` (codes ART-01–ART-20 used throughout). This document translates that visual language into a usable product design system for an app whose job is: **upload a drawing → find visually/artistically similar art → explore results.**

The metaphor is intentional and convenient: the app's core action (looking closely, finding likeness) mirrors the artist's own recurring motif of **the eye** as a focal device. Lean on this rather than inventing a separate metaphor.

---

## PHASE 2 — Design Language

### Color Philosophy
The collection is bimodal: earthy/sepia sketchbook tones and saturated jewel-tone marker/digital tones, always high-contrast, never pastel. The product should read as **warm, ink-and-paper neutral by default**, with **jewel-tone accents reserved for moments of discovery** (a match found, a result selected, an active state) — mirroring how the artist uses color in the drawings themselves: mostly linework on a neutral ground, color concentrated where it matters (an eye, a vein, a highlight stroke).

### Surface/Background Philosophy
Never pure white, never pure black — the artwork never uses either. Base surfaces should sit on a warm paper-cream, with a small number of full-bleed saturated-dark surfaces (maroon/aubergine family) reserved for specific, deliberate moments (processing/loading, full-screen artwork view) — this mirrors ART-07/ART-08's use of a single saturated dark field as a distinct "mode" rather than the default.

### Border Philosophy
Borders should behave like pencil/ink contour lines, not CSS defaults: slightly warm-toned, never stark black, 1px hairlines for structure, and an occasional intentional **double-line offset** (see below) for emphasis, echoing the artist's habit of drawing a silhouette twice in two colors slightly out of register.

### Shape Language
Rounded-corner containers (cards, buttons, inputs) with a soft-organic radius (not sharp/geometric, not fully pill-shaped) — reflecting the collection's "soft core, sharp accents" body language. Sharp/angular accents (small triangular or spiked details) can appear only in iconography, never in structural containers.

### Iconography Direction
Custom line icons at consistent stroke weight, hand-touched rather than perfectly uniform (slight organic variation in curve, like the artist's own inconsistent-but-confident line). Where possible, base icon concepts on the artist's own recurring shapes: an eye for "search/similar," a spiral for "loading," concentric discs for "explore more," a feather/tapering line for dividers. Do not use generic Material/Feather-style icon packs unmodified for hero moments — they may be used as-is only for minor utility icons (settings, close, chevrons) where invisibility is the goal.

### Illustration Direction
Use the **actual uploaded drawings** as illustration assets wherever a "big illustration moment" is needed (see `ARTWORK_ASSET_MAP.md`) rather than commissioning new generic illustrations. Where a new small illustration must be created (e.g., a missing empty-state), it must match: hand-drawn line, warm-neutral or jewel-tone limited palette, single-subject-on-plain-ground composition, and hybrid/creature logic — not flat corporate iconographic illustration.

### Typography Direction
See Phase 4 below. In short: an editorial serif for display moments (echoing the deliberate, illustrative quality of the finished pen pieces like ART-04), paired with a clean humanist sans for all UI/body text (the artwork is expressive; the interface text must not compete with it).

### Spacing Philosophy
Generous negative space, matching the collection's habit of isolating a single subject on an open ground. Avoid dense, tightly-packed dashboard layouts. Let artwork breathe — a result thumbnail or hero image should never be tightly cropped by adjacent UI without margin.

### Card Design
Warm off-white surface, soft radius (12–16px), 1px warm-gray hairline border, no heavy drop shadow (the artwork itself has no cast shadows — it's flat-lit line/color work). Elevation should be communicated by a subtle background-tone shift and border, not by dark soft shadows, to stay consistent with the flat-lit nature of the source material.

### Button Design
Primary button: solid deep plum/aubergine fill, cream text, soft radius. Secondary: outline in the same plum, transparent fill. Accent/CTA moments (e.g., "Find Similar Art"): may use the magenta accent as a solid fill — this is the one place a jewel-tone solid fill is earned, since it marks the app's core "discovery" action. Hover state: apply the **double-outline offset** motif — a second, slightly offset outline in the accent color appears behind the button on hover, directly referencing ART-02/11/13/14/16.

### Input Design
Input fields (especially the drawing-upload dropzone) should read like a **blank ruled notebook page** — a subtle ruled-line texture at low opacity on the upload canvas background, referencing ART-01/11–19's literal ruled paper. Text inputs elsewhere stay clean/plain (ruled texture is reserved for the upload surface specifically, so it doesn't become wallpaper).

### Navigation Design
Minimal, text/icon-based, warm-neutral background, no heavy chrome. A single custom mark (derived from the eye motif, see logo direction) anchors the nav — everything else stays quiet so the artwork carries the visual weight.

### Modal Design
Same card language, slightly larger radius, appears over a scrim tinted with the deep-plum primary at low opacity (not neutral black) — a small but consistent way of keeping the palette warm even in overlay states.

### Image Treatment
User-uploaded drawings and result artworks are the visual stars — display them uncropped by default with generous padding, on a neutral card, never overlaid with dark gradients or heavy captions. Where an image needs a caption/scrim (e.g., a hover state on a result grid), use a soft warm-dark gradient (plum, not black) at the base only.

### Shadows/Elevation
Minimal. Use border + subtle surface-tone change as the primary elevation cue (see Card Design). If a shadow is used at all (e.g., modal), keep it warm-tinted (a very dark plum at low opacity), never neutral gray/black — pure gray/black shadows do not exist anywhere in this artist's palette.

### Animation/Motion Philosophy
Motion should feel **hand-drawn and organic, not mechanical/linear** — ease curves should be soft (ease-in-out, slight overshoot), never robotic linear timing. Loading/processing states are a genuine opportunity to use the artist's own motifs (spiral, concentric discs, swirl-smoke) as animated elements rather than a generic spinner — see Phase 6 and the Antigravity spec for specifics. Avoid skeuomorphic "AI shimmer" gradient-sweep loaders; they belong to a different visual language than this artist's.

---

## PHASE 3 — Color System

All values are **estimated from the artwork** by eye (no pixel sampling of source files was performed) and then curated down to a restrained, usable UI set. Marked "derived" where taken fairly directly from a dominant artwork hue, and "constructed" where built to be UI-functional (e.g., tints/shades) while staying in-family.

| Token | Hex | Source | Usage |
|---|---|---|---|
| **Primary** | `#3A2140` | derived — deep plum/aubergine (ART-08, ART-06 mask outline) | Primary buttons, nav, headings on light surfaces |
| **Primary Dark** | `#241329` | constructed shade of primary | Dark-mode / processing-screen background |
| **Secondary** | `#B4531F` | derived — rust/burnt orange (ART-01, ART-19, ART-20) | Secondary actions, tags, warm accents |
| **Accent** | `#D6337A` | derived — magenta/pink (ART-03, ART-05, ART-06) | "Find Similar," match highlights, active/selected state — **use sparingly** |
| **Accent Secondary (Teal)** | `#2E8B72` | derived — teal/green (ART-09, ART-16, ART-10) | Success confirmations, secondary highlight, "match found" tag |
| **Background** | `#F6F0E4` | derived — ruled notebook paper cream (ART-01, 11–19) | App base background |
| **Surface** | `#FBF7EE` | constructed tint of background | Cards, panels |
| **Elevated Surface** | `#FFFFFF` (warm, use with `#3A2140` border, not pure isolation) | constructed | Modals, popovers |
| **Dark Surface (special)** | `#2E1533` | derived — aubergine field (ART-08) | Full-bleed processing/loading screen only |
| **Text Primary** | `#231710` | derived — near-black warm ink (line color across sketches) | Headings, primary body text |
| **Text Secondary** | `#6B5B4D` | constructed warm gray-brown | Secondary body text, metadata |
| **Text Muted** | `#A79883` | constructed | Placeholder text, disabled, timestamps |
| **Text on Dark** | `#F5EFE6` | derived — chalk/cream line color (ART-07, ART-08) | Text on Dark Surface |
| **Border** | `#DED2BC` | constructed warm neutral | Card borders, dividers, input borders |
| **Success** | `#2E8B72` | shared with Accent Secondary | Confirmations |
| **Warning** | `#C99A2E` | derived — mustard/gold (ART-06 crest, ART-04 background wash) | Non-blocking warnings |
| **Error** | `#B23A2E` | derived — rust-red (ART-01 accent stripe, ART-03 red) | Error states |

### Usage discipline
- **Should dominate:** Background cream, Surface, Text Primary, Primary (plum) for structural chrome. These carry ~80% of the UI.
- **Use sparingly, deliberately:** Accent magenta and Secondary rust — reserved for the "discovery" action, active/selected states, and match indicators. If more than ~10–15% of a screen is magenta, it has been overused.
- **Reserved for one context only:** Dark Surface (`#2E1533`) — processing/full-bleed artwork moments only. It should never become an alternate "dark mode" applied uniformly; in this collection, the dark field is a deliberate special mode (ART-07/08), not a default state.
- **Do not use in UI at all:** the very high-saturation multi-color combinations seen within a single sketch (e.g., simultaneous bright purple + bright cyan + bright magenta + bright green as in ART-02, ART-14, ART-17) — these work as raw sketchbook energy but would read as chaotic/unreadable as interface chrome. Keep those combinations confined to artwork thumbnails themselves, not to buttons, backgrounds, or text.

---

## PHASE 4 — Typography

**Direction:** the artwork ranges from raw sketch to deliberate fine-line illustration (ART-04, 20) — the fine-line pieces have real editorial/period quality (Victorian dress, plague-doctor-adjacent beak mask). Typography should borrow that editorial, slightly old-world confidence for display type, while staying fully clean and neutral for anything functional.

- **Display font** (app name, big hero headlines): a **serif with visible ink-like contrast and fine detail** — evokes the pen-and-ink illustration mode without being a novelty/script font. *Candidates:* **Fraunces** (has a "soft/ink" optical variant, warm and slightly irregular), **Canela**-adjacent alternatives, or **Spectral**. Fraunces is recommended as a free, variable, web-ready option.
- **Headings (H1–H3, section titles):** same serif family at lighter weight, or a humanist sans at semi-bold if a quieter hierarchy is wanted — recommend staying serif through H2 for character, dropping to sans at H3 and below.
- **Body / UI text:** a clean humanist sans-serif, high legibility, moderate x-height. *Candidates:* **Inter** or **Work Sans**. Inter is recommended for its neutrality and excellent screen rendering — it should not compete with the artwork.
- **UI labels / metadata / small text:** same sans family, medium weight, slightly increased letter-spacing for small caps-style labels (e.g., "97% MATCH").
- **Explicitly avoid:** handwritten/script fonts as body or UI text (the artist's own linework already supplies the "hand-made" feeling — doubling it in the type would compete, not complement), and geometric/grotesque display faces that would read as generic tech-startup.
- **Optional accent use (mark as assumption):** a single hand-lettered or brush-style wordmark treatment could work for the literal app *logotype* only, echoing the confident marker line — this is a nice-to-have, not required, and should be tested against legibility at small sizes before committing.

---

## PHASE 6 — Screen-by-Screen Visual Direction

### 1. Landing / Home
- **Layout:** Centered hero, generous whitespace, single strong illustration moment right of or behind the headline (not a busy multi-image collage).
- **Background:** Background cream (`#F6F0E4`), no gradient.
- **Artwork placement:** One large, uncropped selected drawing (ART-03 or ART-06 — see asset map) as the hero visual, given room to breathe; do not tile or repeat artwork here.
- **Typography:** Serif display headline (large, e.g., "Every drawing has kin."), sans sub-headline.
- **Colors:** Plum primary for the CTA button, rust/orange used sparingly in a supporting graphic element (e.g., a single tapering line divider).
- **Cards:** None needed at this level — this screen is hero-led, not card-led.
- **Buttons:** One primary CTA ("Upload a drawing"), plum fill, soft radius.
- **Decorative elements:** A subtle ruled-paper texture strip behind the hero art at very low opacity, referencing ART-01/11–19.
- **Interaction emphasis:** The single CTA should be the only high-contrast/accent-colored element on the page.

### 2. Upload Drawing
- **Layout:** Centered dropzone as the clear single focus.
- **Background:** Background cream.
- **Artwork placement:** The dropzone itself is rendered as a **ruled notebook page** (low-opacity horizontal rule lines, cream fill, warm dashed border) — this directly embodies ART-01/11–19's literal paper texture as a functional surface, not decoration.
- **Typography:** Sans, medium weight instruction text ("Drop a drawing, or browse").
- **Colors:** Border in Border token; on drag-hover, border shifts to Accent magenta with the double-outline hover treatment.
- **Cards:** N/A (the dropzone is the card).
- **Buttons:** Secondary/outline "Browse files" button inside the zone.
- **Decorative elements:** None beyond the paper texture — keep this screen calm and functional; it's a utility moment.

### 3. Image Processing / Loading
- **Layout:** Full-bleed, minimal, centered animation.
- **Background:** **Dark Surface** (`#2E1533`) — the one deliberate use of the special dark field, directly citing ART-07/ART-08's white-line-on-saturated-dark mode.
- **Artwork placement:** An animated motif built from the artist's own shapes: concentric discs (ART-12) rotating/pulsing, or a spiral (ART-11) turning, rendered in the cream/chalk linework color on the dark field.
- **Typography:** Text on Dark, sans, short status copy ("Reading your lines…", "Looking for kin…").
- **Colors:** Cream linework color only, plus a single magenta pulse accent on the active element.
- **Decorative elements:** Faint swirl/smoke linework (ART-07, ART-19 motif) drifting slowly — subtle, not busy.
- **Interaction emphasis:** No interaction expected; this is a held, calm moment. Avoid frantic motion.

### 4. Similar Artistic Expressions / Results
- **Layout:** Responsive grid of result cards, generous gutters (not a dense masonry wall).
- **Background:** Background cream.
- **Artwork placement:** Each result artwork uncropped/centered within its card at consistent padding; the user's original upload pinned at the top as a small reference thumbnail ("Matches for:").
- **Typography:** Sans for match metadata, small serif accent for a section title ("Kindred works").
- **Colors:** Match-strength indicator uses the Accent Secondary teal-to-magenta scale sparingly (e.g., a small pill: "94% match" in teal for strong matches, muted gray-brown for weaker ones) — do not color-code the whole card.
- **Cards:** Standard card language (Surface fill, soft radius, hairline border); on hover, apply the double-outline offset treatment in Accent color plus a slight lift (tone shift, not heavy shadow).
- **Buttons:** Minimal — cards are primarily click-through; a small "save" icon-button in the corner.
- **Decorative elements:** None inside the grid itself — let the artworks be the decoration.

### 5. Individual Artwork / Result Detail
- **Layout:** Two-column on desktop (large artwork left/top, metadata + similarity explanation right/below), single column stacked on mobile.
- **Background:** Surface, with the artwork itself given a neutral cream mat/border like a print in a sketchbook.
- **Artwork placement:** Large, uncropped, centered, generous mat padding.
- **Typography:** Serif for the artwork title/creator name, sans for description and metadata.
- **Colors:** "Why it's similar" section can use small colored tags (line-quality, color-palette, subject, composition) drawn from the Accent/Secondary palette as chips.
- **Cards:** Metadata panel as a single Surface card beside/below the artwork.
- **Buttons:** Secondary actions (save, share, view source) as outline buttons; source link clearly attributed.
- **Decorative elements:** A thin tapering-line divider (referencing ART-01/20's beak/feather line) between artwork and metadata sections.

### 6. Saved / Favorites
- **Layout:** Same grid language as Results, filtered to saved items.
- **Background:** Background cream.
- **Artwork placement:** Same card treatment as Results for consistency.
- **Typography/Colors:** Identical system to Results — this screen should not introduce new visual language, only reuse.
- **Empty state:** If empty, use a whimsical selected drawing (e.g., ART-01, the top-hatted crane) with a short sans caption ("Nothing saved yet — go find some kin.") — see Asset Map.

### 7. About / Artist Section
- **Layout:** Long-form single column, editorial reading width.
- **Background:** Surface.
- **Artwork placement:** This is the natural home for the more "finished" pieces (ART-04, ART-19, ART-20) shown larger, with real breathing room, as illustrative punctuation between paragraphs — not thumbnails.
- **Typography:** Serif for body copy here specifically (this is the one screen where an editorial/literary serif body treatment fits, since it's about the artist/process) or serif headers with sans body for consistency with the rest of the app — pick one and apply consistently; sans body is the safer, more consistent default across the app.
- **Colors:** Muted, mostly Text Primary/Secondary on Surface; minimal color intervention — let the artwork carry the color here.
- **Decorative elements:** Page-rule texture or a margin note treatment referencing the handwritten annotations visible in the original sketch pages (ART-15, ART-17) — a nice subtle nod, used once, not throughout.

---

## PHASE 7 — Design Rules

### DO
- Use the actual uploaded drawings as real UI assets, at real size, uncropped where possible.
- Preserve generous negative space around every artwork and around primary CTAs.
- Pull every UI color from the extracted palette in Phase 3 — do not introduce new hues ad hoc.
- Keep the double-outline offset hover/focus treatment consistent everywhere it's used — it's a signature, not a one-off effect.
- Reserve the saturated Dark Surface for the processing/full-bleed moments described above.
- Keep body/UI typography clean and highly legible even while display type carries character.
- Let match/similarity metadata be quiet (small chips, muted color) so it never competes with the artwork it describes.

### DON'T
- Don't use generic gradients (especially the "AI product" purple-to-blue mesh gradient) anywhere — nothing in the source material resembles this.
- Don't introduce generic stock/SaaS illustration style for empty states, onboarding, or error states — use the artist's own drawings or match their hand-drawn logic instead.
- Don't apply heavy drop shadows or skeuomorphic depth — the source material is flat-lit.
- Don't turn every drawing into a tiny icon; several pieces (ART-04, 20) only work at real size and lose all their character shrunk down.
- Don't use more than one or two accent-magenta elements per screen — it's a highlight color, not a base color.
- Don't apply the ruled-paper texture everywhere; it belongs specifically to upload/creation surfaces, not the whole app chrome.
- Don't sacrifice text legibility for character — headings can have personality, but body copy, form labels, and metadata must stay in the clean sans family at accessible contrast.
- Don't mix all the jewel-tone marker colors from a single raw sketch (e.g., ART-02 or ART-17) directly into UI chrome — those combinations work as one artist's raw color energy on paper, not as coordinated interface color.
