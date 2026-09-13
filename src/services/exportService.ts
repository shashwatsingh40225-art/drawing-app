import { useArtworkStore } from '../stores/artworkStore';

export async function exportAllData(): Promise<void> {
  const artworks = useArtworkStore.getState().artworks;
  
  // Create metadata JSON
  const metadata = {
    exportDate: new Date().toISOString(),
    appVersion: '1.0.0',
    totalArtworks: artworks.length,
    artworks: artworks.map(a => {
      const copy = { ...a };
      delete (copy as { image_path?: string | null }).image_path;
      delete (copy as { thumbnail_path?: string | null }).thumbnail_path;
      return copy;
    }),
  };
  
  // Create and download JSON file
  const jsonBlob = new Blob(
    [JSON.stringify(metadata, null, 2)],
    { type: 'application/json' }
  );
  
  const url = URL.createObjectURL(jsonBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `kin-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
