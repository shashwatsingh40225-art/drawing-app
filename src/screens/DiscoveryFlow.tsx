import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ProcessingScreen } from './ProcessingScreen';
import { ResultsScreen } from './ResultsScreen';
import { ArtworkDetailScreen } from './ArtworkDetailScreen';
import { FavoritesScreen } from './FavoritesScreen';
import { Artwork, MOCK_KINDRED_ARTWORKS, SAMPLE_USER_DRAWINGS } from '../data/artworks';

export const DiscoveryFlow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();

  const [uploadedDrawing, setUploadedDrawing] = useState<{ url: string; title: string; source?: string }>({
    url: '/artist-reference/art-01.jpeg',
    title: 'The Dapper Crane in Top Hat',
    source: 'Sketchbook Folio 1',
  });
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork>(MOCK_KINDRED_ARTWORKS[0]);
  const [savedArtworks, setSavedArtworks] = useState<string[]>(['res-01', 'res-04']);

  const handleToggleSave = (artId: string) => {
    setSavedArtworks((prev) =>
      prev.includes(artId) ? prev.filter((item) => item !== artId) : [...prev, artId]
    );
  };

  const handleSelectArtwork = (art: Artwork) => {
    setSelectedArtwork(art);
    navigate(`/discover/results/${art.id}`);
  };

  const handleSelectSample = (sample: typeof SAMPLE_USER_DRAWINGS[0]) => {
    setUploadedDrawing({
      url: sample.image,
      title: sample.title,
      source: 'Sketchbook Collection',
    });
    navigate('/discover/processing');
  };

  const path = location.pathname;

  if (path === '/discover/processing') {
    return (
      <ProcessingScreen
        uploadedDrawing={uploadedDrawing}
        onComplete={() => navigate('/discover/results')}
      />
    );
  }

  if (path.startsWith('/discover/results/') && id) {
    const matched = MOCK_KINDRED_ARTWORKS.find((a) => a.id === id) || selectedArtwork;
    return (
      <ArtworkDetailScreen
        artwork={matched}
        uploadedDrawing={uploadedDrawing}
        isSaved={savedArtworks.includes(matched.id)}
        onToggleSave={() => handleToggleSave(matched.id)}
        onBack={() => navigate('/discover/results')}
      />
    );
  }

  if (path === '/discover/results') {
    return (
      <ResultsScreen
        uploadedDrawing={uploadedDrawing}
        savedArtworks={savedArtworks}
        onToggleSave={handleToggleSave}
        onSelectArtwork={handleSelectArtwork}
        onNewUpload={() => navigate('/discover')}
      />
    );
  }

  if (path === '/favorites') {
    return (
      <FavoritesScreen
        savedArtworks={savedArtworks}
        onToggleSave={handleToggleSave}
        onSelectArtwork={handleSelectArtwork}
        onGoDiscover={() => navigate('/discover/results')}
      />
    );
  }

  // Default /discover route: Quick Try / Sample drawing selection for discovery
  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--color-primary)', margin: '0 0 12px 0' }}>
          Visual Kinship Discovery
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
          Select a sample drawing or study to run our visual recognition engine across historical folios and kindred artist archives.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        {SAMPLE_USER_DRAWINGS.map((sample) => (
          <div
            key={sample.id}
            onClick={() => handleSelectSample(sample)}
            className="art-card double-outline-card"
            style={{
              cursor: 'pointer',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#FAF5EC',
                borderRadius: 'var(--radius-sm)',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '12px',
              }}
            >
              <img
                src={sample.image}
                alt={sample.title}
                className="artwork-img-blend"
                style={{ maxHeight: '180px', objectFit: 'contain' }}
              />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-primary)', margin: '0 0 4px 0' }}>
              {sample.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              {sample.subtitle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
