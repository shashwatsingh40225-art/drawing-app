import React from 'react';
import { Bookmark, Sparkles, ArrowRight, Trash2, ArrowUpRight } from 'lucide-react';
import { Artwork, MOCK_KINDRED_ARTWORKS } from '../data/artworks';

interface FavoritesScreenProps {
  savedArtworks: string[];
  onToggleSave: (id: string) => void;
  onSelectArtwork: (artwork: Artwork) => void;
  onGoDiscover: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  savedArtworks,
  onToggleSave,
  onSelectArtwork,
  onGoDiscover,
}) => {
  const savedList = MOCK_KINDRED_ARTWORKS.filter((art) => savedArtworks.includes(art.id));

  return (
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Bookmark size={20} color="var(--color-secondary)" />
          <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-secondary)', fontWeight: 600 }}>
            Curated Collection
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-primary)' }}>
          Saved Kindred Expressions
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
          {savedList.length} artworks preserved from your discovery journeys.
        </p>
      </div>

      {/* List or Empty State */}
      {savedList.length > 0 ? (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '28px',
          }}
        >
          {savedList.map((art) => (
            <div 
              key={art.id}
              onClick={() => onSelectArtwork(art)}
              className="art-card double-outline-card"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span className="match-badge high">
                  <Sparkles size={11} />
                  <span>{art.matchScore}% Kin</span>
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(art.id);
                  }}
                  style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-error)',
                    backgroundColor: 'rgba(178, 58, 46, 0.08)',
                    border: '1px solid rgba(178, 58, 46, 0.2)',
                  }}
                  title="Remove from saved"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Artwork Mat */}
              <div 
                style={{
                  backgroundColor: '#FAF5EC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(222, 210, 188, 0.6)',
                  height: '240px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  overflow: 'hidden',
                  marginBottom: '14px',
                }}
              >
                <img 
                  src={art.filename} 
                  alt={art.title}
                  className="artwork-img-blend"
                  style={{
                    maxHeight: '210px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>
                {art.title}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                {art.artist}
              </div>

              <div 
                style={{
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                }}
              >
                <span>View Details</span>
                <ArrowUpRight size={14} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State with ART-01 Crane per Spec */
        <div 
          style={{
            textAlign: 'center',
            padding: '72px 24px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            maxWidth: '580px',
            margin: '40px auto',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <div 
            style={{
              width: '240px',
              height: '240px',
              margin: '0 auto 24px',
              backgroundColor: '#FAF5EC',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '16px',
            }}
          >
            <img 
              src="/artist-reference/art-01.jpeg" 
              alt="ART-01: Crane in top hat with cane"
              className="artwork-img-blend"
              style={{ maxHeight: '210px', width: 'auto' }}
            />
          </div>

          <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
            Nothing saved yet — go find some kin.
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto 28px' }}>
            When you discover an artwork whose line pressure, ink wash, or hybrid anatomy resonates with your drawing, bookmark it to preserve here.
          </p>

          <button
            onClick={onGoDiscover}
            className="btn-accent double-outline-btn"
            style={{ padding: '12px 28px' }}
          >
            <Sparkles size={16} />
            <span>Discover Kindred Art</span>
          </button>
        </div>
      )}
    </div>
  );
};
