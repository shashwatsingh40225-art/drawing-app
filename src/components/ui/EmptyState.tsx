import React from 'react';
import { ArtworkMat } from './ArtworkMat';

interface EmptyStateProps {
  artworkSrc?: string;
  headline: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionNode?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  artworkSrc = '/brand/illustrations/art-01-card.png',
  headline,
  description,
  actionLabel,
  onAction,
  actionNode,
  className = '',
}) => {
  return (
    <div
      className={`empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <div style={{ width: '180px', height: '180px', marginBottom: '24px' }}>
        <ArtworkMat imageUrl={artworkSrc} alt={headline} padding="10px" style={{ width: '100%', height: '100%' }} />
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.45rem',
          fontWeight: 600,
          color: 'var(--color-primary)',
          margin: '0 0 8px 0',
        }}
      >
        {headline}
      </h2>

      {description && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.92rem',
            color: 'var(--color-text-secondary)',
            margin: '0 0 24px 0',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {actionNode ? (
        actionNode
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="btn-primary double-outline-btn"
          style={{
            padding: '10px 24px',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};
