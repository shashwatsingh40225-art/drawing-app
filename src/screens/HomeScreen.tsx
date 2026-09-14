import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UploadCloud, 
  ArrowRight, 
  Palette, 
  Star, 
  Folder,
  Library,
  Archive,
  BookOpen,
} from 'lucide-react';
import { FeatherDivider } from '../components/FeatherDivider';
import { useArtworkStore } from '../stores/artworkStore';
import { useAuthStore } from '../stores/authStore';
import { useCollectionStore } from '../stores/collectionStore';
import { ArtworkCard } from '../components/sketchbook/ArtworkCard';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { PageTransition } from '../components/motion/PageTransition';

interface HomeScreenProps {
  onStartUpload?: () => void;
  onExploreArchive?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartUpload,
  onExploreArchive,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { artworks, fetchArtworks } = useArtworkStore();
  const { collections, fetchCollections } = useCollectionStore();

  useEffect(() => {
    fetchArtworks();
    fetchCollections();
  }, [fetchArtworks, fetchCollections]);

  const handleUploadClick = () => {
    if (onStartUpload) {
      onStartUpload();
    } else {
      navigate('/upload');
    }
  };

  const handleExploreClick = () => {
    if (onExploreArchive) {
      onExploreArchive();
    } else {
      navigate('/my-art');
    }
  };

