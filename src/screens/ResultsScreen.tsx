import React, { useState } from 'react';
import { Bookmark, Sparkles, Filter, SlidersHorizontal, ArrowUpRight, UploadCloud, RefreshCw } from 'lucide-react';
import { Artwork, MOCK_KINDRED_ARTWORKS } from '../data/artworks';

interface ResultsScreenProps {
  uploadedDrawing: { url: string; title: string; source?: string };
  savedArtworks: string[];
  onToggleSave: (id: string) => void;
  onSelectArtwork: (artwork: Artwork) => void;
  onNewUpload: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  uploadedDrawing,
  savedArtworks,
  onToggleSave,
  onSelectArtwork,
  onNewUpload,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'linework' | 'hybrid' | 'chromatic'>('all');
  const [minMatch, setMinMatch] = useState<number>(70);

  const filteredArtworks = MOCK_KINDRED_ARTWORKS.filter((art) => {
    if (art.matchScore < minMatch) return false;
    if (activeFilter === 'linework') return art.dimensions.linework >= 85;
    if (activeFilter === 'hybrid') return art.dimensions.hybridity >= 85;
    if (activeFilter === 'chromatic') return art.dimensions.chromatic >= 85;
    return true;
  });

  return (
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 96px' }}>
      {/* Pinned Query Bar — User's Uploaded Drawing Reference */}
      <div 
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '36px',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FAF5EC',
              border: '1.5px solid var(--color-primary)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              flexShrink: 0,
            }}
          >
            <img 
              src={uploadedDrawing.url} 
              alt={uploadedDrawing.title}
              className="artwork-img-blend"
              style={{ maxHeight: '56px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-secondary)', fontWeight: 600 }}>
              Kindred Matches For
            </div>
            <h1 style={{ fontSize: '1.35rem', color: 'var(--color-primary)', margin: '2px 0 4px' }}>
              {uploadedDrawing.title}
            </h1>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Showing {filteredArtworks.length} kindred artistic expressions found online
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onNewUpload}
            className="btn-secondary double-outline-btn"
            style={{ padding: '9px 16px', fontSize: '0.88rem' }}
          >
            <UploadCloud size={16} />
            <span>Try Another Drawing</span>
          </button>
        </div>
      </div>

      {/* Filter and Dimension Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        {/* Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '4px' }}>
            Filter Dimension:
          </span>

          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.84rem',
              fontWeight: 500,
              backgroundColor: activeFilter === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeFilter === 'all' ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              border: '1px solid',
              borderColor: activeFilter === 'all' ? 'var(--color-primary)' : 'var(--color-border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            All Expressions ({MOCK_KINDRED_ARTWORKS.length})
          </button>

          <button
            onClick={() => setActiveFilter('linework')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.84rem',
              fontWeight: 500,
              backgroundColor: activeFilter === 'linework' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeFilter === 'linework' ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              border: '1px solid',
              borderColor: activeFilter === 'linework' ? 'var(--color-primary)' : 'var(--color-border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Contour & Linework (90%+)
          </button>

          <button
            onClick={() => setActiveFilter('hybrid')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.84rem',
              fontWeight: 500,
              backgroundColor: activeFilter === 'hybrid' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeFilter === 'hybrid' ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              border: '1px solid',
              borderColor: activeFilter === 'hybrid' ? 'var(--color-primary)' : 'var(--color-border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Hybrid Zoology
          </button>

          <button
            onClick={() => setActiveFilter('chromatic')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.84rem',
              fontWeight: 500,
              backgroundColor: activeFilter === 'chromatic' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeFilter === 'chromatic' ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              border: '1px solid',
              borderColor: activeFilter === 'chromatic' ? 'var(--color-primary)' : 'var(--color-border)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Chromatic Offset Echo
          </button>
        </div>

        {/* Sensitivity slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            Min Match: <strong style={{ color: 'var(--color-primary)' }}>{minMatch}%</strong>
          </span>
          <input 
            type="range" 
            min="60" 
            max="95" 
            value={minMatch} 
            onChange={(e) => setMinMatch(Number(e.target.value))}
            style={{
              accentColor: 'var(--color-accent)',
              cursor: 'pointer',
              width: '100px',
            }}
          />
        </div>
      </div>

      {/* Grid of Results (Spec: generous 24px+ gutters, uncropped artwork on neutral mat) */}
      {filteredArtworks.length > 0 ? (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '28px',
          }}
        >
          {filteredArtworks.map((art) => {
            const isSaved = savedArtworks.includes(art.id);
            const isHighMatch = art.matchScore >= 90;

            return (
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
                {/* Top Bar: Match strength badge and Save button */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <span className={`match-badge ${isHighMatch ? 'high' : 'medium'}`}>
                    <Sparkles size={11} />
                    <span>{art.matchScore}% Kinship</span>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(art.id);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSaved ? 'rgba(180, 83, 31, 0.12)' : 'transparent',
                      color: isSaved ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                      border: isSaved ? '1px solid var(--color-secondary)' : '1px solid transparent',
                      transition: 'all var(--transition-fast)',
                    }}
                    title={isSaved ? 'Remove from Saved' : 'Save to Collection'}
                  >
                    <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Artwork Mat: uncropped, centered, generous padding */}
                <div 
                  style={{
                    backgroundColor: '#FAF5EC',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(222, 210, 188, 0.6)',
                    height: '260px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '14px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                  }}
                >
                  <img 
                    src={art.filename} 
                    alt={art.title}
                    className="artwork-img-blend"
                    style={{
                      maxHeight: '230px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                {/* Metadata */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 
                    style={{ 
                      fontSize: '1.05rem', 
                      marginBottom: '4px',
                      color: 'var(--color-primary)',
                      lineHeight: 1.3
                    }}
                  >
                    {art.title}
                  </h3>

                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    {art.artist} · <span style={{ color: 'var(--color-text-muted)' }}>{art.date}</span>
                  </div>

                  <p 
                    style={{ 
                      fontSize: '0.82rem', 
                      color: 'var(--color-text-secondary)', 
                      lineHeight: 1.5,
                      marginBottom: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1
                    }}
                  >
                    {art.similarityReason}
                  </p>

                  {/* Bottom details & action pill */}
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--color-border-subtle)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {art.source}
                    </span>

                    <span 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--color-accent)',
                      }}
                    >
                      <span>Examine Kin</span>
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State with ART-01 (Top-Hatted Crane with Cane) per Asset Map */
        <div 
          style={{
            textAlign: 'center',
            padding: '64px 20px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            maxWidth: '560px',
            margin: '40px auto',
          }}
        >
          <div 
            style={{
              width: '220px',
              height: '220px',
              margin: '0 auto 20px',
              backgroundColor: '#FAF5EC',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '12px'
            }}
          >
            <img 
              src="/artist-reference/art-01.jpeg" 
              alt="ART-01: Crane in top hat with cane"
              className="artwork-img-blend"
              style={{ maxHeight: '190px', width: 'auto' }}
            />
          </div>

          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
            No Kin Found for this Sensitivity
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto 24px' }}>
            Even the crane tipped his hat and found no matches at {minMatch}% similarity. Lower the threshold slider or switch to another dimension.
          </p>

          <button
            onClick={() => { setActiveFilter('all'); setMinMatch(70); }}
            className="btn-primary double-outline-btn"
          >
            <RefreshCw size={15} />
            <span>Reset Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
