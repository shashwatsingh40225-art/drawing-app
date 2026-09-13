import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, LayoutGrid } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { ArtworkMat } from '../components/ui/ArtworkMat';
import { Badge } from '../components/ui/Badge';
import { KIN_ARCHIVE_ASSETS } from '../data/kinArchive';
import { KinArchiveAsset } from '../types/archive';
import { useArtRoomStore } from '../stores/artRoomStore';
import { useToastStore } from '../stores/toastStore';

export const ArchiveScreen: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<KinArchiveAsset | null>(null);
  const { addItem: addArtRoomItem } = useArtRoomStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const handlePinToArtRoom = async (item: KinArchiveAsset) => {
    await addArtRoomItem({
      type: 'archive_ref',
      ref_archive_asset_id: item.id,
      title: item.title,
      thumbnail_url: item.filename,
      x_percent: 38 + Math.floor(Math.random() * 8),
      y_percent: 35 + Math.floor(Math.random() * 8),
      width_percent: 24,
      height_percent: 28,
      rotation_degrees: Math.floor(Math.random() * 7) - 3,
      z_index: 1,
    });

    showToast({
      type: 'success',
      message: `"${item.title}" pinned to Art Room!`,
      action: {
        label: 'Open Art Room',
        onClick: () => navigate('/art-room'),
      },
    });
    setSelectedItem(null);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
      <PageHeader
        icon={<Archive size={16} />}
        eyebrowLabel="Kin Archive — Studio Collection"
        title="Kin Archive"
        description="Twenty first-party artworks bundled with Kin Studio. Browse, explore, and reference them in your reader and art room."
      />

      {/* Label clarification */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 18px',
          backgroundColor: 'rgba(58, 33, 64, 0.05)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '32px',
        }}
      >
        <Archive size={15} color="var(--color-secondary)" />
        <span>
          These are <strong>bundled first-party artworks</strong> created for Kin Studio — not search results or content discovered from external sources.
        </span>
      </div>

      {/* Archive Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '24px',
        }}
      >
        {KIN_ARCHIVE_ASSETS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-subtle)',
              transition: 'transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 150ms ease',
              textAlign: 'left',
              padding: 0,
            }}
            className="double-outline-card"
            aria-label={`View archive item: ${item.title}`}
          >
            <div style={{ padding: '12px 12px 0 12px' }}>
              <ArtworkMat
                imageUrl={item.filename}
                alt={item.title}
                aspectRatio="1 / 1"
                padding="10px"
                maxHeight="240px"
              />
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--color-secondary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {item.code} · Kin Archive
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {item.medium}
              </p>
              {item.role && <Badge label={item.role} variant="muted" />}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(35, 23, 16, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-heavy)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {selectedItem.code} · Kin Archive — Studio Collection
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  padding: '4px',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                }}
                aria-label="Close detail"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              <ArtworkMat
                imageUrl={selectedItem.filename}
                alt={selectedItem.title}
                aspectRatio="1 / 1"
                padding="12px"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      margin: '0 0 8px 0',
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedItem.title}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {selectedItem.medium}
                  </p>
                </div>
                {selectedItem.role && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Role in Studio</div>
                    <Badge label={selectedItem.role} variant="secondary" />
                  </div>
                )}
                {selectedItem.description && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Description</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {selectedItem.description}
                    </p>
                  </div>
                )}
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Tags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedItem.tags.map((tag) => (
                        <Badge key={tag} label={`#${tag}`} variant="muted" />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Rights</div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>First-party Kin Studio asset</span>
                </div>

                <div style={{ marginTop: '6px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <button
                    type="button"
                    onClick={() => handlePinToArtRoom(selectedItem)}
                    className="btn-primary double-outline-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      fontSize: '0.9rem',
                      width: '100%',
                    }}
                  >
                    <LayoutGrid size={16} />
                    <span>Pin to Art Room</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
