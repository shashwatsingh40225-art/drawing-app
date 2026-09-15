import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark as BookmarkIcon, Wrench } from 'lucide-react';

interface ReaderToolbarProps {
  bookTitle: string;
  bookId: string;
  isBookmarked: boolean;
  hasUnreadRecap?: boolean;
  toolsOpen: boolean;
  onToggleBookmark: () => void;
  onOpenTools: () => void;
}

/**
 * The Reader's primary bar — capped at exactly 3 one-tap controls (Back, Bookmark, Tools)
 * by design, so it needs no separate mobile/desktop layouts or overflow menu.
 */
export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  bookTitle,
  bookId,
  isBookmarked,
  hasUnreadRecap = false,
  toolsOpen,
  onToggleBookmark,
  onOpenTools,
}) => {
  const navigate = useNavigate();
  const checkIsMobile = () =>
    typeof window !== 'undefined' && (window.innerWidth <= 768 || window.innerHeight <= 500);

  const [isMobile, setIsMobile] = useState(checkIsMobile);

  useEffect(() => {
    const handleResize = () => setIsMobile(checkIsMobile());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

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
            minHeight: '44px',
          }}
          title="Return to Book Details"
        >
          <ArrowLeft size={16} />
          {!isMobile && <span>Details</span>}
        </button>

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
              ? (typeof window !== 'undefined' && window.innerHeight <= 500 ? '160px' : '110px')
              : '360px',
          }}
          title={bookTitle}
        >
          {bookTitle}
        </div>
      </div>

      {/* Right: Bookmark & Tools — the only two controls besides Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
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
            padding: isMobile ? '6px 10px' : '6px 14px',
            cursor: 'pointer',
            color: isBookmarked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            minHeight: '44px',
          }}
          title="Bookmark this page (B)"
        >
          <BookmarkIcon size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
          {!isMobile && <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>}
        </button>

        <button
          type="button"
          onClick={onOpenTools}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: toolsOpen ? 'var(--color-primary)' : 'transparent',
            border: `1px solid ${toolsOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-pill)',
            padding: isMobile ? '6px 10px' : '6px 14px',
            cursor: 'pointer',
            color: toolsOpen ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            minHeight: '44px',
          }}
          title="Tools"
        >
          <Wrench size={15} />
          {!isMobile && <span>Tools</span>}
          {hasUnreadRecap && (
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: toolsOpen ? '#FFF' : 'var(--color-secondary)',
                position: 'absolute',
                top: '5px',
                right: '5px',
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
};
