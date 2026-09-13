import React, { useState, useEffect } from 'react';
import { Navigation, ScreenType } from './components/Navigation';
import { HomeScreen } from './screens/HomeScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { ArtworkDetailScreen } from './screens/ArtworkDetailScreen';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { AboutScreen } from './screens/AboutScreen';
import { Artwork, MOCK_KINDRED_ARTWORKS, SAMPLE_USER_DRAWINGS } from './data/artworks';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [uploadedDrawing, setUploadedDrawing] = useState<{ url: string; title: string; source?: string }>({
    url: '/artist-reference/art-01.jpeg',
    title: 'The Dapper Crane in Top Hat',
    source: 'Sketchbook Folio 1',
  });
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(MOCK_KINDRED_ARTWORKS[0]);
  const [savedArtworks, setSavedArtworks] = useState<string[]>(['res-01', 'res-04']);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Keyboard shortcut: Esc to go back from Detail
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentScreen === 'detail') {
        setCurrentScreen('results');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen]);

  const handleToggleSave = (id: string) => {
    setSavedArtworks((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectSample = (sample: typeof SAMPLE_USER_DRAWINGS[0]) => {
    setUploadedDrawing({
      url: sample.image,
      title: sample.title,
      source: 'Sketchbook Collection',
    });
    setCurrentScreen('processing');
  };

  const handleProceedToProcessing = (drawing: { url: string; title: string; source: string }) => {
    setUploadedDrawing(drawing);
    setCurrentScreen('processing');
  };

  const handleProcessingComplete = React.useCallback(() => {
    setHasSearched(true);
    setCurrentScreen('results');
  }, []);

  const handleSelectArtwork = (art: Artwork) => {
    setSelectedArtwork(art);
    setCurrentScreen('detail');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar (hidden only on full-bleed processing screen) */}
      {currentScreen !== 'processing' && (
        <Navigation
          currentScreen={currentScreen}
          onNavigate={(screen) => setCurrentScreen(screen)}
          savedCount={savedArtworks.length}
          hasActiveSearch={hasSearched}
        />
      )}

      {/* Main Screen Renderer */}
      <main style={{ flex: 1 }}>
        {currentScreen === 'home' && (
          <HomeScreen
            onStartUpload={() => setCurrentScreen('upload')}
            onSelectSample={handleSelectSample}
            onExploreArchive={() => {
              setHasSearched(true);
              setCurrentScreen('results');
            }}
          />
        )}

        {currentScreen === 'upload' && (
          <UploadScreen
            onProceedToProcessing={handleProceedToProcessing}
            onCancel={() => setCurrentScreen(hasSearched ? 'results' : 'home')}
          />
        )}

        {currentScreen === 'processing' && (
          <ProcessingScreen
            uploadedDrawing={uploadedDrawing}
            onComplete={handleProcessingComplete}
          />
        )}

        {currentScreen === 'results' && (
          <ResultsScreen
            uploadedDrawing={uploadedDrawing}
            savedArtworks={savedArtworks}
            onToggleSave={handleToggleSave}
            onSelectArtwork={handleSelectArtwork}
            onNewUpload={() => setCurrentScreen('upload')}
          />
        )}

        {currentScreen === 'detail' && selectedArtwork && (
          <ArtworkDetailScreen
            artwork={selectedArtwork}
            uploadedDrawing={uploadedDrawing}
            isSaved={savedArtworks.includes(selectedArtwork.id)}
            onToggleSave={() => handleToggleSave(selectedArtwork.id)}
            onBack={() => setCurrentScreen('results')}
          />
        )}

        {currentScreen === 'favorites' && (
          <FavoritesScreen
            savedArtworks={savedArtworks}
            onToggleSave={handleToggleSave}
            onSelectArtwork={handleSelectArtwork}
            onGoDiscover={() => {
              setHasSearched(true);
              setCurrentScreen('results');
            }}
          />
        )}

        {currentScreen === 'about' && (
          <AboutScreen />
        )}
      </main>

      {/* Footer (hidden on processing) */}
      {currentScreen !== 'processing' && (
        <footer
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            padding: '24px',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-primary)' }}>Kin</span>
              <span>· Kindred Artistic Expressions Visual Prototype</span>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setCurrentScreen('about')} style={{ color: 'inherit', textDecoration: 'underline' }}>
                Studio Manifesto
              </button>
              <button onClick={() => setCurrentScreen('upload')} style={{ color: 'inherit', textDecoration: 'underline' }}>
                Upload Drawing
              </button>
              <button onClick={() => setCurrentScreen('favorites')} style={{ color: 'inherit', textDecoration: 'underline' }}>
                Saved Kin ({savedArtworks.length})
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
