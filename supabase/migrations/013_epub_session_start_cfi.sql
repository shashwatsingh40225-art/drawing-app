-- EPUB sessions can begin partway through a spine section. Preserve their first
-- visible position so a recap does not repeat earlier text from that chapter.
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS start_cfi TEXT;
