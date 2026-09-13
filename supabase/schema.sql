-- ========================================
-- Kin App Supabase Database & Storage Setup
-- ========================================

-- Artworks table
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
  thumbnail_path TEXT,
  collection_ids UUID[] DEFAULT '{}'
);

-- Enable RLS on artworks
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own artworks"
  ON artworks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own artworks"
  ON artworks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own artworks"
  ON artworks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own artworks"
  ON artworks FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_artworks_user_id ON artworks(user_id);
CREATE INDEX IF NOT EXISTS idx_artworks_creation_date ON artworks(user_id, creation_date DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_deleted_at ON artworks(user_id, deleted_at);

-- ========================================
-- Collections table
-- ========================================
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

-- Enable RLS on collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

-- ========================================
-- Storage setup (bucket: 'artwork-images')
-- ========================================

-- 1. Create the private bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork-images', 'artwork-images', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies for artwork-images
DROP POLICY IF EXISTS "Users can manage own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own artwork images" ON storage.objects;
DROP POLICY IF EXISTS "Users can access own files" ON storage.objects;

CREATE POLICY "Users can manage own artwork images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'artwork-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'artwork-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

