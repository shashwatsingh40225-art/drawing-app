import React, { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { ConcentricPortal } from '../ConcentricPortal';
import { AnnotationOverlay, PendingPin } from './AnnotationOverlay';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { PageAnnotation } from '../../types/book';
import { useTapZones } from '../../hooks/useTapZones';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

/**
 * Print-formatted book PDFs bake in generous page margins (and often near-empty pages at a
 * chapter's end). Fitting such a page to the container's width, as the default reading view does,
 * leaves that same margin as dead space below the text once the page is shown full-screen in
 * immersive mode — the "why is half the screen black" gap. This scans the rendered page canvas for
 * its actual ink bounding box so immersive mode can zoom/center on just the content, "contain"-fit
 * against the available frame so no real text is ever cropped. Returns fractions of page width/height.
 */
function detectContentBBox(canvas: HTMLCanvasElement): { fx0: number; fx1: number; fy0: number; fy1: number } | null {
  try {
    const { width, height } = canvas;
    if (!width || !height) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const { data } = ctx.getImageData(0, 0, width, height);
    const at = (x: number, y: number) => (y * width + x) * 4;
    const sample = (x: number, y: number): [number, number, number] => {
      const i = at(x, y);
      return [data[i], data[i + 1], data[i + 2]];
    };
    // Sample the four corners to learn the page's own background color (not necessarily pure white).
    const corners = [sample(1, 1), sample(width - 2, 1), sample(1, height - 2), sample(width - 2, height - 2)];
    const bg = [0, 1, 2].map((c) => corners.reduce((sum, px) => sum + px[c], 0) / corners.length);
    const threshold = 20;
    const stepX = Math.max(1, Math.floor(width / 350));
    const stepY = Math.max(1, Math.floor(height / 500));
    let minX = width, maxX = -1, minY = height, maxY = -1;
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const i = at(x, y);
        if (
          Math.abs(data[i] - bg[0]) > threshold ||
          Math.abs(data[i + 1] - bg[1]) > threshold ||
          Math.abs(data[i + 2] - bg[2]) > threshold
        ) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null; // Blank page — nothing to zoom to, leave the normal fit alone.
    const padX = Math.max(stepX * 2, (maxX - minX) * 0.02);
    const padY = Math.max(stepY * 2, (maxY - minY) * 0.02);
    const fx0 = Math.max(0, (minX - padX) / width);
    const fx1 = Math.min(1, (maxX + padX) / width);
    const fy0 = Math.max(0, (minY - padY) / height);
    const fy1 = Math.min(1, (maxY + padY) / height);
    // Page is already ~full-bleed (little to no margin) — nothing meaningful to crop.
    if (fx1 - fx0 > 0.97 && fy1 - fy0 > 0.97) return null;
    // Bbox too small to trust (e.g. a lone page-number or watermark, not the body text).
    if (fx1 - fx0 < 0.08 || fy1 - fy0 < 0.08) return null;
    return { fx0, fx1, fy0, fy1 };
  } catch {
    return null; // Any failure here just falls back to the normal, un-zoomed page — never blocks reading.
  }
}

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

  // Immersive-mode content framing: once a page finishes rendering, its ink bounding box (see
  // detectContentBBox above) is used to compute a transform that zooms/centers on just the text,
  // so full-screen reading doesn't show the page's baked-in print margins as dead black space.
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [contentFrame, setContentFrame] = useState<{ scale: number; tx: number; ty: number } | null>(null);

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

  // A stale zoom/center from the previous page must never flash onto the next one.
  useEffect(() => {
    setContentFrame(null);
  }, [currentPage, isChromeHidden]);

  const handlePageRenderSuccess = () => {
    if (!isChromeHidden) return;
    const canvas = pageCanvasRef.current;
    if (!canvas) return;
    const bbox = detectContentBBox(canvas);
    if (!bbox) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || containerWidth <= 0 || containerHeight <= 0) return;
    const bboxWidthPx = (bbox.fx1 - bbox.fx0) * rect.width;
    const bboxHeightPx = (bbox.fy1 - bbox.fy0) * rect.height;
    if (bboxWidthPx <= 0 || bboxHeightPx <= 0) return;
    // "Contain" fit against the available frame: guarantees every bit of real text stays fully
    // visible (never cropped), and never shrinks below the normal fit-width render (scale >= 1).
    const scale = Math.min(1.8, Math.max(1, Math.min(containerWidth / bboxWidthPx, containerHeight / bboxHeightPx)));
    const centerX = ((bbox.fx0 + bbox.fx1) / 2) * rect.width;
    const centerY = ((bbox.fy0 + bbox.fy1) / 2) * rect.height;
    setContentFrame({
      scale,
      tx: containerWidth / 2 - scale * centerX,
      ty: containerHeight / 2 - scale * centerY,
    });
  };

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
  // Content-frame (margin-crop) zoom only applies to the real immersive reading view — never to
  // the manual fit-to-page zoom mode (which the reader chose deliberately) or the demo image path.
  const useContentFrame = isChromeHidden && !useHeightFit && !isImagePlaceholder;

  const isCompactVertical = isChromeHidden || isLandscapePhone;
  const bottomPadding = isChromeHidden ? '0px' : isCompactVertical ? '16px' : '80px';
  const topPadding = isChromeHidden ? '0px' : isLandscapePhone ? '12px' : '24px';
  const sidePadding = isChromeHidden ? '0px' : '16px';

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
        justifyContent: 'flex-start',
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
          style={
            useContentFrame
              ? {
                  // A fixed frame the size of the whole available viewport: the reading layer
                  // inside it is positioned by the computed zoom/center transform, and anything
                  // outside the frame (the cropped-out margin) is clipped rather than left blank.
                  width: `${containerWidth}px`,
                  height: `${containerHeight}px`,
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  filter: nightMode ? 'invert(0.92) hue-rotate(180deg)' : 'none',
                }
              : {
                  width: useHeightFit ? 'auto' : `${effectivePageWidth}px`,
                  maxWidth: useHeightFit || zoomScale <= 1 ? '100%' : 'none',
                  margin: isOverflowing ? '0 0 32px 0' : '0 auto 32px auto',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  filter: nightMode ? 'invert(0.92) hue-rotate(180deg)' : 'none',
                }
          }
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
              className={`reader-reading-layer page-turn-transition${isChromeHidden ? ' reader-reading-layer--immersive' : ''}`}
              style={
                useContentFrame
                  ? {
                      width: `${effectivePageWidth}px`,
                      position: 'relative',
                      transform: contentFrame
                        ? `translate(${contentFrame.tx}px, ${contentFrame.ty}px) scale(${contentFrame.scale})`
                        : undefined,
                      transformOrigin: '0 0',
                    }
                  : {
                      width: '100%',
                      position: 'relative',
                    }
              }
            >
              <Page
                pageNumber={currentPage}
                {...(useHeightFit ? { height: fitPageHeight } : { width: effectivePageWidth })}
                canvasRef={(el) => {
                  pageCanvasRef.current = el;
                }}
                onRenderSuccess={handlePageRenderSuccess}
                renderTextLayer={true}
                renderAnnotationLayer={true}
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
