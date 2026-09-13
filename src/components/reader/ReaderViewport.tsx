import React, { useState } from 'react';
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
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '32px 16px 80px 16px',
        backgroundColor: 'var(--color-background)',
      }}
    >
      {/* If placeholder image representation */}
      {isImagePlaceholder ? (
        <div
          style={{
            maxWidth: '840px',
            width: '100%',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            padding: '24px',
            textAlign: 'center',
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top center',
            transition: 'transform 120ms ease-out',
            position: 'relative',
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
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top center',
            transition: 'transform 120ms ease-out',
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
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 8px 30px rgba(35, 23, 16, 0.15)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Page
                pageNumber={currentPage}
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
                isAddingNote={isAddingNote}
                onAddNoteAt={onAddNoteAt}
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
