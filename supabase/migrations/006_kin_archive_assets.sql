-- ============================================================
-- Migration 006: Kin Archive Assets (Built-in 20 Studio Works)
-- ============================================================

CREATE TABLE IF NOT EXISTS kin_archive_assets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  medium TEXT NOT NULL,
  description TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  role TEXT,
  display_order INTEGER NOT NULL,
  rights_status TEXT NOT NULL DEFAULT 'first-party',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (Read-only for users)
ALTER TABLE kin_archive_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view kin archive assets"
  ON kin_archive_assets FOR SELECT
  USING (true);

-- Seed all 20 canonical first-party artworks
INSERT INTO kin_archive_assets (id, code, title, filename, medium, description, alt_text, tags, role, display_order, rights_status)
VALUES
  (
    'art-01', 'ART-01', 'Crane in Top Hat with Cane', '/artist-reference/art-01.jpeg',
    'Sepia ink & rust marker on ruled notebook paper',
    'A stilt-legged marsh bird sporting an undersized top hat, steadying itself on a bamboo walking cane.',
    'Ink drawing of a crane wearing a top hat and holding a cane on lined paper',
    ARRAY['crane', 'top hat', 'ink', 'avian', 'whimsical', 'sepia'],
    'Empty States & Whimsical Character', 1, 'first-party'
  ),
  (
    'art-02', 'ART-02', 'Bird on Wheeled Cart', '/artist-reference/art-02.jpeg',
    'Blue & magenta felt-tip marker on ruled paper',
    'A geometric avian figure mounted upon a rolling wheeled chassis, exhibiting vibrant chromatic contour offset.',
    'Marker drawing of an abstract bird resting on a wheeled platform cart',
    ARRAY['bird', 'cart', 'wheels', 'marker', 'contour', 'geometric'],
    'Double-Outline & Chromatic Offset Reference', 2, 'first-party'
  ),
  (
    'art-03', 'ART-03', 'Winged Creature in Flight with Eye Orb', '/artist-reference/art-03.jpeg',
    'Pink & orange marker with detached spiked orb',
    'A soaring winged entity guided by an autonomous detached eye orb enclosed in a spiked sunburst ring.',
    'Drawing of a flying creature alongside an observant floating eye orb',
    ARRAY['flight', 'wings', 'eye orb', 'surreal', 'warm tones'],
    'Landing Hero Visual & Eye Orb Motif', 3, 'first-party'
  ),
  (
    'art-04', 'ART-04', 'Victorian Lemur in Gown with Teacup', '/artist-reference/art-04.jpeg',
    'Fine pen cross-hatch, monochrome ink wash',
    'An anthropomorphic lemur dressed in high Victorian finery, delicately cradling an ornate porcelain tea service.',
    'Fine cross-hatched ink illustration of a lemur in an aristocratic dress holding a teacup',
    ARRAY['lemur', 'victorian', 'fine pen', 'cross-hatching', 'vintage'],
    'Fine Ink Editorial Craft — Studio / About', 4, 'first-party'
  ),
  (
    'art-05', 'ART-05', 'Digital Eye / Orb Creature', '/artist-reference/art-05.jpeg',
    'Digital sketch on warm cream ground',
    'A luminous floating iris surrounded by soft textural rays, establishing the central vision and perception motif.',
    'Digital concept sketch of a glowing eye iris emitting radiant halos',
    ARRAY['eye', 'iris', 'digital', 'warm ground', 'focus'],
    'App Mark, Favicon & Lens Metaphor', 5, 'first-party'
  ),
  (
    'art-06', 'ART-06', 'Symmetrical Ceremonial Mask', '/artist-reference/art-06.jpeg',
    'Saturated digital color with jagged flame border',
    'A striking symmetrical ceremonial facade bordered by jagged flame geometries and deep indigo shadows.',
    'Symmetrical ritual mask rendered with saturated jewel-tone pigments',
    ARRAY['mask', 'ceremonial', 'symmetry', 'flame', 'vibrant'],
    'Ritual Symmetry & High Contrast Accent', 6, 'first-party'
  ),
  (
    'art-07', 'ART-07', 'Chalk Insect Camera Robot', '/artist-reference/art-07.jpeg',
    'White line drawing on deep maroon field',
    'An arthropod mechanical apparatus with camera lens oculars etched in chalky line against dark maroon ground.',
    'White mechanical insect creature with optical sensors against a dark maroon background',
    ARRAY['insect', 'robot', 'camera', 'chalk', 'maroon'],
    'Processing Screen Dark Surface Atmosphere', 7, 'first-party'
  ),
  (
    'art-08', 'ART-08', 'Anatomical Torso & Reaching Arms', '/artist-reference/art-08.jpeg',
    'White linework & crimson muscle striations on aubergine',
    'A classical anatomical study showing striated musculature and reaching upper limbs against deep aubergine.',
    'Anatomical figure with highlighted muscular structure against deep purple aubergine',
    ARRAY['anatomy', 'torso', 'musculature', 'striation', 'classical'],
    'Processing Screen Atmosphere & Studio Study', 8, 'first-party'
  ),
  (
    'art-09', 'ART-09', 'Mushroom Blob Creature', '/artist-reference/art-09.jpeg',
    'Digital soft airbrush tones on neutral ground',
    'A gentle bulbous woodland entity with a fungal cap, resting placidly in muted neutral atmosphere.',
    'Soft illustrated friendly mushroom creature resting in quiet contemplation',
    ARRAY['mushroom', 'fungal', 'gentle', 'blob', 'neutral'],
    'Error / 404 Gentle Mascot', 9, 'first-party'
  ),
  (
    'art-10', 'ART-10', 'Grass-Cloaked Shaggy Wanderer', '/artist-reference/art-10.jpeg',
    'Watercolor-style green fringe over pencil',
    'A lone cloaked traveler enveloped in dense cascading fringe and verdant pasture flora.',
    'Wandering cloaked figure draped in green moss and grassy fringe over pencil underdrawing',
    ARRAY['wanderer', 'grass', 'cloak', 'green', 'pastoral'],
    'Fringe Texture & Green Accent Reference', 10, 'first-party'
  ),
  (
    'art-11', 'ART-11', 'Spiral Segmented Caterpillar', '/artist-reference/art-11.jpeg',
    'Coiling marker chain on notebook paper',
    'A coiled segmented larva looping in rhythmic undulating spirals across ruled paper lines.',
    'Whimsical spiral-coiled segmented caterpillar drawn in marker rings',
    ARRAY['caterpillar', 'spiral', 'undulating', 'marker', 'rhythmic'],
    'Inline Spinner & Circular Progress Motif', 11, 'first-party'
  ),
  (
    'art-12', 'ART-12', 'Figure on Concentric Disc Portals', '/artist-reference/art-12.jpeg',
    'Pen linework with concentric circular rings',
    'A meditative figure poised in balance over interlocking concentric disc orbits and ringed portals.',
    'Human silhouette standing centered above multiple concentric circular ground rings',
    ARRAY['concentric', 'portal', 'rings', 'meditative', 'balance'],
    'Processing Concentric Animation Motif', 12, 'first-party'
  ),
  (
    'art-13', 'ART-13', 'Crested Clawed Beast', '/artist-reference/art-13.jpeg',
    'Marker study on ruled notebook paper',
    'A quadruped creature with a serrated crest and sweeping talons, rendered in warm orange and royal purple.',
    'Mythical crested beast with sharp talons sketched with purple and orange markers',
    ARRAY['beast', 'claws', 'crest', 'purple', 'orange', 'mythical'],
    'Purple & Orange Marker Harmony Reference', 13, 'first-party'
  ),
  (
    'art-14', 'ART-14', 'Elongated Stick-Limbed Winged Creature', '/artist-reference/art-14.jpeg',
    'Marker and ballpoint on lined paper',
    'An agile, elongated silhouette with insectoid wings poised mid-stride across ruled paper lines.',
    'Slender elongated winged entity with tapered limbs standing in dynamic posture',
    ARRAY['elongated', 'stick-figure', 'wings', 'stride', 'ballpoint'],
    'Tapering Contour & Dynamic Stance Reference', 14, 'first-party'
  ),
  (
    'art-15', 'ART-15', 'Insect-Fairy Hybrids Page 4/6', '/artist-reference/art-15.jpeg',
    'Multi-subject sketchbook study sheet',
    'A dense sketchbook sheet documenting entomological fairy hybrids with technical field annotations.',
    'Sketchbook study page with multiple insect-winged fairy creatures and handwritten notes',
    ARRAY['sketchbook', 'insects', 'fairies', 'notes', 'entomology'],
    'Working Notebook Layout & Margin Annotations', 15, 'first-party'
  ),
  (
    'art-16', 'ART-16', 'Confronting Elephant-Insect Hybrids', '/artist-reference/art-16.jpeg',
    'Green & rust ink on notebook paper',
    'Two chimerical pachyderm creatures with segmented insect carapaces meeting in profile posture.',
    'Chimeric elephant-insect creatures facing one another in duel stance',
    ARRAY['elephant', 'insect', 'hybrid', 'chimera', 'profile'],
    'Dual-Color Contouring & Beast Silhouette', 16, 'first-party'
  ),
  (
    'art-17', 'ART-17', 'Love Bugs & Clockwork Gears Page 4/5', '/artist-reference/art-17.jpeg',
    'Marker diagrams with handwritten marginalia',
    'Biomechanical beetle concepts interlaced with cogs, wheels, escapements, and marginal study notes.',
    'Diagram of mechanical clockwork insects with gears, springs, and handwritten marginalia',
    ARRAY['clockwork', 'gears', 'beetle', 'diagram', 'biomechanical'],
    'Organic vs Mechanical Convergence Reference', 17, 'first-party'
  ),
  (
    'art-18', 'ART-18', 'Mechanical Pod Reaching for Flower', '/artist-reference/art-18.jpeg',
    'Purple & green ink with mechanical linkages',
    'An articulated mechanical manipulator pod extending gentle pincer claws toward a blooming botanical blossom.',
    'Articulated robotic arm extending toward a delicate flowering plant',
    ARRAY['robotic', 'flower', 'botanical', 'manipulator', 'harmony'],
    'Hand & Flora Interaction Study', 18, 'first-party'
  ),
  (
    'art-19', 'ART-19', 'Masked Figure with Afro & Swirling Smoke', '/artist-reference/art-19.jpeg',
    'Sepia ink & purple marker with curling vapor line',
    'A solemn masked protagonist crowned with an afro, framed by swirling tendrils of incense vapor.',
    'Masked character with stylized afro hair enveloped in curling atmospheric smoke ribbons',
    ARRAY['masked', 'afro', 'smoke', 'vapor', 'incense', 'sepia'],
    'Studio Feature — Swirl Smoke Flourish', 19, 'first-party'
  ),
  (
    'art-20', 'ART-20', 'Bird of Dense Layered Feathers', '/artist-reference/art-20.jpeg',
    'Dense cross-hatch ink wash with elongated bill',
    'A majestic shorebird covered in meticulously feathered cross-hatching, gazing downward with sharp avian focus.',
    'Intricate monochrome ink wash illustration of a bird with dense textured plumage',
    ARRAY['bird', 'feathers', 'cross-hatch', 'plumage', 'monochrome', 'texture'],
    'Studio Feature — Monochrome Texture Grain', 20, 'first-party'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  filename = EXCLUDED.filename,
  medium = EXCLUDED.medium,
  description = EXCLUDED.description,
  alt_text = EXCLUDED.alt_text,
  tags = EXCLUDED.tags,
  role = EXCLUDED.role,
  display_order = EXCLUDED.display_order;
