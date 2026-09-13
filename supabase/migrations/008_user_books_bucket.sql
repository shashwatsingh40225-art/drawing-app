-- ============================================================
-- Migration 008: User Books Storage Bucket & RLS Policies
-- ============================================================

-- 1. Create the private bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-books', 'user-books', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS policies for user-books bucket
DROP POLICY IF EXISTS "Users can manage own books in user-books" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own books to user-books" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own books in user-books" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own books from user-books" ON storage.objects;

CREATE POLICY "Users can manage own books in user-books"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'user-books'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-books'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
