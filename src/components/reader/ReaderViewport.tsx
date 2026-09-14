import React, { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { ConcentricPortal } from '../ConcentricPortal';
import { AnnotationOverlay } from './AnnotationOverlay';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { PageAnnotation } from '../../types/book';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface ReaderViewportProps {
  fileUrl: string | null;
  bookId: string;
  currentPage: number;
  zoomScale: number;
  bookTitle: string;
  annotations: PageAnnotation[];
  isAddingNote: boolean;
  onAddNoteAt: (x: number, y: number) => void;
  onUpdateAnnotation: (id: string, updates: Partial<PageAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onLoadSuccess: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  isQuietReading?: boolean;
}

export const ReaderViewport: React.FC<ReaderViewportProps> = ({
  fileUrl,
  bookId,
  currentPage,
  zoomScale,
  bookTitle,
  annotations,
  isAddingNote,
  onAddNoteAt,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onLoadSuccess,
  onLoadError,
  isQuietReading = false,
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(280, window.innerWidth - 32);
    }
    return 360;
  });

  // Measure container width and dynamically recalculate on resize and orientation change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const computed = window.getComputedStyle(container);
      const padLeft = parseFloat(computed.paddingLeft) || 0;
      const padRight = parseFloat(computed.paddingRight) || 0;
      const available = container.clientWidth - (padLeft + padRight);
      if (available > 0) {
        setContainerWidth(available);
      }
    };

    updateWidth();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateWidth();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', updateWidth);
    window.addEventListener('orientationchange', updateWidth);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('orientationchange', updateWidth);
    };
  }, []);

  // Detect if the file is an image (demo placeholder) rather than an actual PDF
  const isImagePlaceholder =
    fileUrl &&
    (fileUrl.endsWith('.jpeg') ||
      fileUrl.endsWith('.jpg') ||
      fileUrl.endsWith('.png') ||
      fileUrl.endsWith('.webp'));

  const handleDocumentSuccess = ({ numPages }: { numPages: number }) => {
    setLoadError(null);
    onLoadSuccess(numPages);
  };

  const handleDocumentError = (err: Error) => {
    console.warn('PDF load error:', err);
    setLoadError(err.message || 'Could not load PDF document.');
    if (onLoadError) onLoadError(err);
  };

  // Base fit width: fit container on mobile, max 840px on wide desktop
  const baseFitWidth = Math.min(containerWidth, 840);
  // When zoomed past 1.0, scale effective page width for sharp rendering & contained panning
  const effectivePageWidth = Math.round(baseFitWidth * zoomScale);
  const isOverflowing = effectivePageWidth > containerWidth;

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOverflowing ? 'flex-start' : 'center',
        justifyContent: 'flex-start',
        padding: '24px 16px 80px 16px',
        backgroundColor: 'var(--color-background)',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
      }}
    >
      {/* If placeholder image representation */}
      {isImagePlaceholder ? (
        <div
          style={{
            width: `${effectivePageWidth}px`,
            maxWidth: zoomScale <= 1 ? '100%' : 'none',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            padding: '20px',
            textAlign: 'center',
            position: 'relative',
            margin: isOverflowing ? '0 0 32px 0' : '0 auto 32px auto',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--color-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '12px',
            }}
          >
            {bookTitle} · Study Plate {currentPage}
          </div>
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
            <img
              src={fileUrl!}
              alt={`Page ${currentPage}`}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                display: 'block',
                margin: '0 auto',
              }}
            />
            <AnnotationOverlay
              bookId={bookId}
              pageNumber={currentPage}
              annotations={annotations}
              isAddingNote={isAddingNote}
              onAddNoteAt={onAddNoteAt}
              onUpdateAnnotation={onUpdateAnnotation}
              onDeleteAnnotation={onDeleteAnnotation}
            />
          </div>
        </div>
      ) : fileUrl ? (
        /* Real PDF Document via react-pdf */
        <div
          style={{
            width: `${effectivePageWidth}px`,
            maxWidth: zoomScale <= 1 ? '100%' : 'none',
            margin: isOverflowing ? '0 0 32px 0' : '0 auto 32px auto',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          <Document
            key={reloadKey}
            file={fileUrl}
            onLoadSuccess={handleDocumentSuccess}
            onLoadError={handleDocumentError}
            loading={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px' }}>
                <ConcentricPortal size={70} />
                <span style={{ fontSize: '0.88rem', color: 'var(--color-primary)' }}>
                  Rendering page {currentPage}...
                </span>
              </div>
            }
            error={
              <div
                style={{
                  maxWidth: '480px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '32px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-card)',
                  margin: '0 auto',
                }}
              >
                <AlertCircle size={36} color="var(--color-error)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', margin: '0 0 8px 0' }}>
                  Unable to display PDF page
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  {loadError || 'The PDF file could not be parsed. It may be password protected or corrupted.'}
                </p>
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            }
          >
            <div
              key={currentPage}
              className={`reader-reading-layer ${isQuietReading ? '' : 'page-turn-transition'}`}
              style={{
                width: '100%',
                position: 'relative',
              }}
            >
              <Page
                pageNumber={currentPage}
                width={effectivePageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <ConcentricPortal size={50} />
                  </div>
                }
              />
              {!isQuietReading && (
                <AnnotationOverlay
                  bookId={bookId}
                  pageNumber={currentPage}
                  annotations={annotations}
                  isAddingNote={isAddingNote}
                  onAddNoteAt={onAddNoteAt}
                  onUpdateAnnotation={onUpdateAnnotation}
                  onDeleteAnnotation={onDeleteAnnotation}
                />
              )}
            </div>
          </Document>
        </div>
      ) : (
        /* Empty / No file */
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
          <BookOpen size={40} style={{ opacity: 0.5, marginBottom: '12px' }} />
          <div>No PDF file provided for this book.</div>
        </div>
      )}
    </div>
  );
};
