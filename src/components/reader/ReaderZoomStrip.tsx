import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ReaderZoomStripProps {
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  /** "Fit Page" only means something for a fixed-size PDF page image — reflowable EPUB text has
   *  no page to fit, so the button is hidden rather than shipped as a dead control. */
  showFitPage?: boolean;
}

/**
 * Collapsible zoom strip on the right edge — reached for often enough mid-read to want faster
 * access than opening the full Tools panel, so it lives in its own slot outside that group.
 */
export const ReaderZoomStrip: React.FC<ReaderZoomStripProps> = ({ zoomScale, onZoomChange, onFitWidth, onFitPage, showFitPage = true }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {expanded && (
        <div
          className="reader-zoom-strip-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRight: 'none',
            borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
            padding: '12px 8px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(2.5, zoomScale + 0.15))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)' }}
            title="Zoom In (+)"
          >
            <ZoomIn size={16} />
          </button>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.5, zoomScale - 0.15))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)' }}
            title="Zoom Out (-)"
          >
            <ZoomOut size={16} />
          </button>
          <div style={{ width: '20px', height: '1px', backgroundColor: 'var(--color-border)', margin: '2px 0' }} />
          <button
            type="button"
            onClick={onFitWidth}
            style={{
              fontSize: '0.68rem',
              fontWeight: 500,
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            Fit Width
          </button>
          {showFitPage && (
            <button
              type="button"
              onClick={onFitPage}
              style={{
                fontSize: '0.68rem',
                fontWeight: 500,
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
              }}
            >
              Fit Page
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? 'Collapse zoom controls' : 'Expand zoom controls'}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          minHeight: '48px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRight: 'none',
          borderRadius: expanded ? '0' : 'var(--radius-lg) 0 0 var(--radius-lg)',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          boxShadow: 'var(--shadow-subtle)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {expanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  );
};
