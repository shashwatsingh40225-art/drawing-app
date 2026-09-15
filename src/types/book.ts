/**
 * Book — a PDF uploaded by the user to their private library.
 * Stored in Supabase table: books
 * File stored in Supabase Storage: user-books/{user_id}/{book_id}/original.pdf
 */
export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  description: string;
  file_path: string;        // Supabase Storage path in user-books bucket
  file_size_bytes: number;
  page_count: number | null; // populated after PDF parse
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
 * ReadingSession — represents a contiguous portion of reading activity.
 * Tracks start and end positions, duration, and AI memory bridge recap.
 * Stored in Supabase table: reading_sessions (with localStorage fallback).
 */
export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  started_at: string;        // ISO datetime
  ended_at: string;          // ISO datetime
  start_page: number;        // 1-indexed
  end_page: number;          // 1-indexed
  start_position?: number;   // 0.0 - 1.0 scroll offset
  end_position?: number;     // 0.0 - 1.0 scroll offset
  duration_seconds: number;  // active reading time in seconds
  pages_read: number;        // number of pages covered
  is_meaningful: boolean;    // whether session met threshold for AI recap
  recap: string | null;      // AI memory bridge recap (~30s read)
  recap_error?: string | null; // Error message if AI generation failed (prevents infinite re-querying)
  recap_generated_at: string | null;
  recap_viewed_at: string | null;
  created_at: string;        // ISO datetime
  updated_at: string;        // ISO datetime
}

export interface RecapGenerationOptions {
  bookTitle?: string;
  author?: string;
  forceRegenerate?: boolean;
}

