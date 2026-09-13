-- ============================================================
-- Migration 001: Artwork-Collection Memberships Junction Table
-- ============================================================

CREATE TABLE IF NOT EXISTS artwork_collection_memberships (
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (artwork_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_collection_id ON artwork_collection_memberships(collection_id);
CREATE INDEX IF NOT EXISTS idx_memberships_artwork_id ON artwork_collection_memberships(artwork_id);

-- Enable RLS
ALTER TABLE artwork_collection_memberships ENABLE ROW LEVEL SECURITY;

-- User can view memberships for artworks they own
CREATE POLICY "Users can view own artwork collection memberships"
  ON artwork_collection_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = artwork_collection_memberships.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

-- User can add artwork to collection if they own both
CREATE POLICY "Users can insert own artwork collection memberships"
  ON artwork_collection_memberships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = artwork_collection_memberships.artwork_id
      AND artworks.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = artwork_collection_memberships.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- User can remove membership if they own the artwork
CREATE POLICY "Users can delete own artwork collection memberships"
  ON artwork_collection_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = artwork_collection_memberships.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

-- Migrate existing array data if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artworks' AND column_name = 'collection_ids'
  ) THEN
    INSERT INTO artwork_collection_memberships (artwork_id, collection_id)
    SELECT a.id, unnest(a.collection_ids)
    FROM artworks a
    WHERE a.collection_ids IS NOT NULL AND cardinality(a.collection_ids) > 0
    ON CONFLICT DO NOTHING;

    ALTER TABLE artworks DROP COLUMN collection_ids;
  END IF;
END $$;
