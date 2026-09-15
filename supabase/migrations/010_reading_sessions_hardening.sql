-- ============================================================
-- Migration 010: Reading sessions hardening (idempotent — safe to run repeatedly)
--  * Creates reading_sessions if migration 009 was never applied
--  * A session can only reference a book owned by the same user
--  * Page ranges must be valid
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

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reading_sessions_page_range_check') THEN
    -- NOT VALID: enforced for new writes without rejecting any existing rows.
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
