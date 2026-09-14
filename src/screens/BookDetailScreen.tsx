import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  FileText,
  Bookmark as BookmarkIcon,
  Trash2,
  Edit3,
  Check,
  X,
  HardDrive,
  LayoutGrid,
} from 'lucide-react';
import { useBookStore } from '../stores/bookStore';
import { useReadingProgressStore } from '../stores/readingProgressStore';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useArtRoomStore } from '../stores/artRoomStore';
import { useToastStore } from '../stores/toastStore';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/dates';

export const BookDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getBookById, updateBook, softDeleteBook, fetchBooks } = useBookStore();
  const { getProgress, fetchProgress } = useReadingProgressStore();
  const { getBookmarks, fetchBookmarks } = useBookmarkStore();
  const { showToast } = useToastStore();
  const { addItem: addArtRoomItem } = useArtRoomStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');

  const book = id ? getBookById(id) : undefined;
  const progress = id ? getProgress(id) : undefined;
  const bookmarks = id ? getBookmarks(id) : [];

  useEffect(() => {
    fetchBooks();
    if (id) {
      fetchProgress(id);
      fetchBookmarks(id);
    }
  }, [id, fetchBooks, fetchProgress, fetchBookmarks]);

  useEffect(() => {
    if (book) {
      setEditTitle(book.title);
      setEditAuthor(book.author || '');
      setEditDescription(book.description || '');
      setEditTags(book.tags ? book.tags.join(', ') : '');
    }
  }, [book]);

  if (!book) {
    return (
      <div className="fade-in" style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>Book Not Found</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          This book may have been removed or does not exist in your library.
        </p>
        <Link to="/library" className="btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-pill)', textDecoration: 'none' }}>
          Return to Library
        </Link>
      </div>
    );
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      showToast({ type: 'error', message: 'Title cannot be empty' });
      return;
    }

    const tags = editTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    await updateBook(book.id, {
      title: editTitle.trim(),
      author: editAuthor.trim(),
      description: editDescription.trim(),
      tags,
    });

    setIsEditing(false);
    showToast({ type: 'success', message: 'Book metadata updated' });
  };

  const handleDelete = async () => {
    await softDeleteBook(book.id);
    showToast({ type: 'info', message: `"${book.title}" removed from library` });
    navigate('/library');
  };

  const handlePinToArtRoom = async () => {
    await addArtRoomItem({
      type: 'book_page',
      ref_book_id: book.id,
      ref_book_page: currentPage,
      title: `${book.title} (p. ${currentPage})`,
      thumbnail_url: coverUrl || undefined,
      x_percent: 42 + Math.floor(Math.random() * 8),
      y_percent: 38 + Math.floor(Math.random() * 8),
      width_percent: 24,
      height_percent: 28,
      rotation_degrees: Math.floor(Math.random() * 7) - 3,
      z_index: 1,
    });
    showToast({
      type: 'success',
      message: `"${book.title}" pinned to Art Room!`,
      action: {
        label: 'Open Art Room',
        onClick: () => navigate('/art-room'),
      },
    });
  };

  const coverUrl = book.cover_thumbnail_path || book.cover_image_path;
  const totalPages = progress?.total_pages || book.page_count;
  const currentPage = progress?.current_page || 1;
  const percentRead = totalPages ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
      {/* Back button & Breadcrumb */}
      <div style={{ marginBottom: '28px' }}>
        <Link
          to="/library"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          <ArrowLeft size={16} />
          <span>Back to Library</span>
        </Link>
      </div>

      {/* Main Content Layout */}
      <div
        className="two-column-detail-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Cover & Quick Actions */}
        <div>
          <div
            style={{
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '20px',
            }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={book.title}
                style={{
                  width: '100%',
                  aspectRatio: '3 / 4',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3 / 4',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #2A1430 0%, #44244C 50%, #221226 100%)',
                  color: 'var(--color-text-on-dark)',
                }}
              >
                <BookOpen size={44} color="var(--color-text-on-dark)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.3 }}>
                  {book.title}
                </div>
                {book.author && (
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px' }}>
                    {book.author}
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '20px' }}>
              <Link
                to={`/reader/${book.id}`}
                className="btn-primary"
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '10px',
                }}
              >
                <BookOpen size={18} />
                <span>{progress && progress.current_page > 1 ? 'Resume Reading' : 'Open in Reader'}</span>
              </Link>

              <button
                type="button"
                onClick={handlePinToArtRoom}
                className="double-outline-btn"
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  marginBottom: '10px',
                }}
              >
                <LayoutGrid size={15} color="var(--color-accent)" />
                <span>Pin to Art Room</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={14} />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Info'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid rgba(178, 58, 46, 0.25)',
                    backgroundColor: 'rgba(178, 58, 46, 0.06)',
                    color: 'var(--color-error)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                  aria-label="Delete book"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* File Meta Info */}
          <div
            style={{
              padding: '18px 20px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardDrive size={15} color="var(--color-secondary)" />
              <span>{(book.file_size_bytes / (1024 * 1024)).toFixed(2)} MB PDF Document</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={15} color="var(--color-secondary)" />
              <span>Added on {formatDate(book.upload_date)}</span>
            </div>
            {book.page_count && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={15} color="var(--color-secondary)" />
                <span>{book.page_count} Total Pages</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Book Details & Bookmarks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Header section (or edit mode) */}
          {!isEditing ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Badge label="Private Library Item" variant="muted" />
                {book.page_count && <Badge label={`${book.page_count} pages`} variant="outline" />}
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  margin: '0 0 8px 0',
                  lineHeight: 1.2,
                }}
              >
                {book.title}
              </h1>

              {book.author && (
                <div style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  by <strong>{book.author}</strong>
                </div>
              )}

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                  {book.tags.map((tag) => (
                    <Badge key={tag} label={`#${tag}`} variant="secondary" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Editing Form */
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  margin: '0 0 16px 0',
                }}
              >
                Edit Book Information
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Author / Creator
                  </label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Study Notes / Description
                  </label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--color-border)',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="btn-primary"
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={15} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reading Progress Card */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Reading Status
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {totalPages ? `Page ${currentPage} of ${totalPages} (${percentRead}%)` : `Page ${currentPage}`}
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(58, 33, 64, 0.08)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: `${percentRead}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-secondary)',
                  borderRadius: 'var(--radius-full)',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                {progress?.last_read_at ? `Last read on ${formatDate(progress.last_read_at)}` : 'Not yet opened in reader'}
              </span>
              <Link
                to={`/reader/${book.id}`}
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-secondary)',
                  textDecoration: 'none',
                }}
              >
                Jump into page {currentPage} →
              </Link>
            </div>
          </div>

          {/* Description / Study Notes */}
          {book.description && !isEditing && (
            <div
              style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  margin: '0 0 12px 0',
                }}
              >
                Study Notes & Scope
              </h3>
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {book.description}
              </p>
            </div>
          )}

          {/* Bookmarks Section */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookmarkIcon size={18} color="var(--color-secondary)" />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    margin: 0,
                  }}
                >
                  Saved Bookmarks ({bookmarks.length})
                </h3>
              </div>
            </div>

            {bookmarks.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
                No bookmarks added yet. When reading this PDF, click the bookmark icon to save key reference pages.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {bookmarks.map((bm) => (
                  <Link
                    key={bm.id}
                    to={`/reader/${book.id}?page=${bm.page_number}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-text-on-dark)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        p. {bm.page_number}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {bm.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      Open page →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Book from Library?"
        message={`Are you sure you want to permanently delete "${book.title}"? This cannot be undone.`}
        confirmLabel="Delete Book"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
