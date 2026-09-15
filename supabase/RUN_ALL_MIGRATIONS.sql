-- ============================================================
-- KIN ART COMPANION — MASTER DATABASE & STORAGE SETUP SCRIPT
-- ============================================================
-- Execute this entire script once in your Supabase Dashboard:
-- Project -> SQL Editor -> New Query -> Paste & Click "Run"
-- ============================================================

-- ------------------------------------------------------------
-- Part 1: Initial Tables (Artworks & Collections)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  medium TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'in-progress', 'study', 'abandoned')),
  notes TEXT DEFAULT '',
  image_path TEXT,
  thumbnail_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
CREATE INDEX IF NOT EXISTS idx_artworks_creation_date ON artworks(user_id, creation_date DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_deleted_at ON artworks(user_id, deleted_at);

ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artworks' AND policyname = 'Users can view own artworks') THEN
    CREATE POLICY "Users can view own artworks" ON artworks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artworks' AND policyname = 'Users can insert own artworks') THEN
    CREATE POLICY "Users can insert own artworks" ON artworks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artworks' AND policyname = 'Users can update own artworks') THEN
    CREATE POLICY "Users can update own artworks" ON artworks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artworks' AND policyname = 'Users can delete own artworks') THEN
    CREATE POLICY "Users can delete own artworks" ON artworks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can view own collections') THEN
    CREATE POLICY "Users can view own collections" ON collections FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can insert own collections') THEN
    CREATE POLICY "Users can insert own collections" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can update own collections') THEN
    CREATE POLICY "Users can update own collections" ON collections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can delete own collections') THEN
    CREATE POLICY "Users can delete own collections" ON collections FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- Migration 001: Artwork-Collection Memberships Junction Table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS artwork_collection_memberships (
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artwork_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_collection_id ON artwork_collection_memberships(collection_id);
CREATE INDEX IF NOT EXISTS idx_memberships_artwork_id ON artwork_collection_memberships(artwork_id);

ALTER TABLE artwork_collection_memberships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artwork_collection_memberships' AND policyname = 'Users can view own artwork collection memberships') THEN
    CREATE POLICY "Users can view own artwork collection memberships"
      ON artwork_collection_memberships FOR SELECT
      USING (EXISTS (SELECT 1 FROM artworks WHERE artworks.id = artwork_collection_memberships.artwork_id AND artworks.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artwork_collection_memberships' AND policyname = 'Users can insert own artwork collection memberships') THEN
    CREATE POLICY "Users can insert own artwork collection memberships"
      ON artwork_collection_memberships FOR INSERT
      WITH CHECK (
        EXISTS (SELECT 1 FROM artworks WHERE artworks.id = artwork_collection_memberships.artwork_id AND artworks.user_id = auth.uid())
        AND EXISTS (SELECT 1 FROM collections WHERE collections.id = artwork_collection_memberships.collection_id AND collections.user_id = auth.uid())
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'artwork_collection_memberships' AND policyname = 'Users can delete own artwork collection memberships') THEN
    CREATE POLICY "Users can delete own artwork collection memberships"
      ON artwork_collection_memberships FOR DELETE
      USING (EXISTS (SELECT 1 FROM artworks WHERE artworks.id = artwork_collection_memberships.artwork_id AND artworks.user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artworks' AND column_name = 'collection_ids') THEN
    INSERT INTO artwork_collection_memberships (artwork_id, collection_id)
    SELECT a.id, unnest(a.collection_ids)
    FROM artworks a
    WHERE a.collection_ids IS NOT NULL AND cardinality(a.collection_ids) > 0
    ON CONFLICT DO NOTHING;

    ALTER TABLE artworks DROP COLUMN collection_ids;
  END IF;
END $$;

-- ------------------------------------------------------------
-- Migration 002: Books Table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  description TEXT DEFAULT '',
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  page_count INTEGER,
  cover_thumbnail_path TEXT,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_upload_date ON books(user_id, upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_books_deleted_at ON books(user_id, deleted_at);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Users can view own books') THEN
    CREATE POLICY "Users can view own books" ON books FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Users can insert own books') THEN
    CREATE POLICY "Users can insert own books" ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Users can update own books') THEN
    CREATE POLICY "Users can update own books" ON books FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Users can delete own books') THEN
    CREATE POLICY "Users can delete own books" ON books FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- Migration 003: Reading Progress Table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  current_page INTEGER NOT NULL DEFAULT 1,
  total_pages INTEGER,
  scroll_position REAL DEFAULT 0,
  zoom_level REAL DEFAULT 1.0,
  reading_mode TEXT DEFAULT 'continuous',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reading_progress_user_book UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON reading_progress(book_id);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reading_progress' AND policyname = 'Users can view own reading progress') THEN
    CREATE POLICY "Users can view own reading progress" ON reading_progress FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reading_progress' AND policyname = 'Users can insert own reading progress') THEN
    CREATE POLICY "Users can insert own reading progress" ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reading_progress' AND policyname = 'Users can update own reading progress') THEN
    CREATE POLICY "Users can update own reading progress" ON reading_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reading_progress' AND policyname = 'Users can delete own reading progress') THEN
    CREATE POLICY "Users can delete own reading progress" ON reading_progress FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- Migration 004: Bookmarks Table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  label TEXT DEFAULT '',
  color TEXT DEFAULT 'accent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_book ON bookmarks(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book_page ON bookmarks(book_id, page_number);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Users can view own bookmarks') THEN
    CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Users can insert own bookmarks') THEN
    CREATE POLICY "Users can insert own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Users can update own bookmarks') THEN
    CREATE POLICY "Users can update own bookmarks" ON bookmarks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks' AND policyname = 'Users can delete own bookmarks') THEN
    CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- Migration 005: Annotations Table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('note', 'archive_ref', 'artwork_ref', 'page_ref')),
  content TEXT DEFAULT '',
  x_percent REAL NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
  y_percent REAL NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),
  width_percent REAL CHECK (width_percent IS NULL OR (width_percent > 0 AND width_percent <= 100)),
  height_percent REAL CHECK (height_percent IS NULL OR (height_percent > 0 AND height_percent <= 100)),
  rotation_degrees REAL DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  ref_archive_asset_id TEXT,
  ref_artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  color TEXT DEFAULT 'accent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annotations_user_book ON annotations(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_annotations_book_page ON annotations(book_id, page_number);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'annotations' AND policyname = 'Users can view own annotations') THEN
    CREATE POLICY "Users can view own annotations" ON annotations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'annotations' AND policyname = 'Users can insert own annotations') THEN
    CREATE POLICY "Users can insert own annotations" ON annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'annotations' AND policyname = 'Users can update own annotations') THEN
    CREATE POLICY "Users can update own annotations" ON annotations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'annotations' AND policyname = 'Users can delete own annotations') THEN
    CREATE POLICY "Users can delete own annotations" ON annotations FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- Migration 006: Kin Archive Assets (20 Studio Works)
-- ------------------------------------------------------------

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

ALTER TABLE kin_archive_assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kin_archive_assets' AND policyname = 'Anyone can view kin archive assets') THEN
    CREATE POLICY "Anyone can view kin archive assets" ON kin_archive_assets FOR SELECT USING (true);
  END IF;
END $$;

INSERT INTO kin_archive_assets (id, code, title, filename, medium, description, alt_text, tags, role, display_order, rights_status)
VALUES
  ('art-01', 'ART-01', 'Crane in Top Hat with Cane', '/artist-reference/art-01.jpeg', 'Sepia ink & rust marker on ruled notebook paper', 'A stilt-legged marsh bird sporting an undersized top hat, steadying itself on a bamboo walking cane.', 'Ink drawing of a crane wearing a top hat and holding a cane on lined paper', ARRAY['crane', 'top hat', 'ink', 'avian', 'whimsical', 'sepia'], 'Empty States & Whimsical Character', 1, 'first-party'),
  ('art-02', 'ART-02', 'Bird on Wheeled Cart', '/artist-reference/art-02.jpeg', 'Blue & magenta felt-tip marker on ruled paper', 'A plump decorative songbird perched upon a childs primitive two-wheel pull-cart.', 'Felt-tip marker drawing of a stylized bird riding a toy wooden wheeled cart', ARRAY['bird', 'cart', 'toy', 'marker', 'vibrant', 'magenta'], 'Hero Header & Exploration Visual', 2, 'first-party'),
  ('art-03', 'ART-03', 'Winged Creature & Eye Orb', '/artist-reference/art-03.jpeg', 'Sepia pen & purple wash on ruled paper', 'A feathered chimera beast hovering protectively above a large, unblinking ocular sphere.', 'Pen and purple wash drawing of a winged beast near an eyeball sphere', ARRAY['winged', 'creature', 'eye', 'orb', 'mythical', 'surreal'], 'Loading State & Mystic Iconography', 3, 'first-party'),
  ('art-04', 'ART-04', 'Robotic Beetle Mechanism', '/artist-reference/art-04.jpeg', 'Fine-point brown ink & teal watercolor wash', 'A brass-carapaced coleopteran insect with exposed gears, clockwork spring joints, and antenna dials.', 'Detailed technical ink sketch of a mechanical steampunk beetle', ARRAY['beetle', 'clockwork', 'steampunk', 'mechanism', 'insect', 'teal'], 'Detail Modal & Technical Specimen', 4, 'first-party'),
  ('art-05', 'ART-05', 'Mushroom House with Spiral Chimney', '/artist-reference/art-05.jpeg', 'Sepia ink line with crimson cap spots', 'A fairytale toadstool cottage nestled in moss with a curling chimney puffing wisps of smoke.', 'Illustration of a whimsical mushroom dwelling with smoke rising from a bent chimney', ARRAY['mushroom', 'cottage', 'whimsical', 'fairytale', 'sepia', 'botanical'], 'About Screen & Studio World-Building', 5, 'first-party'),
  ('art-06', 'ART-06', 'Armored Knight in Profile', '/artist-reference/art-06.jpeg', 'Black ink cross-hatching & graphite wash', 'A stern medieval helmet profile with open visor revealing focused eyes.', 'Profile ink drawing of a medieval knight helmet with textured visor', ARRAY['knight', 'armor', 'helmet', 'medieval', 'cross-hatch', 'graphite'], 'Authentication & Protective Privacy', 6, 'first-party'),
  ('art-07', 'ART-07', 'Cosmic Jellyfish in Void', '/artist-reference/art-07.jpeg', 'White gel pen & violet ink on midnight ground', 'A translucent medusa drifting upward trailing tendrils of stardust.', 'Bioluminescent jellyfish drifting through deep cosmic space', ARRAY['jellyfish', 'cosmic', 'bioluminescence', 'deep sea', 'space', 'gel pen'], 'Night Mode & Fluid Abstraction', 7, 'first-party'),
  ('art-08', 'ART-08', 'Botanical Seedpod Study', '/artist-reference/art-08.jpeg', 'Sepia archival ink & tea-stain wash on paper', 'Cross-section study of an exotic dehiscent capsule revealing ribbed chambers.', 'Technical botanical illustration of a segmented seed capsule and drying leaves', ARRAY['botanical', 'seedpod', 'study', 'specimen', 'tea-stain', 'archival'], 'Reference Library & Anatomy Study', 8, 'first-party'),
  ('art-09', 'ART-09', 'Sleeping Fox in Fern Grove', '/artist-reference/art-09.jpeg', 'Burnt sienna watercolor & black brush pen', 'A curled red vulpine sleeping beneath unfurling fiddlehead fern fronds.', 'Curled sleeping fox resting quietly in a bed of lush forest ferns', ARRAY['fox', 'sleeping', 'forest', 'ferns', 'sienna', 'wildlife'], 'Distraction-Free Mode Mascot', 9, 'first-party'),
  ('art-10', 'ART-10', 'Astronomers Astrolabe Ring', '/artist-reference/art-10.jpeg', 'Dark umber ink & gold acrylic highlights', 'Brass celestial armillary instrument engraved with zodiac constellations.', 'Intricate celestial sphere astrolabe with coordinate gradations', ARRAY['astrolabe', 'celestial', 'navigation', 'astronomy', 'brass', 'historic'], 'Navigation Brand Mark Reference', 10, 'first-party'),
  ('art-11', 'ART-11', 'Two Hands in Gentle Grasp', '/artist-reference/art-11.jpeg', 'Charcoal & white chalk highlight on toned paper', 'Expressive gestural sketch capturing two interlocked hands.', 'Charcoal anatomical study of two clasped hands on warm toned paper', ARRAY['hands', 'anatomy', 'gesture', 'charcoal', 'study', 'touch'], 'Studio Companion & Creative Bond', 11, 'first-party'),
  ('art-12', 'ART-12', 'Geometric Owl of Shards', '/artist-reference/art-12.jpeg', 'Sharp black pigment liner & orange accents', 'A stylized horned owl assembled from sharp faceted polyhedral planes.', 'Geometric faceted owl drawing with bold orange ocular circles', ARRAY['owl', 'geometric', 'low-poly', 'faceted', 'sharp', 'nocturnal'], 'Focus Mode & Analytical Vision', 12, 'first-party'),
  ('art-13', 'ART-13', 'Lighthouse on Jagged Crag', '/artist-reference/art-13.jpeg', 'Paynes grey watercolor & fine pen line', 'A solitary stone beacon steadfast upon storm-lashed marine cliffs.', 'Watercolor painting of a remote coastal lighthouse amid crashing waves', ARRAY['lighthouse', 'coastal', 'beacon', 'storm', 'crag', 'maritime'], 'Archive Portal & Solitary Refuge', 13, 'first-party'),
  ('art-14', 'ART-14', 'Gnarled Olive Bonsai in Pot', '/artist-reference/art-14.jpeg', 'Sumi ink wash on textured mulberry paper', 'Ancient dwarf olive tree with twisted trunk and exposed deadwood.', 'Japanese sumi ink wash of a potted bonsai with twisted trunk', ARRAY['bonsai', 'olive', 'sumi', 'wash', 'potted', 'growth'], 'Collections System & Cultivated Works', 14, 'first-party'),
  ('art-15', 'ART-15', 'Scribe with Feather Quill', '/artist-reference/art-15.jpeg', 'Walnut ink on aged parchment paper', 'Scholar hunched over a codex desk dipping a raven quill into an inkhorn.', 'Renaissance scholar writing diligently with quill feather on open manuscript', ARRAY['scribe', 'quill', 'scholar', 'manuscript', 'walnut', 'parchment'], 'PDF Annotations & Studio Notes', 15, 'first-party'),
  ('art-16', 'ART-16', 'Sunken Nautilus Shell', '/artist-reference/art-16.jpeg', 'Cyanotype print with gold ink leafing', 'Logarithmic spiral nautilus shell shimmering on deep cobalt indigo ground.', 'Cyanotype blue photographic print of a spiraled nautilus shell with gold leaf', ARRAY['nautilus', 'cyanotype', 'shell', 'spiral', 'fibonacci', 'gold'], 'Golden Ratio & Geometric Harmony', 16, 'first-party'),
  ('art-17', 'ART-17', 'Old Pocket Watch with Exposed Balance Wheel', '/artist-reference/art-17.jpeg', 'Graphite pencil & ivory gouache highlight', 'An antique open-face pocket watch displaying jewel bearings and hairspring.', 'Detailed graphite study of a ticking pocket watch movement and balance spring', ARRAY['watch', 'time', 'horology', 'balance', 'graphite', 'antiquity'], 'Reading Progress & Studio Timeline', 17, 'first-party'),
  ('art-18', 'ART-18', 'Mechanical Hand Reaching for Blossom', '/artist-reference/art-18.jpeg', 'Dark bronze ink & rose watercolor wash', 'A jointed prosthetic hand extending tender finger calipers to touch a plum blossom.', 'Articulated robotic arm extending toward a delicate flowering plant', ARRAY['robotic', 'flower', 'botanical', 'manipulator', 'harmony'], 'Hand & Flora Interaction Study', 18, 'first-party'),
  ('art-19', 'ART-19', 'Masked Figure with Afro & Swirling Smoke', '/artist-reference/art-19.jpeg', 'Sepia ink & purple marker with curling vapor line', 'A solemn masked protagonist crowned with an afro, framed by swirling tendrils of incense vapor.', 'Masked character with stylized afro hair enveloped in curling atmospheric smoke ribbons', ARRAY['masked', 'afro', 'smoke', 'vapor', 'incense', 'sepia'], 'Studio Feature — Swirl Smoke Flourish', 19, 'first-party'),
  ('art-20', 'ART-20', 'Bird of Dense Layered Feathers', '/artist-reference/art-20.jpeg', 'Dense cross-hatch ink wash with elongated bill', 'A majestic shorebird covered in meticulously feathered cross-hatching, gazing downward with sharp avian focus.', 'Intricate monochrome ink wash illustration of a bird with dense textured plumage', ARRAY['bird', 'feathers', 'cross-hatch', 'plumage', 'monochrome', 'texture'], 'Studio Feature — Monochrome Texture Grain', 20, 'first-party')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  filename = EXCLUDED.filename,
  medium = EXCLUDED.medium,
  description = EXCLUDED.description,
  alt_text = EXCLUDED.alt_text,
  tags = EXCLUDED.tags,
  role = EXCLUDED.role,
  display_order = EXCLUDED.display_order;

-- ------------------------------------------------------------
-- Migration 007: Art Room Boards & Items
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS art_room_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Art Room',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_art_room_boards_user_id ON art_room_boards(user_id);

ALTER TABLE art_room_boards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'art_room_boards' AND policyname = 'Users can view own art room boards') THEN
    CREATE POLICY "Users can view own art room boards" ON art_room_boards FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'art_room_boards' AND policyname = 'Users can insert own art room boards') THEN
    CREATE POLICY "Users can insert own art room boards" ON art_room_boards FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'art_room_boards' AND policyname = 'Users can update own art room boards') THEN
    CREATE POLICY "Users can update own art room boards" ON art_room_boards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'art_room_boards' AND policyname = 'Users can delete own art room boards') THEN
    CREATE POLICY "Users can delete own art room boards" ON art_room_boards FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS art_room_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES art_room_boards(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('artwork', 'book_page', 'archive_ref', 'annotation', 'note')),
  x_percent REAL NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
  y_percent REAL NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),
  width_percent REAL DEFAULT 15 CHECK (width_percent > 0 AND width_percent <= 100),
  height_percent REAL DEFAULT 15 CHECK (height_percent > 0 AND height_percent <= 100),
  rotation_degrees REAL DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  title TEXT DEFAULT '',
  note_content TEXT DEFAULT '',
  ref_artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  ref_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  ref_book_page INTEGER,
  ref_archive_asset_id TEXT REFERENCES kin_archive_assets(id) ON DELETE SET NULL,
  ref_annotation_id UUID REFERENCES annotations(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_art_room_items_board_id ON art_room_items(board_id);
CREATE INDEX IF NOT EXISTS idx_art_room_items_user_id ON art_room_items(user_id);

ALTER TABLE art_room_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'art_room_items' AND policyname = 'Users can view own art room items') THEN
    CREATE POLICY "Users can view own art room items" ON art_room_items FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'art_room_items' AND policyname = 'Users can insert own art room items') THEN
    CREATE POLICY "Users can insert own art room items" ON art_room_items FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'art_room_items' AND policyname = 'Users can update own art room items') THEN
    CREATE POLICY "Users can update own art room items" ON art_room_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'art_room_items' AND policyname = 'Users can delete own art room items') THEN
    CREATE POLICY "Users can delete own art room items" ON art_room_items FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- Migration 008: Storage Buckets & Storage RLS
