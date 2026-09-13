# Artwork Asset Map

This maps specific drawings from the collection (codes defined in `VISUAL_REFERENCE.md`) to concrete uses inside the application. **Not every drawing is used** — the raw exploratory sketchbook pages with multiple overlapping creatures (ART-13, 14, 15, 16, 17, 18) are excellent *pattern/reference* material (see `DESIGN_SYSTEM.md`) but are too busy/multi-subject to work as clean standalone UI assets, so they are recommended for pattern-reference use only, not direct placement.

For each selected drawing: identifier, why it's useful, where it goes, how it should be treated, size, and cropping/background notes.

---

### ART-01 — Crane in top hat, with cane
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_48_PM.jpeg`
- **Why useful:** Characterful, whole, warm palette, instantly readable even at medium size; has genuine personality/humor without being twee.
- **UI location:** Empty states — "No results yet" (Results screen) and "Nothing saved yet" (Favorites screen).
- **Treatment:** Decorative. Keep full color and full drawing.
- **Size:** Medium (~240–320px wide), centered above the empty-state message.
- **Crop:** No — the full figure (hat + cane) is the joke; cropping it removes the point.
- **Background removal:** Yes — isolate the figure from the notebook-paper background so it sits cleanly on the app's own cream Background token.
- **Functional or decorative:** Decorative/emotive.

---

### ART-03 — Winged pink creature + detached eye orb
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_47_PM__2_.jpeg`
- **Why useful:** Dynamic, in-motion, vivid color that matches the Accent palette directly; the separate "eye orb" element is a gift — it visually is the app's core metaphor (an eye that finds/sees kinship).
- **UI location:** Landing/Home hero illustration. The main winged figure as the hero image; the separate eye-orb crop repurposed as part of the logo/mark exploration (see ART-06 also, below) or as a loading accent.
- **Treatment:** Decorative hero use, full color, largely intact.
- **Size:** Large (hero-scale, ~400–600px), right-aligned or behind headline text with enough negative space preserved around it.
- **Crop:** The eye-orb (right-hand element) can be cropped out separately as its own small asset.
- **Background removal:** Yes for both uses — isolate on transparent/cream background.
- **Functional or decorative:** Primarily decorative (hero); the eye-orb crop can become functional (icon).

---

### ART-04 — Lemur-headed figure in Victorian dress, ink cross-hatch
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_47_PM__1_.jpeg`
- **Why useful:** The single most technically resolved, editorial piece in the set — signals craft and seriousness. Good for a context where the app wants to feel curated/considered rather than playful.
- **UI location:** About/Artist section, shown large; alternatively as a loading/splash screen image on first app launch (one-time).
- **Treatment:** Intact, full detail, monochrome — do not recolor.
- **Size:** Large (~500px+ tall) — this piece loses all value shrunk down; give it room.
- **Crop:** No, or at most a very gentle crop of empty paper margin — keep the full figure.
- **Background removal:** Optional — the plain background is already clean; light cleanup only.
- **Functional or decorative:** Decorative, high-craft "brand" moment.

---

### ART-05 — Digital eye/orb creature
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_47_PM.jpeg`
- **Why useful:** The eye/orb is rendered almost like a magnifier or lens — extremely on-theme for "finding similar art."
- **UI location:** Tight crop of the central eye/orb as the **app icon / favicon** candidate, and as a **loading spinner** base (the eye can pulse/blink).
- **Treatment:** Functional. Crop tightly to the eye/orb only; simplify slightly if needed for small-size legibility at favicon scale.
- **Size:** Icon-scale (16–512px depending on context) for favicon/app icon; larger (~120px) for an in-app loading motif.
- **Crop:** Yes — isolate just the eye/orb, discard the surrounding creature body.
- **Background removal:** Yes, required.
- **Functional or decorative:** Functional (icon/loader) — this is the strongest logo-mark candidate in the set.

---

### ART-06 — Symmetrical ceremonial mask
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_46_PM__2_.jpeg`
- **Why useful:** Bold, graphic, instantly recognizable, high color contrast — works well as a strong single statement image rather than a subtle background element.
- **UI location:** Splash/launch screen, or a secondary hero option for Landing/Home, or a strong visual for a marketing/share-card image.
- **Treatment:** Decorative, intact, full color and full symmetry preserved (don't crop asymmetrically — the symmetry is the point).
- **Size:** Large (splash-screen scale) or medium (hero alternative, ~350px).
- **Crop:** No.
- **Background removal:** Keep its own jagged flame border and dark field as-is if used full-bleed; if placed on a cream card, remove the outer dark background and keep the mask + flame border only.
- **Functional or decorative:** Decorative, high-impact.

---

### ART-07 — White-line insect/camera robot on maroon
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_46_PM__1_.jpeg`
- **Why useful:** Already exactly the "dark field, chalk linework" mode the Processing screen is built around; the lens/camera-like body is thematically apt for an app that "looks" at your drawing.
- **UI location:** Image Processing/Loading screen, as a static or lightly-animated background element (e.g., the "legs" or "smoke" elements given slow drifting motion).
- **Treatment:** Decorative but load-bearing for mood; keep the original maroon field or restyle to the system's Dark Surface plum for palette consistency (recommend restyling the background hue to `#2E1533` to match the token system, keeping the white/cream linework as-is).
- **Size:** Large, full-bleed or near full-bleed on the loading screen.
- **Crop:** No.
- **Background removal:** Not needed if used full-bleed at native background color; if reused elsewhere, isolate the white linework only.
- **Functional or decorative:** Decorative (sets mood for a functional screen).

---

