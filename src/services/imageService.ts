import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { compressForDisplay, compressForThumbnail } from '../utils/image';

interface UploadResult {
  imagePath: string;
  thumbnailPath: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export async function uploadArtworkImage(
  file: File,
  userId: string,
  artworkId: string
): Promise<UploadResult> {
  // Compress to display and thumbnail sizes
  const [displayBlob, thumbBlob] = await Promise.all([
    compressForDisplay(file),
    compressForThumbnail(file),
  ]);

  const imagePath = `${userId}/${artworkId}/display.webp`;
  const thumbnailPath = `${userId}/${artworkId}/thumb.webp`;

  if (isSupabaseDemoMode) {
    // Create persistent object URLs or base64 data URLs for demo mode
    const displayUrl = URL.createObjectURL(displayBlob);
    const thumbUrl = URL.createObjectURL(thumbBlob);

    return {
      imagePath,
      thumbnailPath,
      imageUrl: displayUrl,
      thumbnailUrl: thumbUrl,
    };
  }

  // Live Supabase upload
  const [displayResult, thumbResult] = await Promise.all([
    supabase.storage.from('artwork-images').upload(imagePath, displayBlob, {
      contentType: 'image/webp',
      upsert: true,
    }),
    supabase.storage.from('artwork-images').upload(thumbnailPath, thumbBlob, {
      contentType: 'image/webp',
      upsert: true,
    }),
  ]);

  if (displayResult.error) {
    throw new Error(`Display upload failed: ${displayResult.error.message}`);
  }
  if (thumbResult.error) {
    throw new Error(`Thumbnail upload failed: ${thumbResult.error.message}`);
  }

  // Get signed URLs (valid for 1 year)
  const [displayUrlRes, thumbUrlRes] = await Promise.all([
    supabase.storage.from('artwork-images').createSignedUrl(imagePath, 60 * 60 * 24 * 365),
    supabase.storage.from('artwork-images').createSignedUrl(thumbnailPath, 60 * 60 * 24 * 365),
  ]);

  return {
    imagePath,
    thumbnailPath,
    imageUrl: displayUrlRes.data?.signedUrl ?? '',
    thumbnailUrl: thumbUrlRes.data?.signedUrl ?? '',
  };
}

export async function getImageUrl(path: string | null): Promise<string> {
  if (!path) return '';

  // If path is already a static asset or blob URL, return directly
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('/')) {
    return path;
  }

  if (isSupabaseDemoMode) {
    return path;
  }

  try {
    const { data, error } = await supabase.storage
      .from('artwork-images')
      .createSignedUrl(path, 60 * 60); // 1 hour
    if (error) {
      console.warn('Get image URL error:', error);
      return '';
    }
    return data?.signedUrl ?? '';
  } catch {
    return '';
  }
}

export async function deleteArtworkImages(userId: string, artworkId: string): Promise<void> {
  const paths = [
    `${userId}/${artworkId}/display.webp`,
    `${userId}/${artworkId}/thumb.webp`,
  ];

  if (isSupabaseDemoMode) {
    return;
  }

  try {
    await supabase.storage.from('artwork-images').remove(paths);
  } catch (err) {
    console.warn('Error deleting images:', err);
  }
}
