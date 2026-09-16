-- ============================================================
-- Migration 012: EPUB reader hardening (idempotent — safe to run repeatedly)
--  * reading_progress / bookmarks / reading_sessions gain an optional epub.js CFI column so
--    resume position, bookmarks, and the recap spoiler guard can be precise to the on-screen
--    location instead of only the spine section (chapter) — EPUB has no fixed page, so
--    current_page/page_number/end_page are chapter-granular by design; these columns add an
--    optional finer-grained position within that chapter.
--  * user-books storage bucket gains explicit server-side size/MIME constraints (previously
--    enforced only in client-side TypeScript, so nothing stopped an oversized or wrong-type
--    upload via direct API access).
-- ============================================================

ALTER TABLE reading_progress ADD COLUMN IF NOT EXISTS epub_cfi TEXT;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS epub_cfi TEXT;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS end_cfi TEXT;

UPDATE storage.buckets
SET file_size_limit = 26214400, -- 25MB, matching MAX_PDF_SIZE_BYTES / MAX_EPUB_SIZE_BYTES
    allowed_mime_types = ARRAY['application/pdf', 'application/epub+zip']
WHERE id = 'user-books';
