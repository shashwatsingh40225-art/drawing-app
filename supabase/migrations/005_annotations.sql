-- ============================================================
-- Migration 005: Page Annotations & Overlays Table
-- ============================================================

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

-- Enable RLS
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own annotations"
  ON annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annotations"
  ON annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations"
  ON annotations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations"
  ON annotations FOR DELETE
  USING (auth.uid() = user_id);
