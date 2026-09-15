import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bookmark as BookmarkIcon,
  LayoutGrid,
  BookmarkCheck,
  Maximize,
  StickyNote,
  Archive,
  MoreHorizontal,
  BookOpen,
  X,
  Sparkles,
} from 'lucide-react';

interface ReaderToolbarProps {
  bookTitle: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
  zoomScale: number;
  isBookmarked: boolean;
  isFocusMode: boolean;
  isAddingNote?: boolean;
  hasUnreadRecap?: boolean;
  activeSidebar: 'thumbnails' | 'bookmarks' | 'notes' | 'archive' | 'recap' | null;
  onPageChange: (page: number) => void;
  onZoomChange: (scale: number) => void;
  onToggleBookmark: () => void;
  onToggleAddNote?: () => void;
  onToggleFocusMode: () => void;
  onToggleSidebar: (sidebar: 'thumbnails' | 'bookmarks' | 'notes' | 'archive' | 'recap') => void;
  onFitWidth?: () => void;
  onFitPage?: () => void;
  isQuietReading?: boolean;
  onToggleQuietReading?: () => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  bookTitle,
  bookId,
  currentPage,
  totalPages,
  zoomScale,
  isBookmarked,
  isFocusMode,
  isAddingNote,
  hasUnreadRecap = false,
  activeSidebar,
  onPageChange,
  onZoomChange,
  onToggleBookmark,
  onToggleAddNote,
  onToggleFocusMode,
  onToggleSidebar,
  onFitWidth,
  onFitPage,
  isQuietReading = false,
  onToggleQuietReading,
}) => {
  const navigate = useNavigate();
  const checkIsMobile = () =>
    typeof window !== 'undefined' && (window.innerWidth <= 768 || window.innerHeight <= 500);

  const [isMobile, setIsMobile] = useState(checkIsMobile);
  const [overflowOpen, setOverflowOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (isQuietReading) {
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: '#FAF2E9',
          borderBottom: '1px solid var(--color-border)',
          zIndex: 20,
          userSelect: 'none',
        }}
      >
        {/* Left: Minimal title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {!isFocusMode && (
            <button
              type="button"
              onClick={() => navigate(`/library/${bookId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Return to Book Details"
            >
              <ArrowLeft size={15} />
            </button>
          )}
          <span
            style={{
              fontSize: '0.86rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isMobile
                ? (typeof window !== 'undefined' && window.innerHeight <= 500 ? '160px' : '75px')
                : '280px',
            }}
            title={bookTitle}
          >
            {bookTitle}
          </span>
        </div>

        {/* Center: Bare Page Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: isMobile ? '4px 6px' : '4px 8px',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.3 : 1,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-primary)',
            }}
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
            {isMobile ? `${currentPage} / ${totalPages || 1}` : `Page ${currentPage} of ${totalPages || 1}`}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: isMobile ? '4px 6px' : '4px 8px',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= totalPages ? 0.3 : 1,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-primary)',
            }}
            title="Next Page (Right Arrow)"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Right: Exit Quiet Reading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onToggleQuietReading && (
            <button
              type="button"
              onClick={onToggleQuietReading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-primary)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-on-dark)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Exit Quiet Reading Mode"
            >
              <X size={14} />
              <span>Exit Quiet</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 20,
        boxShadow: 'var(--shadow-subtle)',
        userSelect: 'none',
      }}
    >
      {/* Left: Back & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '12px', minWidth: 0 }}>
        {!isFocusMode && (
          <button
            type="button"
            onClick={() => navigate(`/library/${bookId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 500,
              padding: isMobile ? '5px 4px' : '6px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Return to Book Details"
          >
            <ArrowLeft size={16} />
            {!isMobile && <span>Details</span>}
          </button>
        )}

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: isMobile ? '0.85rem' : '1rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isMobile
              ? (typeof window !== 'undefined' && window.innerHeight <= 500 ? '160px' : '65px')
              : (isFocusMode ? '400px' : '280px'),
          }}
          title={bookTitle}
        >
          {bookTitle}
        </div>
      </div>

      {/* Center: Page Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: isMobile ? '4px 6px' : '5px 8px',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.35 : 1,
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-text-primary)',
          }}
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '3px' : '6px', fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {!isMobile && <span>Page</span>}
          <input
            type="number"
            min={1}
            max={totalPages || 1}
            value={currentPage}
            onChange={(e) => onPageChange(parseInt(e.target.value) || 1)}
            style={{
              width: isMobile ? '34px' : '46px',
              textAlign: 'center',
              padding: '3px 2px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.84rem',
              fontFamily: 'inherit',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-surface-elevated)',
            }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>/ {totalPages || 1}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: isMobile ? '4px 6px' : '5px 8px',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.35 : 1,
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-text-primary)',
          }}
          title="Next Page (Right Arrow)"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Right: Zoom, Focus & Sidebars */}
      {isMobile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Bookmark Toggle */}
          <button
            type="button"
            onClick={onToggleBookmark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: isBookmarked ? 'rgba(214, 51, 122, 0.1)' : 'transparent',
              border: `1px solid ${isBookmarked ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-pill)',
              padding: '5px 10px',
              cursor: 'pointer',
              color: isBookmarked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
            title="Bookmark this page (B)"
          >
            <BookmarkIcon size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          {/* Quiet Reading Toggle */}
          {onToggleQuietReading && (
            <button
              type="button"
              onClick={onToggleQuietReading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-pill)',
                padding: '5px 9px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
              title="Quiet Reading Mode"
            >
              <BookOpen size={14} />
            </button>
          )}

          {/* Focus Mode (Fullscreen) */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: isFocusMode ? 'var(--color-primary)' : 'transparent',
              color: isFocusMode ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isFocusMode ? 'Exit Fullscreen (Esc)' : 'Distraction-Free Mode (F)'}
          >
            {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* More Options / Overflow Toggle */}
          <button
            type="button"
            onClick={() => setOverflowOpen(!overflowOpen)}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: overflowOpen ? 'rgba(58, 33, 64, 0.08)' : 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="More Options"
          >
            <MoreHorizontal size={16} />
          </button>

          {/* Mobile Overflow Popover */}
          {overflowOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: '12px',
                marginTop: '6px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                boxShadow: 'var(--shadow-modal)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minWidth: '220px',
                maxHeight: 'calc(100vh - 60px)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Zoom controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Zoom</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => onZoomChange(Math.max(0.5, zoomScale - 0.15))}
                    style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', minWidth: '38px', textAlign: 'center' }}>
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => onZoomChange(Math.min(2.5, zoomScale + 0.15))}
                    style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* Fit buttons */}
              {(onFitWidth || onFitPage) && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {onFitWidth && (
                    <button
                      type="button"
                      onClick={() => { onFitWidth(); setOverflowOpen(false); }}
                      style={{
                        flex: 1,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Fit Width
                    </button>
                  )}
                  {onFitPage && (
                    <button
                      type="button"
                      onClick={() => { onFitPage(); setOverflowOpen(false); }}
                      style={{
                        flex: 1,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Fit Page
                    </button>
                  )}
                </div>
              )}

              {/* Quiet Reading in overflow */}
              {onToggleQuietReading && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleQuietReading();
                    setOverflowOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 10px',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                  }}
                >
                  <BookOpen size={15} />
                  <span>Quiet Reading</span>
                </button>
              )}

              {/* Add Note Button */}
              {onToggleAddNote && (
                <button
                  type="button"
                  onClick={() => { onToggleAddNote(); setOverflowOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isAddingNote ? 'var(--color-secondary)' : 'transparent',
                    border: `1px solid ${isAddingNote ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 10px',
                    cursor: 'pointer',
                    color: isAddingNote ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                  }}
                >
                  <StickyNote size={15} />
                  <span>{isAddingNote ? 'Placing Note...' : 'Add Note to Page'}</span>
                </button>
              )}

              {/* Sidebar views */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '2px' }}>
                  Panels
                </div>
                <button
                  type="button"
                  onClick={() => { onToggleSidebar('thumbnails'); setOverflowOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeSidebar === 'thumbnails' ? 'rgba(58, 33, 64, 0.08)' : 'transparent',
                    color: activeSidebar === 'thumbnails' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                  }}
                >
                  <LayoutGrid size={15} />
                  <span>Page Thumbnails</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onToggleSidebar('bookmarks'); setOverflowOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeSidebar === 'bookmarks' ? 'rgba(58, 33, 64, 0.08)' : 'transparent',
                    color: activeSidebar === 'bookmarks' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                  }}
                >
                  <BookmarkCheck size={15} />
                  <span>Bookmarks</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onToggleSidebar('notes'); setOverflowOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeSidebar === 'notes' ? 'rgba(58, 33, 64, 0.08)' : 'transparent',
                    color: activeSidebar === 'notes' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                  }}
                >
                  <StickyNote size={15} />
                  <span>Notes &amp; Pins</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onToggleSidebar('archive'); setOverflowOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeSidebar === 'archive' ? 'rgba(58, 33, 64, 0.08)' : 'transparent',
                    color: activeSidebar === 'archive' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                  }}
                >
                  <Archive size={15} />
                  <span>Kin Archive</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onToggleSidebar('recap'); setOverflowOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeSidebar === 'recap' ? 'rgba(180, 83, 31, 0.12)' : 'transparent',
                    color: activeSidebar === 'recap' ? 'var(--color-secondary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                >
                  <Sparkles size={15} color="var(--color-secondary)" />
                  <span>Previously… (Memory Bridge)</span>
                  {hasUnreadRecap && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', marginLeft: 'auto' }} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Zoom In/Out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginRight: '4px' }}>
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(0.5, zoomScale - 0.15))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)' }}
              title="Zoom Out (-)"
            >
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', minWidth: '40px', textAlign: 'center' }}>
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => onZoomChange(Math.min(2.5, zoomScale + 0.15))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-secondary)' }}
              title="Zoom In (+)"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Fit Width / Fit Page */}
          {onFitWidth && (
            <button
              type="button"
              onClick={onFitWidth}
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
              title="Fit to Width"
            >
              Fit Width
            </button>
          )}

          <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--color-border)', margin: '0 4px' }} />

          {/* Quiet Reading Mode Toggle */}
          {onToggleQuietReading && (
            <button
              type="button"
              onClick={onToggleQuietReading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(58, 33, 64, 0.04)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-pill)',
                padding: '5px 12px',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
              title="Quiet Reading Mode (removes distractions and animations)"
            >
              <BookOpen size={14} />
              <span>Quiet Reading</span>
            </button>
          )}

          {/* Bookmark Toggle */}
          <button
            type="button"
            onClick={onToggleBookmark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isBookmarked ? 'rgba(214, 51, 122, 0.1)' : 'transparent',
              border: `1px solid ${isBookmarked ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-pill)',
              padding: '5px 12px',
              cursor: 'pointer',
              color: isBookmarked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
            title="Bookmark this page (B)"
          >
            <BookmarkIcon size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          {/* Add Note Mode Toggle */}
          {onToggleAddNote && (
            <button
              type="button"
              onClick={onToggleAddNote}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isAddingNote ? 'var(--color-secondary)' : 'transparent',
                border: `1px solid ${isAddingNote ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-pill)',
                padding: '5px 12px',
                cursor: 'pointer',
                color: isAddingNote ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
              title="Add a note or pin on this page"
            >
              <StickyNote size={14} />
              <span>{isAddingNote ? 'Placing Note...' : 'Add Note'}</span>
            </button>
          )}

          {/* Sidebar Toggles */}
          <button
            type="button"
            onClick={() => onToggleSidebar('thumbnails')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-border)',
              background: activeSidebar === 'thumbnails' ? 'var(--color-primary)' : 'transparent',
              color: activeSidebar === 'thumbnails' ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
            title="Page Thumbnails"
          >
            <LayoutGrid size={14} />
            <span>Pages</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSidebar('bookmarks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-border)',
              background: activeSidebar === 'bookmarks' ? 'var(--color-primary)' : 'transparent',
              color: activeSidebar === 'bookmarks' ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
            title="Saved Bookmarks"
          >
            <BookmarkCheck size={14} />
            <span>Bookmarks</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSidebar('notes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-border)',
              background: activeSidebar === 'notes' ? 'var(--color-primary)' : 'transparent',
              color: activeSidebar === 'notes' ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
            title="Notes and Annotations"
          >
            <StickyNote size={14} />
            <span>Notes</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSidebar('archive')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-border)',
              background: activeSidebar === 'archive' ? 'var(--color-primary)' : 'transparent',
              color: activeSidebar === 'archive' ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
            title="Browse & Pin Kin Archive Works"
          >
            <Archive size={14} />
            <span>Archive</span>
          </button>

          {/* Memory Bridge (Previously...) */}
          <button
            type="button"
            onClick={() => onToggleSidebar('recap')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${activeSidebar === 'recap' ? 'var(--color-secondary)' : 'var(--color-border)'}`,
              background: activeSidebar === 'recap' ? 'var(--color-secondary)' : 'transparent',
              color: activeSidebar === 'recap' ? 'var(--color-text-on-dark)' : 'var(--color-secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              position: 'relative',
            }}
            title="Reading Session Recap / Memory Bridge"
          >
            <Sparkles size={14} />
            <span>Previously…</span>
            {hasUnreadRecap && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: activeSidebar === 'recap' ? '#FFF' : 'var(--color-secondary)',
                  position: 'absolute',
                  top: '4px',
                  right: '6px',
                }}
              />
            )}
          </button>

          {/* Focus Mode (Fullscreen) */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: isFocusMode ? 'var(--color-primary)' : 'transparent',
              color: isFocusMode ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isFocusMode ? 'Exit Fullscreen (Esc)' : 'Distraction-Free Mode (F)'}
          >
            {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      )}
    </div>
  );
};
