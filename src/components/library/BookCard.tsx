import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, MoreVertical, Trash2, Calendar, FileText } from 'lucide-react';
import { Book } from '../../types/book';
import { useReadingProgressStore } from '../../stores/readingProgressStore';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/dates';
import { worlds, motionTiming } from '../../styles/tokens';

interface BookCardProps {
  book: Book;
  onDelete?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onDelete }) => {
  const navigate = useNavigate();
  const { getProgress } = useReadingProgressStore();
  const progress = getProgress(book.id);

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isShuffling, setIsShuffling] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const world = worlds.inkStudy;
  const coverUrl = book.cover_thumbnail_path || book.cover_image_path;

  const handleRead = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(`/reader/${book.id}`);
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsShuffling(true);
    timerRef.current = window.setTimeout(() => {
      navigate(`/reader/${book.id}`);
    }, motionTiming.microInteraction.durationMs);
  };

  const getProgressLabel = () => {
    if (!progress || progress.current_page <= 1) {
      return { text: 'Unread', variant: 'muted' as const };
    }
    const total = progress.total_pages || book.page_count;
    if (total && progress.current_page >= total) {
      return { text: 'Finished', variant: 'teal' as const };
    }
    return {
      text: total ? `p. ${progress.current_page} of ${total}` : `Page ${progress.current_page}`,
      variant: 'secondary' as const,
    };
  };

  const progressBadge = getProgressLabel();

  return (
    <div
      className={`card-surface ${isShuffling ? 'paper-shuffle-active' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-xl)',
        border: `1.5px solid ${world.border}`,
        backgroundColor: world.surface,
        overflow: 'hidden',
        transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease, border-color 200ms ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(35, 23, 16, 0.12)';
        e.currentTarget.style.borderColor = world.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
        e.currentTarget.style.borderColor = world.border;
        setMenuOpen(false);
      }}
    >
      {/* Cover Container */}
      <Link
        to={`/reader/${book.id}`}
        onClick={handleRead}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          backgroundColor: '#1E120D',
          overflow: 'hidden',
          textDecoration: 'none',
        }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 300ms ease',
            }}
            onError={(e) => {
              // If image fails, fallback to styled graphic
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #2A1A14 0%, #3D261C 50%, #1E120D 100%)',
              color: '#F8F1E3',
              boxShadow: 'inset 0 0 0 1px rgba(217, 203, 181, 0.22)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(217, 203, 181, 0.12)',
                border: '1px solid rgba(217, 203, 181, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <BookOpen size={20} color="#F8F1E3" />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 600,
                lineHeight: 1.3,
                maxHeight: '2.6em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                color: '#F8F1E3',
              }}
            >
              {book.title}
            </div>
          </div>
        )}

        {/* Progress pill overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
          }}
        >
          <Badge label={progressBadge.text} variant={progressBadge.variant} />
        </div>

        {/* Page count pill */}
        {book.page_count && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(35, 23, 16, 0.75)',
              color: 'var(--color-text-on-dark)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <FileText size={11} />
            <span>{book.page_count}p</span>
          </div>
        )}
      </Link>

      {/* Book Metadata & Actions */}
      <div
        style={{
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: world.surfaceElevated,
          borderTop: `1px solid ${world.borderSubtle}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                margin: '0 0 4px 0',
                fontFamily: 'var(--font-display)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: world.textPrimary,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Link
                to={`/reader/${book.id}`}
                onClick={handleRead}
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = world.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.color = world.textPrimary)}
              >
                {book.title}
              </Link>
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.82rem',
                color: world.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {book.author ? book.author : 'Unknown Author'}
            </p>
          </div>

          {/* Context Menu Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: world.textMuted,
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Book actions"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: world.surfaceElevated,
                  border: `1px solid ${world.border}`,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(35, 23, 16, 0.14)',
                  zIndex: 20,
                  minWidth: '140px',
                  padding: '4px 0',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/library/${book.id}`);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    background: 'none',
                    border: 'none',
                    color: world.textPrimary,
                    cursor: 'pointer',
                  }}
                >
                  Book Details
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(book.id);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-error)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete Book</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Date added */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            color: world.textMuted,
            marginTop: '12px',
          }}
        >
          <Calendar size={12} />
          <span>Added {formatDate(book.upload_date)}</span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <Link
            to={`/reader/${book.id}`}
            onClick={handleRead}
            className="btn-primary"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: world.accent,
              color: '#FFFFFF',
              boxSizing: 'border-box',
              transition: 'background-color 150ms ease, transform 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = world.secondaryAccent)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = world.accent)}
          >
            <BookOpen size={14} />
            <span>Read</span>
          </Link>
          <Link
            to={`/library/${book.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 500,
              color: world.textSecondary,
              border: `1px solid ${world.border}`,
              borderRadius: 'var(--radius-pill)',
              textDecoration: 'none',
              backgroundColor: 'transparent',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(139, 74, 43, 0.08)';
              e.currentTarget.style.color = world.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = world.textSecondary;
            }}
          >
            Info
          </Link>
        </div>
      </div>
    </div>
  );
};
