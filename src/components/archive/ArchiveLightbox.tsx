import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { KinArchiveAsset } from '../../types/archive';
import { worlds } from '../../styles/tokens';

interface ArchiveLightboxProps {
  asset: KinArchiveAsset;
  onClose: () => void;
}

export const ArchiveLightbox: React.FC<ArchiveLightboxProps> = ({
  asset,
  onClose,
}) => {
  const world = worlds.magentaCreature;

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(26, 14, 28, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '16px 12px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="archive-lightbox-card"
        style={{
          maxWidth: '640px',
          maxHeight: 'calc(100vh - 32px)',
          width: '100%',
          margin: 'auto',
          backgroundColor: world.surface,
          borderRadius: 'var(--radius-xl)',
          overflowY: 'auto',
          border: `1.5px solid ${world.accent}`,
          boxShadow: `4px 4px 0 0 ${world.secondaryAccent}, 0 24px 60px rgba(26, 14, 28, 0.45)`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 16px 4px' }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              padding: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: world.textSecondary,
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Image inside museum mat */}
        <div style={{ padding: '0 24px', textAlign: 'center' }}>
          <div
            className="archive-lightbox-img-mat"
            style={{
              display: 'inline-block',
              backgroundColor: '#FFFFFF',
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${world.border}`,
              boxShadow: '0 8px 24px rgba(35, 23, 16, 0.08)',
              maxWidth: '100%',
            }}
          >
            <img
              src={asset.filename}
              alt={asset.alt_text}
              className="artwork-img-blend"
              style={{
                maxWidth: '100%',
                maxHeight: '42vh',
                borderRadius: 'var(--radius-sm)',
                display: 'block',
                margin: '0 auto',
              }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="archive-lightbox-body" style={{ padding: '20px 28px 26px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: world.accent,
              marginBottom: '6px',
            }}
          >
            {asset.code} · Kin Archive
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              color: world.textPrimary,
              fontSize: '1.25rem',
              marginBottom: '8px',
              marginTop: 0,
            }}
          >
            {asset.title}
          </h3>
          <p style={{ color: world.textSecondary, fontSize: '0.88rem', marginBottom: '12px', lineHeight: 1.5 }}>
            {asset.description}
          </p>
          <div style={{ fontSize: '0.82rem', color: world.textMuted, marginBottom: '16px' }}>
            <strong>Medium:</strong> {asset.medium}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '22px' }}>
            {asset.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
