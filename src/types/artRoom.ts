/**
 * Art Room Board — canvas board belonging to a user.
 */
export interface ArtRoomBoard {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type ArtRoomItemType = 'artwork' | 'book_page' | 'archive_ref' | 'annotation' | 'note';

/**
 * Art Room Item — pins, artworks, book pages, archive items, notes placed on board.
 */
export interface ArtRoomItem {
  id: string;
  user_id: string;
  board_id: string;
  type: ArtRoomItemType;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  rotation_degrees: number;
  z_index: number;
  title?: string;
  note_content?: string;
  ref_artwork_id?: string | null;
  ref_book_id?: string | null;
  ref_book_page?: number | null;
  ref_archive_asset_id?: string | null;
  ref_annotation_id?: string | null;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
}
