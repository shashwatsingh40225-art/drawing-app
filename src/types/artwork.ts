/**
 * User-uploaded artwork metadata.
 * Stored in Supabase table: artworks
 */
export interface Artwork {
  id: string;
  user_id: string;
  title: string;
  description: string;
  creation_date: string; // ISO date YYYY-MM-DD
  upload_date: string;   // ISO datetime
  updated_at: string;    // ISO datetime
  deleted_at: string | null;
  medium: string;
  subject: string;
  tags: string[];
  is_favorite: boolean;
  status: 'completed' | 'in-progress' | 'study' | 'abandoned';
  notes: string;
  image_path: string | null;
  thumbnail_path: string | null;
  collection_ids?: string[]; // preserved for UI backward compatibility / local cache
}

/**
 * Junction record connecting an artwork to a collection.
 * Stored in Supabase table: artwork_collection_memberships
 */
export interface ArtworkCollectionMembership {
  artwork_id: string;
  collection_id: string;
  added_at: string;
}
