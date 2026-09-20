import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Artwork, useArtworkStore } from '../../stores/artworkStore';
import { ArtworkMat } from '../ui/ArtworkMat';
import { Badge } from '../ui/Badge';
import { formatRelative } from '../../utils/dates';
import { Star } from 'lucide-react';
import { worlds } from '../../styles/tokens';

interface ArtworkCardProps {
  artwork: Artwork;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork }) => {
  const world = worlds.magentaCreature;
  const { toggleFavorite } = useArtworkStore();
  const [starBurst, setStarBurst] = useState(false);

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStarBurst(true);
    setTimeout(() => setStarBurst(false), 240);
    toggleFavorite(artwork.id);
  };

  const displayImage = artwork.thumbnail_path || artwork.image_path || null;

  return (
    <Link
      to={`/my-art/${artwork.id}`}
      className="card-surface double-outline-card sketchbook-artwork-card"
      style={{
        cursor: 'pointer',
        backgroundColor: world.surface,
        borderRadius: 'var(--radius-xl)',
        border: `1.5px solid ${world.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-subtle)',
        transition: 'transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 180ms ease, border-color 150ms ease',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
      }}
      aria-label={`View artwork: ${artwork.title}`}
    >
      {/* Artwork Mat Frame */}
      <div style={{ padding: '12px 12px 0 12px' }}>
        <ArtworkMat
          imageUrl={displayImage}
          alt={artwork.title}
          aspectRatio="1 / 1"
          padding="10px"
          maxHeight="280px"
        />
      </div>

      {/* Card Info & Badges */}
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: 1,
          backgroundColor: world.surfaceElevated,
          borderTop: `1px solid ${world.borderSubtle}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              color: world.textPrimary,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              lineHeight: 1.3,
            }}
            title={artwork.title}
          >
            {artwork.title}
          </h3>

          <button
            onClick={handleStarClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px',
              margin: '-7px -7px -7px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: artwork.is_favorite ? world.accent : world.textMuted,
              transform: starBurst ? 'scale(1.35) rotate(15deg)' : 'scale(1)',
              transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), color 150ms ease',
              borderRadius: 'var(--radius-full)',
              minWidth: '44px',
              minHeight: '44px',
            }}
            aria-label={artwork.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              size={18}
              fill={artwork.is_favorite ? world.accent : 'none'}
              strokeWidth={artwork.is_favorite ? 0 : 2}
            />
          </button>
        </div>

        {/* Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          {artwork.medium && (
            <Badge label={artwork.medium} variant="secondary" />
          )}

          {artwork.status && artwork.status !== 'completed' && (
            <Badge 
              label={artwork.status === 'in-progress' ? 'In Progress' : artwork.status === 'study' ? 'Study' : 'Abandoned'} 
              variant="muted" 
            />
          )}

          <span
            style={{
              fontSize: '0.74rem',
              color: world.textMuted,
              marginLeft: 'auto',
              fontWeight: 500,
            }}
          >
            {formatRelative(artwork.creation_date || artwork.upload_date)}
          </span>
        </div>
      </div>
    </Link>
  );
};

