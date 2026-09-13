# Visual Reference — The Artist's Visual Language

This document is the permanent source-of-truth summary of the uploaded artwork collection (20 drawings). Every other document (`DESIGN_SYSTEM.md`, `ARTWORK_ASSET_MAP.md`, `ANTIGRAVITY_UI_SPEC.md`) refers back to the codes defined here.

## Artwork Index (ART-01 → ART-20)

| Code | Filename | Subject |
|---|---|---|
| ART-01 | WhatsApp_Image_2026-09-12_at_12_50_48_PM.jpeg | Crane/heron hybrid in a top hat, holding a cane — sepia ink + rust/orange marker, notebook paper |
| ART-02 | WhatsApp_Image_2026-09-12_at_12_50_47_PM__3_.jpeg | Bird figure on a wheeled cart, squiggling tail — blue/magenta felt-tip |
| ART-03 | WhatsApp_Image_2026-09-12_at_12_50_47_PM__2_.jpeg | Winged creature in flight, pink/orange, with a detached spiked "eye orb" beside it |
| ART-04 | WhatsApp_Image_2026-09-12_at_12_50_47_PM__1_.jpeg | Lemur-headed figure in a Victorian gown, holding a teacup — fine pen cross-hatch, monochrome |
| ART-05 | WhatsApp_Image_2026-09-12_at_12_50_47_PM.jpeg | Digital sketch of a stooped bird-like creature built around a large eye/orb, cream background |
| ART-06 | WhatsApp_Image_2026-09-12_at_12_50_46_PM__2_.jpeg | Symmetrical ceremonial mask/face, saturated digital color, jagged flame border |
| ART-07 | WhatsApp_Image_2026-09-12_at_12_50_46_PM__1_.jpeg | Insect/camera-lens robotic figure on three legs, white line on maroon |
| ART-08 | WhatsApp_Image_2026-09-12_at_12_50_46_PM.jpeg | Anatomical study of a torso/arms, white line + red muscle striation on aubergine |
| ART-09 | WhatsApp_Image_2026-09-12_at_12_50_45_PM__2_.jpeg | Mushroom-topped blob creature, soft digital airbrush color |
| ART-10 | WhatsApp_Image_2026-09-12_at_12_50_45_PM__1_.jpeg | Shaggy green feather/grass-cloaked figure, painterly watercolor-style |
| ART-11 | WhatsApp_Image_2026-09-12_at_12_50_44_PM__2_.jpeg | Segmented caterpillar/centipede chain coiling into a spiral, marker |
| ART-12 | WhatsApp_Image_2026-09-12_at_12_50_44_PM__1_.jpeg | Slender figure standing on stacked concentric disc "portals," pen |
| ART-13 | WhatsApp_Image_2026-09-12_at_12_50_44_PM.jpeg | Crested, big-eared creature, purple/orange marker |
| ART-14 | WhatsApp_Image_2026-09-12_at_12_50_43_PM__2_.jpeg | Elongated stick-limbed winged figure near a blade shape, marker |
| ART-15 | WhatsApp_Image_2026-09-12_at_12_50_43_PM__1_.jpeg | Sketch page ("4/6") of multiple insect-fairy hybrids with wings/antennae |
| ART-16 | WhatsApp_Image_2026-09-12_at_12_50_43_PM.jpeg | Two elephant/insect hybrid creatures facing each other, teal/orange |
| ART-17 | WhatsApp_Image_2026-09-12_at_12_50_42_PM__1_.jpeg | Sketch page ("4/5") of mechanical gear-boxes and butterflies, "Love bugs" note |
| ART-18 | WhatsApp_Image_2026-09-12_at_12_50_42_PM.jpeg | Mechanical pod with visible gears, a figure reaching for a flower |
| ART-19 | WhatsApp_Image_2026-09-12_at_12_50_41_PM__1_.jpeg | Beaked/masked figure with a large afro, swirling smoke-like linework, sepia |
| ART-20 | WhatsApp_Image_2026-09-12_at_12_50_41_PM.jpeg | Bird entirely built from dense layered feathers, monochrome ink wash |

**Note on the collection's structure:** these are not one uniform style but roughly **four working modes** by the same hand:
1. **Sketchbook mode** (ART-01, 02, 11–19) — biro/marker on ruled notebook paper, exploratory, multiple studies per page.
2. **Fine ink illustration mode** (ART-04, 20) — deliberate cross-hatch pen work, monochrome, finished.
3. **Digital painterly mode** (ART-03, 05, 06, 09, 10) — flat/gradient backgrounds, saturated color fills, more resolved.
4. **Inverted chalk-on-color mode** (ART-07, 08) — white/cream linework on a single saturated dark background (maroon, aubergine).

The design system treats these four modes as **one designer's range**, not four different artists — the throughline (see below) is what the product should inherit.

---

## 1. Color

- **Dominant hues across the whole set:** burnt orange / rust / sepia-brown (sketchbook mode) and purple / magenta / teal-green (marker + digital mode). These two families recur more than any others.
- **Secondary:** deep maroon, aubergine/plum, mustard-gold.
- **Accent:** hot pink/magenta and a leaf/teal green, always used as a small highlight (a stripe, an eye, a vein) rather than a fill.
- **Backgrounds:** never pure white and never pure black. Ruled notebook cream/off-white (ART-01, 02, 11–19), flat cream (ART-05), flat mid-gray (ART-09, 10, 16), or one saturated dark hue used as a full-bleed field (ART-06 gray-brown, ART-07 maroon, ART-08 aubergine).
- **Warm/cool:** the sketchbook and ink pieces are warm (sepia/rust); the marker and digital pieces skew cool-adjacent-to-warm (purple/magenta/teal against orange). The collection as a whole is **warm-dominant with cool accents**, not evenly split.
- **Saturation:** bimodal. Either desaturated/earthy (ART-01, 04, 19, 20) or highly saturated jewel tones (ART-02, 06, 11, 13–18). Mid-saturation, "safe SaaS pastel" color is almost entirely absent from the collection — this is a meaningful signal.
- **Contrast:** consistently high. Dark line/fill against light ground, or light line against a saturated dark ground. Low-contrast, washed-out combinations do not appear anywhere.
- **Consistency:** color palette varies by piece, but the *behavior* of color is consistent — color is applied as accents, hatching, and highlight strokes over a linework skeleton, never as flat single-hue fills that erase the drawing.

