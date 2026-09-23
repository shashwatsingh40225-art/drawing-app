export type BookFormat = 'pdf' | 'epub';

/**
 * Book — a PDF or EPUB uploaded by the user to their private library.
 * Stored in Supabase table: books
 * File stored in Supabase Storage: user-books/{user_id}/{book_id}/original.pdf|.epub
 */
export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  description: string;
  file_path: string;        // Supabase Storage path in user-books bucket
  file_size_bytes: number;
  format: BookFormat;
  page_count: number | null; // PDF: page count. EPUB: spine section (chapter) count.
  cover_thumbnail_path?: string | null;
  cover_image_path?: string | null;
  tags: string[];
  upload_date: string;       // ISO datetime
  updated_at: string;        // ISO datetime
  deleted_at: string | null;
}

/**
 * ReadingProgress — persists per-user, per-book page position.
 * Stored in Supabase table: reading_progress
 */
export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;      // 1-indexed
  total_pages: number | null;
  scroll_position: number;   // 0.0 - 1.0 or pixel offset
  scroll_offset?: number;
  zoom_level: number;
  reading_mode: 'continuous' | 'paginated';
  started_at: string;
  last_read_at: string;      // ISO datetime
  /** EPUB only: precise epub.js CFI within current_page's spine section, for exact resume
   *  (current_page alone is section-granular and would otherwise reopen at the chapter start). */
  epub_cfi?: string | null;
}

export type BookmarkColor = 'primary' | 'accent' | 'secondary' | 'muted';

/**
 * Bookmark — a saved page reference inside a book.
 * Stored in Supabase table: bookmarks
 */
export interface Bookmark {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;       // 1-indexed
  label: string;             // short user-facing label
  note?: string;             // optional freeform note
  color: BookmarkColor | string;
  created_at: string;        // ISO datetime
  /** EPUB only: precise epub.js CFI within page_number's spine section. Lets multiple bookmarks
   *  exist within one chapter instead of clumping onto a single page-number-only bookmark. */
  epub_cfi?: string | null;
}

export type AnnotationType = 'note' | 'archive_ref' | 'artwork_ref' | 'page_ref';

/**
 * PageAnnotation — a text note or pin attached to a specific page.
 * Stored in Supabase table: annotations
 */
export interface PageAnnotation {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;       // 1-indexed
  type: AnnotationType;
  content: string;           // note text
  x_percent: number;         // 0.0 - 100.0
  y_percent: number;         // 0.0 - 100.0
  width_percent?: number | null;
  height_percent?: number | null;
  rotation_degrees?: number;
  z_index?: number;
  ref_archive_asset_id?: string | null;
  ref_artwork_id?: string | null;
  color?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Local upload state used in the UI during PDF upload.
 */
export interface BookUploadState {
  file: File;
  title: string;
  author: string;
  tags: string[];
  uploadProgress: number;  // 0–100
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  error: string | null;
}

/**
 * ReadingSession — the stretch of a book read in one sitting, inferred automatically
 * (see services/readingSessionLogic.ts). The page range is incremental: it covers the new
 * content of this session, so consecutive sessions produce consecutive recaps.
 * Stored in Supabase table: reading_sessions (with localStorage fallback).
 */
export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  started_at: string;        // ISO datetime
  ended_at: string;          // ISO datetime — last moment of active reading
  start_page: number;        // 1-indexed
  end_page: number;          // 1-indexed, never beyond a page the reader reached
  start_position?: number;   // legacy column, unused
  end_position?: number;     // legacy column, unused
  duration_seconds: number;  // active reading time in seconds
  pages_read: number;        // pages in [start_page, end_page]
  is_meaningful: boolean;    // deterministic threshold met — eligible for a recap
  recap: string | null;      // "Previously…" memory bridge (~30s read)
  recap_generated_at: string | null;
  recap_viewed_at: string | null;
  created_at: string;        // ISO datetime
  updated_at: string;        // ISO datetime
  /** EPUB only: the precise epub.js CFI reached within end_page's spine section, if known.
   *  Lets the recap spoiler guard stop extraction exactly where the reader stopped instead of
   *  including the rest of a chapter they never read. */
  end_cfi?: string | null;
  /** EPUB only: where this session began within start_page. */
  start_cfi?: string | null;
  // Local-only (not database columns)
  recap_error?: string | null;
  recap_error_code?: string | null; // decides whether a failed recap is retried automatically
  sync_pending?: boolean;           // saved on this device, not yet on the server
}

