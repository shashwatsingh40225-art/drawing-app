/**
 * KinArchiveAsset — one of the 20 first-party artworks bundled with Kin Studio.
 * These are embedded in the app in public/artist-reference/.
 */
export interface KinArchiveAsset {
  id: string;              // e.g. 'art-01'
  code: string;            // e.g. 'ART-01'
  title: string;
  filename: string;        // e.g. '/artist-reference/art-01.jpeg'
  medium: string;
  description: string;
  alt_text: string;
  tags: string[];
  role?: string;           // UI role description
  display_order: number;
  rights_status: string;
}

/**
 * ArtRoomPin — legacy pin interface for Art Room canvas.
 */
export interface ArtRoomPin {
  id: string;
  user_id: string;
  source_type: 'user_artwork' | 'kin_archive';
  source_id: string;       // artwork.id or KinArchiveAsset.id
  image_url: string;
  label: string;
  x: number;               // canvas x position (px)
  y: number;               // canvas y position (px)
  width: number;           // canvas width (px)
  rotation: number;        // degrees
  z_index: number;
  note: string;
  created_at: string;
}
