import React from 'react';
import { Link } from 'react-router-dom';
import { Artwork, useArtworkStore } from '../../stores/artworkStore';
import { ArtworkMat } from '../ui/ArtworkMat';
import { Badge } from '../ui/Badge';
import { formatRelative } from '../../utils/dates';
import { Star } from 'lucide-react';

interface ArtworkCardProps {
  artwork: Artwork;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork }) => {
  const { toggleFavorite } = useArtworkStore();

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(artwork.id);
  };

  const displayImage = artwork.thumbnail_path || artwork.image_path || '/artist-reference/art-01.jpeg';

  return (
    <Link
      to={`/my-art/${artwork.id}`}
      className="card-surface double-outline-card"
      style={{
        cursor: 'pointer',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-subtle)',
        transition: 'transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 150ms ease-in-out',
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
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
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
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: artwork.is_favorite ? 'var(--color-accent)' : 'var(--color-text-muted)',
              transition: 'transform 150ms ease-in-out',
            }}
            aria-label={artwork.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              size={18}
              fill={artwork.is_favorite ? 'var(--color-accent)' : 'none'}
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
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              marginLeft: 'auto',
            }}
          >
            {formatRelative(artwork.creation_date || artwork.upload_date)}
          </span>
        </div>
      </div>
    </Link>
  );
};
