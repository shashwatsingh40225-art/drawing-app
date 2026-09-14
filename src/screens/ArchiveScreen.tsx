import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, LayoutGrid, Sparkles, Filter } from 'lucide-react';
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
import { worlds, motionTiming } from '../styles/tokens';

const CATEGORIES = [
  { id: 'all', label: 'All Works' },
  { id: 'characters', label: 'Avian & Characters' },
  { id: 'ink', label: 'Ink Studies' },
  { id: 'vibrant', label: 'Color & Marker' },
  { id: 'vision', label: 'Ritual & Orbs' },
];

export const ArchiveScreen: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<KinArchiveAsset | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [bloomingItemId, setBloomingItemId] = useState<string | null>(null);

  const { addItem: addArtRoomItem } = useArtRoomStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const world = worlds.magentaCreature;

  const handleSelectCard = (item: KinArchiveAsset) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSelectedItem(item);
      return;
    }
    setBloomingItemId(item.id);
    setTimeout(() => {
      setSelectedItem(item);
      setBloomingItemId(null);
    }, 180);
  };

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

  const filteredAssets = KIN_ARCHIVE_ASSETS.filter((item) => {
    if (activeCategory === 'all') return true;
    const text = `${item.title} ${item.medium} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase();
    if (activeCategory === 'characters') {
      return (
        text.includes('bird') ||
        text.includes('crane') ||
        text.includes('lemur') ||
        text.includes('creature') ||
        text.includes('figure') ||
        text.includes('whimsical')
      );
    }
    if (activeCategory === 'ink') {
      return (
        text.includes('ink') ||
        text.includes('pen') ||
        text.includes('cross-hatch') ||
        text.includes('sepia') ||
        text.includes('monochrome')
      );
    }
    if (activeCategory === 'vibrant') {
      return (
        text.includes('marker') ||
        text.includes('magenta') ||
        text.includes('color') ||
        text.includes('flame') ||
        text.includes('chromatic') ||
        text.includes('orange') ||
        text.includes('blue')
      );
    }
    if (activeCategory === 'vision') {
      return (
        text.includes('eye') ||
        text.includes('orb') ||
        text.includes('mask') ||
        text.includes('ritual') ||
        text.includes('vision') ||
        text.includes('iris')
      );
    }
    return true;
  });

  return (
    <PageTransition>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '36px 20px 96px 20px',
          '--world-accent': world.accent,
          '--world-secondary-accent': world.secondaryAccent,
          '--world-border': world.border,
        } as React.CSSProperties}
      >
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

        {/* Categories and Label Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '12px 16px',
              backgroundColor: world.surface,
              border: `1px solid ${world.border}`,
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: world.textMuted, marginRight: '4px' }}>
              <Filter size={14} />
              <span style={{ fontWeight: 600 }}>Filter:</span>
            </div>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count = cat.id === 'all' ? KIN_ARCHIVE_ASSETS.length : KIN_ARCHIVE_ASSETS.filter((item) => {
                const text = `${item.title} ${item.medium} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase();
                if (cat.id === 'characters') return text.includes('bird') || text.includes('crane') || text.includes('lemur') || text.includes('creature') || text.includes('figure') || text.includes('whimsical');
                if (cat.id === 'ink') return text.includes('ink') || text.includes('pen') || text.includes('cross-hatch') || text.includes('sepia') || text.includes('monochrome');
                if (cat.id === 'vibrant') return text.includes('marker') || text.includes('magenta') || text.includes('color') || text.includes('flame') || text.includes('chromatic') || text.includes('orange') || text.includes('blue');
                if (cat.id === 'vision') return text.includes('eye') || text.includes('orb') || text.includes('mask') || text.includes('ritual') || text.includes('vision') || text.includes('iris');
                return true;
              }).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? world.accent : world.border}`,
                    backgroundColor: isActive ? world.accent : 'rgba(255, 45, 149, 0.05)',
                    color: isActive ? '#FFFFFF' : world.textSecondary,
                    boxShadow: isActive ? '0 2px 8px rgba(255, 45, 149, 0.25)' : 'none',
                    transition: 'all 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      opacity: isActive ? 0.9 : 0.65,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(107, 79, 94, 0.12)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bundled clarification badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              backgroundColor: 'rgba(58, 33, 64, 0.04)',
              border: `1px solid ${world.borderSubtle}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              color: world.textSecondary,
            }}
          >
            <Sparkles size={14} color={world.accent} />
            <span>
              <strong>Bundled first-party artworks</strong> created for Kin Studio — explore, view details, or pin directly to your Art Room.
            </span>
          </div>
        </div>

        {/* Archive Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredAssets.map((item, index) => (
            <PigmentBloom key={item.id} delay={Math.min(index * 30, 300)}>
              <button
                onClick={() => handleSelectCard(item)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: `1.5px solid ${world.border}`,
                  borderRadius: 'var(--radius-xl)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: world.surface,
                  boxShadow: 'var(--shadow-subtle)',
                  transition: 'transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1), box-shadow 150ms ease, border-color 150ms ease',
                  textAlign: 'left',
                  padding: 0,
                }}
                className={`double-outline-card archive-card ${bloomingItemId === item.id ? 'pigment-bloom-active' : ''}`}
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
                <div
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    flex: 1,
                    backgroundColor: world.surfaceElevated,
                    borderTop: `1px solid ${world.borderSubtle}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: world.accent,
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
                      fontWeight: 700,
                      color: world.textPrimary,
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: world.textSecondary,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.medium}
                  </p>
                  {item.role && <Badge label={item.role} variant="secondary" />}
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
