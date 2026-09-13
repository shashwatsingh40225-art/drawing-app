import React, { useState } from 'react';
import { ArrowLeft, Bookmark, ExternalLink, Share2, Sparkles, SplitSquareVertical, Eye } from 'lucide-react';
import { Artwork } from '../data/artworks';
import { FeatherDivider } from '../components/FeatherDivider';

interface ArtworkDetailScreenProps {
  artwork: Artwork;
  uploadedDrawing: { url: string; title: string; source?: string };
  isSaved: boolean;
  onToggleSave: () => void;
  onBack: () => void;
}

export const ArtworkDetailScreen: React.FC<ArtworkDetailScreenProps> = ({
  artwork,
  uploadedDrawing,
  isSaved,
  onToggleSave,
  onBack,
}) => {
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px 96px' }}>
      {/* Top Breadcrumb & Controls */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Kindred Art</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Side-by-Side Comparison Toggle */}
          <button
            onClick={() => setCompareMode(!compareMode)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              fontWeight: 500,
              backgroundColor: compareMode ? 'rgba(214, 51, 122, 0.1)' : 'var(--color-surface)',
              color: compareMode ? 'var(--color-accent)' : 'var(--color-primary)',
              border: '1px solid',
              borderColor: compareMode ? 'var(--color-accent)' : 'var(--color-border)',
              cursor: 'pointer',
            }}
          >
            <SplitSquareVertical size={16} />
            <span>{compareMode ? 'Show Artwork Solo' : 'Compare with Your Drawing'}</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onToggleSave}
            className="btn-secondary double-outline-btn"
            style={{
              padding: '8px 16px',
              color: isSaved ? 'var(--color-secondary)' : 'var(--color-primary)',
              borderColor: isSaved ? 'var(--color-secondary)' : 'var(--color-border)',
            }}
          >
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Saved in Kin' : 'Save Piece'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="btn-secondary"
            style={{ padding: '8px 14px' }}
            title="Copy link"
          >
            <Share2 size={16} />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Spec: Large artwork left ~60%, Metadata right ~40%) */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: compareMode ? '1fr 1fr' : 'minmax(320px, 1.3fr) minmax(320px, 1fr)',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Artwork Mat or Side-by-Side Comparison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {compareMode ? (
            /* Side-by-side comparison mode */
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {/* User Drawing */}
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 600, marginBottom: '8px' }}>
                  Your Upload
                </div>
                <div 
                  className="artwork-mat"
                  style={{ height: '360px', backgroundColor: '#FAF5EC' }}
                >
                  <img 
                    src={uploadedDrawing.url} 
                    alt={uploadedDrawing.title}
                    className="artwork-img-blend"
                    style={{ maxHeight: '330px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '8px' }}>
                  {uploadedDrawing.title}
                </div>
              </div>

              {/* Kindred Result */}
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-accent-teal)', fontWeight: 600, marginBottom: '8px' }}>
                  Kindred Match ({artwork.matchScore}%)
                </div>
                <div 
                  className="artwork-mat"
                  style={{ height: '360px', backgroundColor: '#FAF5EC' }}
                >
                  <img 
                    src={artwork.filename} 
                    alt={artwork.title}
                    className="artwork-img-blend"
                    style={{ maxHeight: '330px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '8px' }}>
                  {artwork.title}
                </div>
              </div>
            </div>
          ) : (
            /* Standard Large Artwork Display */
            <div 
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {/* Artwork Mat */}
              <div 
                className="artwork-mat"
                style={{
                  minHeight: '440px',
                  maxHeight: '680px',
                  backgroundColor: '#FAF5EC',
                  position: 'relative',
                }}
              >
                <img 
                  src={artwork.filename} 
                  alt={artwork.title}
                  className="artwork-img-blend"
                  style={{
                    maxHeight: '620px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>

              {/* Mat Footer Details */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-border-subtle)',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>Medium: <strong>{artwork.medium}</strong></span>
                <span>Period: <strong>{artwork.date}</strong></span>
              </div>
            </div>
          )}

          {/* Color Palette Swatches Extracted from Artwork */}
          <div 
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 24px',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Extracted Pigment & Ink Register
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {artwork.palette.map((color, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div 
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: color,
                      border: '1px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                  />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Kinship Analysis, Dimension Breakdown & Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Card */}
          <div 
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Match Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="match-badge high" style={{ fontSize: '0.84rem', padding: '4px 12px' }}>
                <Sparkles size={13} />
                <span>{artwork.matchScore}% Overall Kinship</span>
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {artwork.code}
              </span>
            </div>

            {/* Title in Fraunces Serif */}
            <h1 
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.3rem)',
                marginBottom: '8px',
                color: 'var(--color-primary)',
              }}
            >
              {artwork.title}
            </h1>

            {/* Artist & Source */}
            <div style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              <span>{artwork.artist}</span>
              <span style={{ margin: '0 8px', color: 'var(--color-border)' }}>·</span>
              <span style={{ color: 'var(--color-secondary)', fontWeight: 500 }}>{artwork.source}</span>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              {artwork.description}
            </p>

            {/* Tapering Feather Divider Rule */}
            <FeatherDivider />

            {/* Why it's similar section */}
            <div style={{ marginBottom: '24px' }}>
              <div 
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--color-primary)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Eye size={16} color="var(--color-secondary)" />
                <span>Why It's Kindred</span>
              </div>
              <p 
                style={{
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  color: 'var(--color-text-primary)',
                  backgroundColor: '#FAF5EC',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {artwork.similarityReason}
              </p>
            </div>

            {/* Kinship Dimensions Breakdown */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                Kinship Dimension Analysis
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Linework */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Contour Velocity & Line Weight</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{artwork.dimensions.linework}%</span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '4px', backgroundColor: 'var(--color-border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${artwork.dimensions.linework}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
                  </div>
                </div>

                {/* Hybridity */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Anatomical Hybridity</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{artwork.dimensions.hybridity}%</span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '4px', backgroundColor: 'var(--color-border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${artwork.dimensions.hybridity}%`, height: '100%', backgroundColor: 'var(--color-accent)' }} />
                  </div>
                </div>

                {/* Chromatic Register */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Chromatic Register Echo</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-accent-teal)' }}>{artwork.dimensions.chromatic}%</span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '4px', backgroundColor: 'var(--color-border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${artwork.dimensions.chromatic}%`, height: '100%', backgroundColor: 'var(--color-accent-teal)' }} />
                  </div>
                </div>

                {/* Texture */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Paper & Ink Tooth</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{artwork.dimensions.texture}%</span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '4px', backgroundColor: 'var(--color-border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${artwork.dimensions.texture}%`, height: '100%', backgroundColor: 'var(--color-secondary)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tag Chips */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                Visual Characteristic Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {artwork.tags.map((tag, i) => (
                  <span key={i} className={`tag-chip ${i % 3 === 0 ? 'accent' : i % 3 === 1 ? 'teal' : 'rust'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Outbound Archive Action */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
              <a
                href={artwork.sourceUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary double-outline-btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>View in External Archive</span>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
