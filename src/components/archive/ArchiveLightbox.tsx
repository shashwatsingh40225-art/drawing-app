import React from 'react';
import { X, LayoutGrid } from 'lucide-react';
import { KinArchiveAsset } from '../../types/archive';

interface ArchiveLightboxProps {
  asset: KinArchiveAsset;
  onClose: () => void;
  onPinToArtRoom: (asset: KinArchiveAsset) => void;
}

export const ArchiveLightbox: React.FC<ArchiveLightboxProps> = ({
  asset,
  onClose,
  onPinToArtRoom,
}) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      backgroundColor: 'rgba(36, 19, 41, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'auto',
    }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        maxWidth: '680px',
        width: '100%',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-modal)',
      }}
    >
      {/* Close button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
        <button onClick={onClose} aria-label="Close" style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} color="var(--color-text-secondary)" />
        </button>
      </div>

      {/* Image */}
      <div style={{ padding: '0 24px', textAlign: 'center' }}>
        <img
          src={asset.filename}
          alt={asset.alt_text}
          className="artwork-img-blend"
          style={{
            maxWidth: '100%',
            maxHeight: '60vh',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {/* Metadata */}
      <div style={{ padding: '20px 24px 24px' }}>
        <div style={{
          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--color-secondary)', marginBottom: '6px',
        }}>
          {asset.code} · Kin Archive
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)', color: 'var(--color-primary)',
          fontSize: '1.25rem', marginBottom: '8px',
        }}>
          {asset.title}
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '12px' }}>
          {asset.description}
        </p>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          <strong>Medium:</strong> {asset.medium}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {asset.tags.map((tag) => (
            <span key={tag} className="tag-chip">{tag}</span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary double-outline-btn"
            style={{ padding: '10px 18px', fontSize: '0.88rem' }}
            onClick={() => onPinToArtRoom(asset)}
          >
            <LayoutGrid size={15} />
            <span>Pin to Art Room</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);