## 2. Linework

- Hand-drawn throughout; no piece uses a perfectly clean vector line.
- Line weight varies within a single drawing — thin contour lines combined with thick, confident marker strokes (especially visible in ART-01, 13, 14, 16).
- **Double/offset outlining** is a distinctive habit: the same silhouette is often drawn twice in two different colors slightly out of register (ART-02, 11, 13, 14, 16), producing a warm "print misregistration" or chromatic-aberration effect. This is one of the most distinctive, reusable signatures in the whole set.
- Cross-hatching is used deliberately for shading and volume in the more finished pieces (ART-04, 20) — tight, parallel, hand-varied.
- Dense, repeated short strokes are used to build texture: feathers (ART-01, 20), fur/fringe (ART-10), muscle striation (ART-08).
- Swirl/spiral linework recurs as a motif for smoke, hair, or energy (ART-07, 19, and the spiral body of ART-11).
- Lines are continuous but imperfect — visible overshoot, doubling, and correction strokes are left in, not erased. This is a working sketchbook aesthetic, not a cleaned-up one.

## 3. Shapes and Forms

- Recurring **long, thin, tapering forms**: beaks, legs, limbs, tails, antennae. Almost every creature has at least one dramatically elongated element.
- Recurring **large, detailed eye** as a focal point — often rendered with more care/detail than anything else in the piece (ART-01, 03, 05, 06). In two pieces the eye is pulled out and drawn again as its own separate object (ART-03, ART-05) — visually, the eye behaves like an icon in its own right.
- Silhouettes are consistently **hybrid**: bird + human + insect + mammal + mechanical parts combined in a single figure. Nothing in the set is a "straight" realistic animal or person.
- Rounded body volumes paired with sharp/spiked extremities (claws, spikes, crests) — soft core, sharp edges.
- Asymmetry is the default; the one clearly symmetrical piece (ART-06, the mask) reads as a deliberate exception — a ritual/iconic object rather than a creature-in-motion.
- Distortion is used expressively (elongation, exaggerated eyes, bent posture) rather than for horror or grotesquerie.

## 4. Composition

- The overwhelming majority are **single-subject studies on a plain or ruled ground** — no environment, no background scene. The subject *is* the composition.
- Negative space is generous around the figure even on busy sketchbook pages; figures are not crammed edge-to-edge.
- Several images are **visible sketchbook pages** (ruled lines, page-number badges like "4/6," "4/5," margin handwriting) — this "working process" framing is itself part of the visual identity, not an accident to crop out.
- Cropping is used deliberately in the more finished pieces — ART-08 and ART-20 both crop the figure at the frame edge, favoring a fragment/close-up over a full figure.
- No strict grid or golden-ratio framing is evident — compositions are intuitive and centered-but-loose.

## 5. Texture

- Two material textures dominate: **ruled notebook paper** (the most literal recurring texture in the set) and **ink/marker bleed** (soft edges where marker color overruns the pen line).
- The digital pieces trade paper texture for soft airbrush gradients but keep the same hand-drawn line underneath.
- No piece uses hard-edged flat vector color; every fill has some hand-inconsistency (uneven pressure, visible strokes, gradient banding).
- Overall material feeling: **an artist's working notebook**, not a printed or digital-native surface.

## 6. Recurring Motifs (candidates for UI translation)

| Motif | Where it appears | UI potential |
|---|---|---|
| Large detailed eye/orb | ART-01, 03, 05, 06 | Logo mark, loading spinner, "search/discover" icon |
| Concentric discs / portal stack | ART-12 | Loading/transition animation, "opening a result" motif |
| Double-outline chromatic offset | ART-02, 11, 13, 14, 16 | Hover/active state treatment, focus rings |
| Dense feather/fringe strokes | ART-01, 10, 20 | Section divider texture, card top treatment, background texture (very sparingly) |
| Ruled notebook paper | ART-01, 02, 11–19 | Upload canvas background, "sketchbook" empty state |
| Swirl/smoke line | ART-07, 19 | Loading animation, transition curl |
| Long tapering beak/limb line | ART-01, 20 | Custom divider rule, underline accent |
| Spiral segmented body | ART-11 | Circular progress / loader |

## 7. Overall Visual Character

In precise terms rather than vibes: this is **observational-hybrid creature illustration**, executed with a **sketchbook-first, ink-and-marker working method**, that alternates between **raw exploratory studies** and **resolved finished pieces**, unified by: a warm-earth-plus-jewel-tone color habit, confident but imperfect hand linework, hybrid anatomical invention, an eye as a recurring focal device, and comfort with visible "process" (ruled paper, page numbers, margin notes) as part of the aesthetic rather than something to hide.

It is **not**: minimalist, geometric, corporate-illustration, flat-vector, pastel, cute-mascot, or photorealistic. Any interface direction that pushes toward those registers would misrepresent the source material.