-- ------------------------------------------------------------

-- 1. Artwork images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-images', 'artwork-images', false)
ON CONFLICT (id) DO NOTHING;

-- 2. User books PDF bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-books', 'user-books', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for artwork-images
DROP POLICY IF EXISTS "Users can manage own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own artwork images" ON storage.objects;

CREATE POLICY "Users can manage own artwork images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'artwork-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'artwork-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Storage policies for user-books
DROP POLICY IF EXISTS "Users can manage own books in user-books" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own books to user-books" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own books in user-books" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own books from user-books" ON storage.objects;

CREATE POLICY "Users can manage own books in user-books"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'user-books' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'user-books' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Migration 009: Reading Sessions & Memory Bridge Table
-- ============================================================
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL,
  start_position REAL DEFAULT 0,
  end_position REAL DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 1,
  is_meaningful BOOLEAN DEFAULT FALSE,
  recap TEXT,
  recap_generated_at TIMESTAMPTZ,
  recap_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_book ON reading_sessions(user_id, book_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_meaningful ON reading_sessions(user_id, book_id, is_meaningful);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

-- Migration 010: idempotent policies; a session may only reference the user's own book
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reading_sessions_page_range_check') THEN
    ALTER TABLE reading_sessions
      ADD CONSTRAINT reading_sessions_page_range_check CHECK (start_page >= 1 AND end_page >= start_page) NOT VALID;
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own reading sessions" ON reading_sessions;
CREATE POLICY "Users can view own reading sessions"
  ON reading_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reading sessions" ON reading_sessions;
CREATE POLICY "Users can insert own reading sessions"
  ON reading_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM books b WHERE b.id = book_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own reading sessions" ON reading_sessions;
CREATE POLICY "Users can update own reading sessions"
  ON reading_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM books b WHERE b.id = book_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own reading sessions" ON reading_sessions;
CREATE POLICY "Users can delete own reading sessions"
  ON reading_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- SETUP COMPLETE! All tables, indexes, RLS policies, and storage
-- buckets are now configured for Kin Studio.
-- ============================================================

