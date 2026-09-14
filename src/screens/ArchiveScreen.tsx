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
import { PageTransition } from '../components/motion/PageTransition';
import { PigmentBloom } from '../components/motion/PigmentBloom';
import { ArchiveLightbox } from '../components/archive/ArchiveLightbox';

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
    <PageTransition>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
        {/* Header with ART-06 Atmosphere */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
          <div
            className="hero-atmosphere"
            style={{ backgroundImage: 'url(/artist-reference/art-06.jpeg)' }}
          />
          <PageHeader
            icon={<Archive size={16} />}
            eyebrowLabel="Kin Archive — Studio Collection"
            title="Kin Archive"
            description="Twenty first-party artworks bundled with Kin Studio. Browse, explore, and reference them in your reader and art room."
          />
        </div>

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
          {KIN_ARCHIVE_ASSETS.map((item, index) => (
            <PigmentBloom key={item.id} delay={index * 60}>
              <button
                onClick={() => setSelectedItem(item)}
                style={{
                  width: '100%',
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
                className="double-outline-card archive-card"
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
            </PigmentBloom>
          ))}
        </div>

        {/* Lightbox Overlay */}
        {selectedItem && (
          <ArchiveLightbox
            asset={selectedItem}
            onClose={() => setSelectedItem(null)}
            onPinToArtRoom={handlePinToArtRoom}
          />
        )}
      </div>
    </PageTransition>
  );
};
