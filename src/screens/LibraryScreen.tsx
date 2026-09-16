import React, { useState, useEffect } from 'react';
import { Library, UploadCloud, Search, Plus, BookOpen, Filter } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BookCard } from '../components/library/BookCard';
import { BookUploadZone } from '../components/library/BookUploadZone';
import { useBookStore } from '../stores/bookStore';
import { useToastStore } from '../stores/toastStore';
import { Book } from '../types/book';
import { PageTransition } from '../components/motion/PageTransition';
import { worlds } from '../styles/tokens';

export const LibraryScreen: React.FC = () => {
  const { books, loading, fetchBooks, softDeleteBook } = useBookStore();
  const { showToast } = useToastStore();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  const world = worlds.inkStudy;

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Extract all unique tags across books
  const allTags = Array.from(
    new Set(books.flatMap((b) => b.tags || []))
  ).filter(Boolean);

  // Filter books by query and selected tag
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      !searchQuery.trim() ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || (book.tags && book.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    await softDeleteBook(bookToDelete.id);
    showToast({
      type: 'info',
      message: `"${bookToDelete.title}" removed from library`,
    });
    setBookToDelete(null);
  };

  return (
    <PageTransition>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '36px 20px 96px 20px',
          '--world-accent': world.accent,
          '--world-secondary-accent': world.secondaryAccent,
          '--world-border': world.border,
        } as React.CSSProperties}
      >
      <PageHeader
        icon={<Library size={16} />}
        eyebrowLabel="My Library — Kin Studio Collection"
        title="Reference Books & Guides"
        description="Your private collection of reference PDFs and EPUBs, anatomy guides, art manuals, and study notes. Read and annotate without distractions."
        action={
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary double-outline-btn"
            style={{
              padding: '10px 20px',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: world.accent,
              borderColor: world.accent,
            }}
          >
            <Plus size={16} />
            <span>Upload Book</span>
          </button>
        }
      />

      {/* Upload Zone (Expandable / Modal) */}
      {showUploadModal && (
        <div style={{ marginBottom: '36px' }}>
          <BookUploadZone
            onSuccess={() => {
              setShowUploadModal(false);
            }}
            onCancel={() => setShowUploadModal(false)}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      {books.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '28px',
            padding: '14px 18px',
            backgroundColor: world.surface,
            border: `1px solid ${world.border}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          {/* Search box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: '1 1 260px',
              backgroundColor: world.surfaceElevated,
              border: `1px solid ${world.border}`,
              borderRadius: 'var(--radius-pill)',
              padding: '8px 14px',
            }}
          >
            <Search size={16} color={world.textMuted} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books by title, author, or topic..."
              style={{
                border: 'none',
                background: 'none',
                outline: 'none',
                fontSize: '0.88rem',
                color: world.textPrimary,
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.85rem',
                  color: world.textMuted,
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Tags list */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: world.textMuted }}>
                <Filter size={13} />
                <span>Filter:</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${selectedTag === null ? world.accent : world.border}`,
                  backgroundColor: selectedTag === null ? world.accent : 'rgba(139, 74, 43, 0.05)',
                  color: selectedTag === null ? '#FFFFFF' : world.textSecondary,
                  transition: 'all 150ms ease',
                }}
              >
                All ({books.length})
              </button>
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? world.accent : world.border}`,
                      backgroundColor: isSelected ? world.accent : 'rgba(139, 74, 43, 0.05)',
                      color: isSelected ? '#FFFFFF' : world.textSecondary,
                      transition: 'all 150ms ease',
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton View */}
      {loading && books.length === 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                padding: '16px',
              }}
            >
              <Skeleton height={200} borderRadius="var(--radius-lg)" style={{ marginBottom: '16px' }} />
              <Skeleton height={20} width="70%" style={{ marginBottom: '8px' }} />
              <Skeleton height={14} width="45%" style={{ marginBottom: '16px' }} />
              <Skeleton height={36} borderRadius="var(--radius-pill)" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && books.length === 0 && !showUploadModal && (
        <EmptyState
          artworkSrc="/brand/illustrations/art-01-card.png"
          headline="Your library is empty"
          description="Upload art reference manuals, anatomical studies, tutorials, or scanned sketchbooks. They remain completely private to your account and easy to study."
          actionLabel="Upload Your First Book"
          onAction={() => setShowUploadModal(true)}
        />
      )}

      {/* Search Empty State */}
      {!loading && books.length > 0 && filteredBooks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            backgroundColor: world.surface,
            border: `1.5px solid ${world.border}`,
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <BookOpen size={36} color={world.textMuted} style={{ marginBottom: '12px' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: world.textPrimary, margin: '0 0 6px 0' }}>
            No books found
          </h3>
          <p style={{ color: world.textSecondary, fontSize: '0.9rem', margin: '0 0 16px 0' }}>
            No titles or tags match "{searchQuery || selectedTag}".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTag(null);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${world.border}`,
              backgroundColor: world.surfaceElevated,
              color: world.textPrimary,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Book Grid */}
      {filteredBooks.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onDelete={(id) => {
                const target = books.find((b) => b.id === id) || null;
                setBookToDelete(target);
              }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={bookToDelete !== null}
        title="Remove Book from Library?"
        message={`Are you sure you want to remove "${bookToDelete?.title}"? Any bookmarks or notes attached to this book will also be removed.`}
        confirmLabel="Remove Book"
        cancelLabel="Keep Book"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setBookToDelete(null)}
      />
    </div>
  </PageTransition>
);
};
