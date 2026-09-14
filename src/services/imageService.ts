import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { compressForDisplay, compressForThumbnail, blobToDataUrl } from '../utils/image';

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
  // Compress to display and thumbnail sizes with fallback to original file
  let displayBlob: Blob = file;
  let thumbBlob: Blob = file;
  try {
    const [d, t] = await Promise.all([
      compressForDisplay(file),
      compressForThumbnail(file),
    ]);
    displayBlob = d;
    thumbBlob = t;
  } catch (compErr) {
    console.warn('Image compression fallback to original file:', compErr);
    displayBlob = file;
    thumbBlob = file;
  }

  const imagePath = `${userId}/${artworkId}/display.webp`;
  const thumbnailPath = `${userId}/${artworkId}/thumb.webp`;

  const isDemo = isSupabaseDemoMode || userId.startsWith('demo-');

  if (isDemo) {
    // Generate persistent data URLs so images persist across reloads
    const [displayUrl, thumbUrl] = await Promise.all([
      blobToDataUrl(displayBlob),
      blobToDataUrl(thumbBlob),
    ]);

    return {
      imagePath,
      thumbnailPath,
      imageUrl: displayUrl,
      thumbnailUrl: thumbUrl,
    };
  }

  try {
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

    if (displayResult.error || thumbResult.error) {
      console.warn('Supabase storage upload error, falling back to local data URL:', displayResult.error || thumbResult.error);
      const [displayUrl, thumbUrl] = await Promise.all([
        blobToDataUrl(displayBlob),
        blobToDataUrl(thumbBlob),
      ]);
      return {
        imagePath,
        thumbnailPath,
        imageUrl: displayUrl,
        thumbnailUrl: thumbUrl,
      };
    }

    // Get signed URLs (valid for 1 year)
    const ONE_YEAR = 60 * 60 * 24 * 365;
    const [displayUrlRes, thumbUrlRes] = await Promise.all([
      supabase.storage.from('artwork-images').createSignedUrl(imagePath, ONE_YEAR),
      supabase.storage.from('artwork-images').createSignedUrl(thumbnailPath, ONE_YEAR),
    ]);

    return {
      imagePath,
      thumbnailPath,
      imageUrl: displayUrlRes.data?.signedUrl ?? '',
      thumbnailUrl: thumbUrlRes.data?.signedUrl ?? '',
    };
  } catch (err) {
    console.warn('Storage upload exception, falling back to data URL:', err);
    const [displayUrl, thumbUrl] = await Promise.all([
      blobToDataUrl(displayBlob),
      blobToDataUrl(thumbBlob),
    ]);
    return {
      imagePath,
      thumbnailPath,
      imageUrl: displayUrl,
      thumbnailUrl: thumbUrl,
    };
  }
}

export async function getImageUrl(path: string | null): Promise<string> {
  if (!path) return '';

  // If path is already a static asset, data URL, or blob URL, return directly
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:') ||
    path.startsWith('/')
  ) {
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
