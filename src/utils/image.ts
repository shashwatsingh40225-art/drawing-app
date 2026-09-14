import imageCompression from 'browser-image-compression';

export async function compressForDisplay(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxWidthOrHeight: 1920,
    maxSizeMB: 0.3,
    fileType: 'image/webp',
    useWebWorker: true,
  });
}

export async function compressForThumbnail(file: File): Promise<Blob> {
  return imageCompression(file, {
    maxWidthOrHeight: 400,
    maxSizeMB: 0.05,
    fileType: 'image/webp',
    useWebWorker: true,
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
