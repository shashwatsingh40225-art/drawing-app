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

