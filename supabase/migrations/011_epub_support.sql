-- ============================================================
-- Migration 011: EPUB Support
-- ============================================================
-- Books were PDF-only. `format` discriminates the two renderers; every existing and future
-- PDF row is unaffected by the default. EPUB has no fixed page, so `page_count` for an EPUB
-- book holds its spine-section (chapter) count instead of a PDF page count — the same column,
-- a format-appropriate unit.

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'epub'));
