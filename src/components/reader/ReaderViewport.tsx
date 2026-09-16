import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, DocumentProps } from 'react-pdf';
import { ConcentricPortal } from '../ConcentricPortal';
import { AnnotationOverlay, PendingPin } from './AnnotationOverlay';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { PageAnnotation } from '../../types/book';
import { useTapZones } from '../../hooks/useTapZones';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// iPadOS's WebKit (this affects Chrome-on-iOS too, since Apple forces every iOS browser onto
// WebKit) has a long-standing bug where a cross-origin range/streamed fetch of a PDF from an S3
// -style signed URL (our Supabase storage links) silently stalls or aborts, even though the exact
// same request works on desktop and Android Chromium. Our books are capped at 25MB, so trading the
// streaming/range fetch for one plain full-body download avoids that WebKit quirk entirely with no
// real downside. Declared outside the component so its identity is stable across renders — react-pdf
// reloads the document whenever this object's reference changes.
const PDF_LOAD_OPTIONS: DocumentProps['options'] = {
  disableStream: true,
  disableAutoFetch: true,
  disableRange: true,
};

interface ReaderViewportProps {
  fileUrl: string | null;
  bookId: string;
  currentPage: number;
  zoomScale: number;
  bookTitle: string;
  annotations: PageAnnotation[];
  pendingPin: PendingPin | null;
  onPlacePin: (x: number, y: number) => void;
  onUpdateAnnotation: (id: string, updates: Partial<PageAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onLoadSuccess: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  isChromeHidden?: boolean;
  /** Scale the page to fill the available height instead of the available width. */
  fitToPage?: boolean;
  /** Inverts page luminance for low-light reading; the page content itself isn't recolored. */
  nightMode?: boolean;
  /** Zone-based tap navigation (decision 2): left third = previous, right third = next, center = chrome toggle. */
  onLeftTap: () => void;
  onCenterTap: () => void;
  onRightTap: () => void;
}

export const ReaderViewport: React.FC<ReaderViewportProps> = ({
  fileUrl,
  bookId,
  currentPage,
  zoomScale,
  bookTitle,
  annotations,
  pendingPin,
  onPlacePin,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onLoadSuccess,
  onLoadError,
  isChromeHidden = false,
  fitToPage = false,
  nightMode = false,
  onLeftTap,
  onCenterTap,
  onRightTap,
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const tapZoneHandlers = useTapZones({ onLeftTap, onCenterTap, onRightTap });

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(280, window.innerWidth - 32);
    }
    return 360;
  });
  const [containerHeight, setContainerHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(280, window.innerHeight - 120);
    }
    return 600;
  });
  const [isLandscapePhone, setIsLandscapePhone] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.innerHeight <= 500
  );

  // Measure container size and dynamically recalculate on resize and orientation change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setIsLandscapePhone(typeof window !== 'undefined' && window.innerHeight <= 500);
      const computed = window.getComputedStyle(container);
      const padLeft = parseFloat(computed.paddingLeft) || 0;
      const padRight = parseFloat(computed.paddingRight) || 0;
      const padTop = parseFloat(computed.paddingTop) || 0;
      const padBottom = parseFloat(computed.paddingBottom) || 0;
      const availableWidth = container.clientWidth - (padLeft + padRight);
      const availableHeight = container.clientHeight - (padTop + padBottom);
      if (availableWidth > 0) {
        setContainerWidth(availableWidth);
      }
      if (availableHeight > 0) {
        setContainerHeight(availableHeight);
      }
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
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
  // Fit-to-page scales by available height instead, letting the page find its own width.
  const useHeightFit = fitToPage && !isImagePlaceholder;
  const fitPageHeight = Math.max(200, Math.round(containerHeight));
  const isOverflowing = !useHeightFit && effectivePageWidth > containerWidth;

  const isCompactVertical = isChromeHidden || isLandscapePhone;
  const bottomPadding = isChromeHidden ? '10px' : isCompactVertical ? '16px' : '80px';
  const topPadding = isChromeHidden ? '10px' : isLandscapePhone ? '12px' : '24px';
  const sidePadding = isChromeHidden ? '10px' : '16px';

  return (
    <div
      ref={containerRef}
      onPointerDown={tapZoneHandlers.onPointerDown}
      onPointerUp={tapZoneHandlers.onPointerUp}
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
        // Immersive reading centers the page vertically instead of pinning it to the top, so any
        // margin a print-formatted PDF bakes in is split evenly above/below rather than dumped
        // entirely below the text (the "misaligned" look). A page taller than the viewport still
        // scrolls normally either way.
        justifyContent: isChromeHidden ? 'center' : 'flex-start',
        padding: `${topPadding} ${sidePadding} ${bottomPadding} ${sidePadding}`,
        backgroundColor: nightMode ? '#18181a' : 'var(--color-background)',
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
            filter: nightMode ? 'invert(0.92) hue-rotate(180deg)' : 'none',
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
              pendingPin={pendingPin}
              onPlacePin={onPlacePin}
              onUpdateAnnotation={onUpdateAnnotation}
              onDeleteAnnotation={onDeleteAnnotation}
            />
          </div>
        </div>
      ) : fileUrl ? (
        /* Real PDF Document via react-pdf */
        <div
          style={{
            width: useHeightFit ? 'auto' : `${effectivePageWidth}px`,
            maxWidth: useHeightFit || zoomScale <= 1 ? '100%' : 'none',
            margin: isOverflowing ? '0 0 32px 0' : `0 auto ${isChromeHidden ? '0' : '32px'} auto`,
            flexShrink: 0,
            boxSizing: 'border-box',
            filter: nightMode ? 'invert(0.92) hue-rotate(180deg)' : 'none',
          }}
        >
          <Document
            key={reloadKey}
            file={fileUrl}
            options={PDF_LOAD_OPTIONS}
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
              className={`reader-reading-layer page-turn-transition${isChromeHidden ? ' reader-reading-layer--immersive' : ''}`}
              style={{
                width: '100%',
                position: 'relative',
              }}
            >
              <Page
                pageNumber={currentPage}
                {...(useHeightFit ? { height: fitPageHeight } : { width: effectivePageWidth })}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                // iPad Safari/WebKit throws inside pdf.js's getTextContent() for some PDFs (a
                // WebKit-specific bug, not something we can fix on our end). react-pdf's default
                // "suspense" mode treats that as fatal and rethrows it into the nearest React error
                // boundary, crashing the whole reader. With suspense off, the same failure just
                // logs a console warning and that page renders without selectable text — the page
                // itself (the part that actually matters for reading) still shows up fine.
                suspense={false}
                onGetTextError={(error) => console.warn('Text layer unavailable for this page:', error)}
                onRenderTextLayerError={(error) => console.warn('Text layer render failed for this page:', error)}
                loading={
                  <div style={{ padding: '60px', textAlign: 'center' }}>
                    <ConcentricPortal size={50} />
                  </div>
                }
              />
              <AnnotationOverlay
                bookId={bookId}
                pageNumber={currentPage}
                annotations={annotations}
                pendingPin={pendingPin}
                onPlacePin={onPlacePin}
                onUpdateAnnotation={onUpdateAnnotation}
                onDeleteAnnotation={onDeleteAnnotation}
              />
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