  // -------------------------------------------------------------
  // Logged-in User Dashboard (when authenticated)
  // -------------------------------------------------------------
  if (user) {
    const favoritesCount = artworks.filter((a) => a.is_favorite).length;
    const recentWork = artworks.slice(0, 6);

    if (artworks.length === 0) {
      return (
        <PageTransition>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
            <PageHeader
              icon={<Palette size={16} />}
              eyebrowLabel="Studio Dashboard"
              title="Welcome to your studio"
              description="Your personal sketchbook is ready for your drawings, studies, and creature folios."
              action={
                <button
                  onClick={handleUploadClick}
                  className="btn-primary double-outline-btn"
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <UploadCloud size={16} />
                  <span>Upload First Drawing</span>
                </button>
              }
            />
            <EmptyState
              artworkSrc="/artist-reference/art-01.jpeg"
              headline="Your sketchbook is waiting"
              description="Upload your first drawing to start tracking your artistic journey, tags, and discovering kindred art."
              actionLabel="Upload First Drawing"
              onAction={handleUploadClick}
            />
          </div>
        </PageTransition>
      );
    }

    return (
      <PageTransition>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
        {/* Studio Dashboard Header */}
        <PageHeader
          icon={<Palette size={16} />}
          eyebrowLabel="Studio Dashboard"
          title="Welcome back to your studio"
          description="Your creative workspace, recent folios, and sketchbook collections at a glance."
          action={
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleUploadClick}
                className="btn-primary double-outline-btn"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <UploadCloud size={16} />
                <span>Upload New Drawing</span>
              </button>
              <button
                onClick={handleExploreClick}
                className="double-outline-btn"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <Palette size={16} />
                <span>Browse My Art</span>
              </button>
            </div>
          }
        />

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '36px',
          }}
        >
          {/* Stat 1: Total Artworks */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(58, 33, 64, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <Palette size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.1 }}>
                {artworks.length}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Total Drawings
              </div>
            </div>
          </div>

          {/* Stat 2: Starred Favorites */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(214, 51, 122, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
              }}
            >
              <Star size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.1 }}>
                {favoritesCount}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Starred Favorites
              </div>
            </div>
          </div>

          {/* Stat 3: Sketchbook Collections */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(180, 83, 31, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-secondary)',
              }}
            >
              <Folder size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary)', lineHeight: 1.1 }}>
                {collections.length}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Collections
              </div>
            </div>
          </div>
        </div>

        {/* Recent Work Grid */}
        <section style={{ marginBottom: '48px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={20} color="var(--color-accent)" />
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  margin: 0,
                }}
              >
                Recent Work
              </h2>
            </div>

            <Link
              to="/my-art"
              className="double-outline-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span>View All Drawings ({artworks.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div
            className="sketchbook-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '24px',
            }}
          >
            {recentWork.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        </section>

        <div style={{ marginBottom: '48px' }}>
          <FeatherDivider />
        </div>

        {/* Quick Access Cards */}
        <section>
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                margin: '0 0 8px 0',
              }}
            >
              Quick Access
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Jump to your library, the Kin Archive, or start a new upload.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            <Link
              to="/library"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'transform 150ms ease',
              }}
              className="double-outline-card"
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(58, 33, 64, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Library size={24} color="var(--color-primary)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '2px' }}>My Library</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Upload and read PDF books</div>
              </div>
              <ArrowRight size={16} color="var(--color-accent)" style={{ marginLeft: 'auto' }} />
            </Link>

            <Link
              to="/archive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'transform 150ms ease',
              }}
              className="double-outline-card"
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(180, 83, 31, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Archive size={24} color="var(--color-secondary)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '2px' }}>Kin Archive</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Browse 20 studio artworks</div>
              </div>
              <ArrowRight size={16} color="var(--color-accent)" style={{ marginLeft: 'auto' }} />
            </Link>

            <button
              onClick={handleUploadClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'transform 150ms ease',
              }}
              className="double-outline-card"
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(214, 51, 122, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UploadCloud size={24} color="var(--color-accent)" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '2px' }}>Upload Drawing</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Add new artwork to My Art</div>
              </div>
              <ArrowRight size={16} color="var(--color-accent)" style={{ marginLeft: 'auto' }} />
            </button>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

  // -------------------------------------------------------------
  // Unauthenticated Visitors Landing Page (Unchanged)
  // -------------------------------------------------------------
  return (
    <PageTransition>
      <div style={{ paddingBottom: '80px' }}>
        {/* Hero Section */}
        <section 
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '48px 24px 64px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: '48px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            className="hero-atmosphere"
            style={{ backgroundImage: 'url(/artist-reference/art-03.jpeg)' }}
          />
          {/* Left Column: Headline & Value Proposition */}
          <div style={{ maxWidth: '580px' }}>
          {/* Eyebrow badge */}
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(180, 83, 31, 0.1)',
              border: '1px solid rgba(180, 83, 31, 0.25)',
              color: 'var(--color-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '20px'
            }}
          >
            <BookOpen size={14} />
            <span>Private Art Studio</span>
          </div>

          {/* Primary Headline */}
          <h1 
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
              lineHeight: 1.12,
              marginBottom: '20px',
              color: 'var(--color-primary)',
            }}
          >
            Your private art home.
          </h1>

          {/* Subheadline */}
          <p 
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              marginBottom: '36px',
            }}
          >
            Collect and revisit your drawings. Upload and read art-reference PDFs. Organise everything with tags, notes, and collections — all private, all yours.
          </p>

          {/* Primary CTA */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={handleUploadClick}
              className="btn-accent double-outline-btn"
              style={{ padding: '14px 30px', fontSize: '1.05rem' }}
            >
              <UploadCloud size={20} />
              <span>Upload a Drawing</span>
            </button>

            <button
              onClick={handleExploreClick}
              className="btn-secondary"
              style={{ padding: '13px 24px', fontSize: '0.98rem' }}
            >
              <Palette size={18} />
              <span>Browse My Art</span>
            </button>
          </div>

          {/* Micro Trust / Note */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '28px',
              fontSize: '0.82rem',
              color: 'var(--color-text-muted)'
            }}
          >
            <BookOpen size={15} color="var(--color-secondary)" />
            <span>Private by default. Works with pencil, ink, markers, and digital studies.</span>
          </div>
        </div>

        {/* Right Column: Hero Artwork Display with Ruled Paper Backdrop Strip */}
        <div 
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Subtle Ruled Paper Strip Backdrop */}
          <div 
            className="ruled-paper-strip"
            style={{
              position: 'absolute',
              width: '108%',
              height: '92%',
              backgroundColor: 'rgba(251, 247, 238, 0.7)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              transform: 'rotate(-2deg)',
              zIndex: 0,
            }}
          />

          {/* Second offset accent frame referencing the double-line habit */}
          <div 
            style={{
              position: 'absolute',
              width: '104%',
              height: '90%',
              border: '1.5px dashed rgba(214, 51, 122, 0.35)',
              borderRadius: 'var(--radius-xl)',
              transform: 'rotate(1.5deg)',
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />

          {/* Main Hero Card displaying ART-03 */}
          <div 
            style={{
              position: 'relative',
              zIndex: 1,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div 
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#FAF5EC',
                border: '1px solid rgba(222, 210, 188, 0.6)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
              }}
            >
              <img 
                src="/artist-reference/art-03.jpeg" 
                alt="ART-03: Winged pink creature in flight with detached eye orb"
                className="artwork-img-blend"
                style={{
                  maxHeight: '420px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Artwork Attribution Label */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  Winged Creature with Spiked Eye Orb
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  ART-03 · Felt-tip ink on notebook paper
                </div>
              </div>
              <span className="match-badge high">
                Master Motif
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Tapering Feather Divider */}
      <FeatherDivider />

      {/* Feature Highlights Section */}
      <section 
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '24px 24px 56px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Two studios in one</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
            Kin is a quiet companion for the working artist — no social features, no algorithms, no ads.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <Link to="/my-art" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="double-outline-card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', height: '100%' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(58,33,64,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Palette size={28} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>Personal Art Collection</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }}>Upload drawings, paintings, and studies. Tag by medium, add notes and dates, organise into collections, and mark favourites. Your whole creative output, searchable and yours alone.</p>
            </div>
          </Link>
          <Link to="/library" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="double-outline-card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', height: '100%' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(180,83,31,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Library size={28} color="var(--color-secondary)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>Private PDF Reader</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }}>Upload art-reference books, exhibition catalogues, tutorials, and scanned sketchbooks. Read them in Kin with bookmarks, page notes, and a distraction-free reading mode.</p>
            </div>
          </Link>
          <Link to="/archive" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="double-outline-card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', height: '100%' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(214,51,122,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Archive size={28} color="var(--color-accent)" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>Kin Archive</h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0 }}>Twenty first-party artworks bundled with Kin Studio — ink studies, creatures, and investigations. Reference them while reading or pin them to your Art Room board.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  </PageTransition>
);
};
