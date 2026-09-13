import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UploadCloud, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  Eye, 
  Palette, 
  Star, 
  Folder 
} from 'lucide-react';
import { SAMPLE_USER_DRAWINGS } from '../data/artworks';
import { FeatherDivider } from '../components/FeatherDivider';
import { useArtworkStore } from '../stores/artworkStore';
import { useAuthStore } from '../stores/authStore';
import { useCollectionStore } from '../stores/collectionStore';
import { ArtworkCard } from '../components/sketchbook/ArtworkCard';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

interface HomeScreenProps {
  onStartUpload?: () => void;
  onSelectSample?: (sample: typeof SAMPLE_USER_DRAWINGS[0]) => void;
  onExploreArchive?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartUpload,
  onSelectSample,
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
      navigate('/sketchbook');
    }
  };

  const handleSampleClick = (sample: typeof SAMPLE_USER_DRAWINGS[0]) => {
    if (onSelectSample) {
      onSelectSample(sample);
    } else {
      navigate('/discover');
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
        <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
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
      );
    }

    return (
      <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
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
                <Compass size={16} />
                <span>Browse Sketchbook</span>
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
              to="/sketchbook"
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

        {/* Quick Discovery Presets on Dashboard */}
        <section>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>
              Try Kinship Discovery
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', maxWidth: '580px', margin: '0 auto' }}>
              Select a sketchbook drawing to trace line contours, hybrid traits, and chromatic registers against historical folios.
            </p>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            {SAMPLE_USER_DRAWINGS.slice(0, 4).map((sample) => (
              <div 
                key={sample.id}
                onClick={() => handleSampleClick(sample)}
                className="art-card double-outline-card"
                style={{
                  cursor: 'pointer',
                  padding: '14px',
                }}
              >
                <div 
                  style={{
                    backgroundColor: '#FAF5EC',
                    borderRadius: 'var(--radius-sm)',
                    height: '170px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid rgba(222, 210, 188, 0.6)',
                    marginBottom: '12px',
                  }}
                >
                  <img 
                    src={sample.image} 
                    alt={sample.title} 
                    className="artwork-img-blend"
                    style={{
                      maxHeight: '150px',
                      width: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                <h3 style={{ fontSize: '0.92rem', marginBottom: '4px' }}>
                  {sample.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  {sample.subtitle}
                </p>

                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--color-accent)',
                  }}
                >
                  <span>Find Kin</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Unauthenticated Visitors Landing Page (Unchanged)
  // -------------------------------------------------------------
  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
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
        }}
      >
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
            <Sparkles size={14} />
            <span>Artistic Kinship Engine</span>
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
            Every drawing has kin.
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
            Upload your sketch, ink study, or creature design. Our visual discovery engine traces line contours, anatomical hybridity, and color echoes to reveal kindred artworks across online archives.
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
              <Compass size={18} />
              <span>Browse Studio Kin</span>
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
            <Eye size={15} color="var(--color-secondary)" />
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

      {/* Quick Try Presets Section */}
      <section 
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '24px 24px 56px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
            Try With a Sketchbook Drawing
          </h2>
          <p style={{ fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
            Click any original drawing to experience how the similarity engine processes contours, textures, and anatomical kinship in real-time.
          </p>
        </div>

        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}
        >
          {SAMPLE_USER_DRAWINGS.map((sample) => (
            <div 
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              className="art-card double-outline-card"
              style={{
                cursor: 'pointer',
                padding: '14px',
              }}
            >
              <div 
                style={{
                  backgroundColor: '#FAF5EC',
                  borderRadius: 'var(--radius-sm)',
                  height: '190px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid rgba(222, 210, 188, 0.6)',
                  marginBottom: '12px',
                }}
              >
                <img 
                  src={sample.image} 
                  alt={sample.title} 
                  className="artwork-img-blend"
                  style={{
                    maxHeight: '170px',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <h3 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                {sample.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                {sample.subtitle}
              </p>

              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                }}
              >
                <span>Find Kin</span>
                <ArrowRight size={13} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Thematic Pillars: How Kin Recognizes Artistry */}
      <section 
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          padding: '60px 24px',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '8px' }}>
              Four Dimensions of Artistic Kinship
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
              Unlike generic keyword or tag matchers, Kin analyzes the structural language of the hand.
            </p>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '28px',
            }}
          >
            {/* Dimension 1 */}
            <div 
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
              }}
            >
              <div 
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: 'var(--color-primary)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ color: 'var(--color-secondary)' }}>01.</span>
                <span>Contour & Line Weight</span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                Measures pen pressure, tapering beaks, attenuated limbs, and directional cross-hatching to find pieces with matching rhythmic velocity.
              </p>
            </div>

            {/* Dimension 2 */}
            <div 
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
              }}
            >
              <div 
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: 'var(--color-primary)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ color: 'var(--color-accent)' }}>02.</span>
                <span>Hybrid Anatomy</span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                Identifies chimerical traits: avian beaks on anthropomorphic torsos, insectoid wings, wheels, and detached ocular orbs.
              </p>
            </div>

            {/* Dimension 3 */}
            <div 
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
              }}
            >
              <div 
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: 'var(--color-primary)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ color: 'var(--color-accent-teal)' }}>03.</span>
                <span>Chromatic Register</span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                Recognizes the artist's double-outline offset habit, matching saturated magenta, rust, and emerald jewel tones against warm grounds.
              </p>
            </div>

            {/* Dimension 4 */}
            <div 
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
              }}
            >
              <div 
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: 'var(--color-primary)',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ color: 'var(--color-warning)' }}>04.</span>
                <span>Material Ground</span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                Respects the physical medium: ruled ledger paper, ink bleed, vellum tooth, and inverted chalk-on-dark atmospheres.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
