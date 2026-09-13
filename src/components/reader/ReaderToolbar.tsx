import React from 'react';
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
  activeSidebar: 'thumbnails' | 'bookmarks' | 'notes' | 'archive' | null;
  onPageChange: (page: number) => void;
  onZoomChange: (scale: number) => void;
  onToggleBookmark: () => void;
  onToggleAddNote?: () => void;
  onToggleFocusMode: () => void;
  onToggleSidebar: (sidebar: 'thumbnails' | 'bookmarks' | 'notes' | 'archive') => void;
  onFitWidth?: () => void;
  onFitPage?: () => void;
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
  activeSidebar,
  onPageChange,
  onZoomChange,
  onToggleBookmark,
  onToggleAddNote,
  onToggleFocusMode,
  onToggleSidebar,
  onFitWidth,
  onFitPage,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {!isFocusMode && (
          <button
            type="button"
            onClick={() => navigate(`/library/${bookId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 500,
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Return to Book Details"
          >
            <ArrowLeft size={16} />
            <span>Details</span>
          </button>
        )}

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isFocusMode ? '400px' : '280px',
          }}
          title={bookTitle}
        >
          {bookTitle}
        </div>
      </div>

      {/* Center: Page Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 8px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 600 }}>
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages || 1}
            value={currentPage}
            onChange={(e) => onPageChange(parseInt(e.target.value) || 1)}
            style={{
              width: '46px',
              textAlign: 'center',
              padding: '3px 4px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.86rem',
              fontFamily: 'inherit',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-surface-elevated)',
            }}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>of {totalPages || 1}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 8px',
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
    </div>
  );
};
