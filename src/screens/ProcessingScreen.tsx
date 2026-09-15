import React, { useEffect, useState } from 'react';
import { ConcentricPortal } from '../components/ConcentricPortal';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ProcessingScreenProps {
  uploadedDrawing: { url: string; title: string };
  onComplete: () => void;
}

const STATUS_MESSAGES = [
  'Reading your contour lines…',
  'Analyzing line pressure & tapering limbs…',
  'Recognizing anatomical hybridity…',
  'Searching museum archives & artist folios for kin…',
  'Kindred artworks found.',
];

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  uploadedDrawing,
  onComplete,
}) => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);

    return () => {
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div 
      className="screen-dark-processing fade-in"
      style={{
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      {/* Background Chalk Silhouette Echo (ART-07 / ART-08) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('/brand/illustrations/art-07-card.png')`,
          backgroundPosition: 'center 40%',
          backgroundSize: 'cover',
          opacity: 0.08,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          filter: 'blur(2px)',
        }}
      />

      {/* Floating secondary atmospheric sketch (ART-08 arm/torso gesture) */}
      <div
        style={{
          position: 'absolute',
          right: '5%',
          bottom: '5%',
          width: '320px',
          height: '320px',
          backgroundImage: `url('/brand/illustrations/art-08-card.png')`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          opacity: 0.06,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Ring texture backdrop — tileable pattern, meant for a portal/loading surface */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('/brand/pattern-rings.png')`,
          backgroundSize: '340px',
          backgroundRepeat: 'repeat',
          opacity: 0.07,
          pointerEvents: 'none',
        }}
      />

      {/* Centered Processing Container */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '560px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Source Drawing Thumbnail with chalk mat border */}
        <div 
          style={{
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(58, 33, 64, 0.6)',
            border: '1px solid rgba(245, 239, 230, 0.25)',
          }}
        >
          <img 
            src={uploadedDrawing.url} 
            alt={uploadedDrawing.title}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--color-accent)',
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(245, 239, 230, 0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Examining Sketch
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-on-dark)' }}>
              {uploadedDrawing.title}
            </div>
          </div>
        </div>

        {/* ART-12 Concentric Discs Portal Animation */}
        <div style={{ height: '220px', width: '220px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ConcentricPortal size={210} />
        </div>

        {/* Dynamic Status Copy */}
        <div style={{ minHeight: '76px', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div 
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.55rem',
              fontWeight: 500,
              color: 'var(--color-text-on-dark)',
              marginBottom: '6px',
              letterSpacing: '-0.01em',
              transition: 'opacity 200ms ease',
            }}
          >
            {STATUS_MESSAGES[statusIndex]}
          </div>

          <div 
            style={{
              fontSize: '0.88rem',
              color: 'rgba(245, 239, 230, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color="var(--color-accent)" />
            <span>Scanning 4,800+ archival drawings and folios</span>
          </div>
        </div>

        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '36px' }}>
          {STATUS_MESSAGES.map((_, i) => (
            <div 
              key={i}
              style={{
                width: i === statusIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: i <= statusIndex ? 'var(--color-accent)' : 'rgba(245, 239, 230, 0.2)',
                transition: 'all 240ms ease',
              }}
            />
          ))}
        </div>

        {/* Action to view results */}
        <button
          onClick={onComplete}
          className="btn-accent double-outline-btn"
          style={{
            padding: '14px 32px',
            fontSize: '1rem',
            marginTop: '12px',
            cursor: 'pointer',
          }}
        >
          <Sparkles size={18} />
          <span>View 8 Kindred Artworks</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