### ART-08 — Anatomical arm/torso study, white on aubergine
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_46_PM.jpeg`
- **Why useful:** Same dark-chalk mode as ART-07; the reaching-arm gesture reads well as "analyzing/reaching toward" content — a good secondary processing-screen asset for variety, or a strong About-section image (this mode feels serious/studious).
- **UI location:** Alternate Processing-screen background (rotate with ART-07), or About/Artist section as a supporting image.
- **Treatment:** Decorative, intact.
- **Size:** Large, full-bleed on processing screen; medium (~350px) in About section.
- **Crop:** No.
- **Background removal:** Same guidance as ART-07 — keep or restyle field color for palette consistency.
- **Functional or decorative:** Decorative.

---

### ART-09 — Mushroom creature (digital, soft color)
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_45_PM__2_.jpeg`
- **Why useful:** Whimsical, self-contained, gentle color palette (teal/purple/red) that reads as friendly rather than alarming — good for a lighter-touch error/empty moment.
- **UI location:** Error state (e.g., "Something went wrong" / 404) or upload-failure state.
- **Treatment:** Decorative, intact, full color.
- **Size:** Medium (~220–280px).
- **Crop:** No.
- **Background removal:** Yes — isolate from its gray field to sit on the app's cream Background.
- **Functional or decorative:** Decorative/emotive.

---

### ART-11 — Segmented spiral caterpillar
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_44_PM__2_.jpeg`
- **Why useful:** The coiled-spiral form is a natural circular-progress/loading motif; segmented structure could literally animate segment-by-segment as a progress indicator.
- **UI location:** Small inline loading spinner (e.g., "searching…" indicator inside the results grid, distinct from the full-screen Processing animation).
- **Treatment:** Functional. Simplify into a clean animatable line-art version if needed for smooth looping.
- **Size:** Small (~40–80px).
- **Crop:** Yes — use only the tightly coiled portion, discard the looser tail if it complicates the loop.
- **Background removal:** Yes, required.
- **Functional or decorative:** Functional.

---

### ART-12 — Figure on concentric disc "portals"
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_44_PM__1_.jpeg`
- **Why useful:** The stacked concentric discs read exactly like ripples/portals opening — an excellent, on-brand transition motif for "opening a result" or the main Processing-screen animation.
- **UI location:** Processing/Loading screen (primary animated motif, as specified in `DESIGN_SYSTEM.md` Phase 6), and/or the transition animation when a result card expands into the Detail view.
- **Treatment:** Functional. Extract just the disc-stack element (omit the figure) for the animation; the figure itself could separately serve as a small onboarding illustration ("upload your drawing").
- **Size:** Discs: ~150–250px animated element. Figure (if used separately): small, ~150px.
- **Crop:** Yes — separate the disc-stack from the figure for independent reuse.
- **Background removal:** Yes, required.
- **Functional or decorative:** Functional (discs), decorative (figure, optional).

---

### ART-19 — Beaked/masked figure with afro, swirling smoke lines
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_41_PM__1_.jpeg`
- **Why useful:** Striking, atmospheric, strong sepia mode; the swirling line work is reusable as a standalone decorative flourish separate from the figure.
- **UI location:** About/Artist section (large, alongside ART-04/20), and the swirl linework alone as a subtle transition/divider flourish elsewhere.
- **Treatment:** Decorative, intact for the About section; the swirl element can be isolated and reused small.
- **Size:** Large (~450px) in About section; swirl-only crop small (~100–150px) if reused as a flourish.
- **Crop:** No for the main figure; yes if isolating just the swirl.
- **Background removal:** Light cleanup only — background is already plain.
- **Functional or decorative:** Decorative.

---

### ART-20 — Dense-feather bird, monochrome ink
**Filename:** `WhatsApp_Image_2026-09-12_at_12_50_41_PM.jpeg`
- **Why useful:** The most texturally rich, moody piece in the set — excellent for a large, quiet brand moment. The dense feather pattern (cropped tight) also works as a subtle textural background motif at very low opacity.
- **UI location:** (a) Full image: About/Artist section or app-store/marketing imagery. (b) Tight crop of the feather texture only, at very low opacity (~4–8%): optional subtle background texture behind the Landing hero or the app's loading screen.
- **Treatment:** (a) Decorative, intact, monochrome. (b) Functional-decorative texture, heavily desaturated/low-opacity so it never competes with foreground content.
- **Size:** (a) Large (~500px+ tall). (b) Tileable/cropped texture, used as a background layer at low opacity.
- **Crop:** No for (a); yes, tight texture crop for (b).
- **Background removal:** Not needed for (a); for (b), texture extraction only.
- **Functional or decorative:** Both, per use above.

---

## Reference-Only (not placed directly, used to inform patterns)

These sketchbook pages contain multiple overlapping subjects, visible margin handwriting, or numbering badges that make them unsuitable as clean standalone assets, but they are essential references for line quality, the double-outline color habit, and the mechanical/organic hybrid motifs described in the Design System:

- ART-02 (bird on wheeled cart) — reference for the double-outline offset effect and squiggle-line habit.
- ART-13, ART-14 — reference for the purple/orange/red marker family and clawed-limb silhouettes.
- ART-15, ART-16 — reference for insect/hybrid wing shapes (useful if a future icon set needs a "wing" glyph).
- ART-17, ART-18 — reference for the mechanical gear + organic (butterfly/flower) pairing, useful conceptually for a future "how it works" explainer graphic, but the raw sketches themselves are too busy/annotated to use directly.
- ART-10 — reference for painterly green fringe texture; could be revisited for a future seasonal/theme variant but not recommended for the initial build.

## Assets NOT recommended for use
Everything not listed above should be treated as reference-only, per the rule in `DESIGN_SYSTEM.md`: **do not recommend using every drawing.** Overusing the full set would clutter the interface and dilute the impact of the strongest pieces (ART-01, 04, 05, 06, 20 in particular).
