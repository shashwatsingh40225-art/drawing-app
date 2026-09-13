-- ============================================================
-- Migration 007: Art Room Boards and Items
-- ============================================================

CREATE TABLE IF NOT EXISTS art_room_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Art Room',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_art_room_boards_user_id ON art_room_boards(user_id);

ALTER TABLE art_room_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own art room boards"
  ON art_room_boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own art room boards"
  ON art_room_boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own art room boards"
  ON art_room_boards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own art room boards"
  ON art_room_boards FOR DELETE
  USING (auth.uid() = user_id);

-- Items pinned to an art room board
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

CREATE POLICY "Users can view own art room items"
  ON art_room_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own art room items"
  ON art_room_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own art room items"
  ON art_room_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own art room items"
  ON art_room_items FOR DELETE
  USING (auth.uid() = user_id);
