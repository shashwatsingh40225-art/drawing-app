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

export const LibraryScreen: React.FC = () => {
  const { books, loading, fetchBooks, softDeleteBook } = useBookStore();
  const { showToast } = useToastStore();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

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
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
      <PageHeader
        icon={<Library size={16} />}
        eyebrowLabel="My Library — Private Art Companion"
        title="My Book Library"
        description="Your private collection of reference PDFs, anatomy guides, art manuals, and study notes. Read and annotate without distractions."
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
            }}
          >
            <Plus size={16} />
            <span>Upload PDF Book</span>
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
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {/* Search box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: '1 1 260px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)',
              padding: '8px 14px',
            }}
          >
            <Search size={16} color="var(--color-text-muted)" />
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
                color: 'var(--color-text-primary)',
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
                  color: 'var(--color-text-muted)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                <Filter size={13} />
                <span>Filter:</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  backgroundColor: selectedTag === null ? 'var(--color-primary)' : 'transparent',
                  color: selectedTag === null ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
                }}
              >
                All ({books.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)',
                    backgroundColor: selectedTag === tag ? 'var(--color-primary)' : 'transparent',
                    color: selectedTag === tag ? 'var(--color-text-on-dark)' : 'var(--color-text-secondary)',
                  }}
                >
                  #{tag}
                </button>
              ))}
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
          artworkSrc="/artist-reference/art-12.jpeg"
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
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <BookOpen size={36} color="var(--color-text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', margin: '0 0 6px 0' }}>
            No books found
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
            No titles or tags match "{searchQuery || selectedTag}".
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTag(null);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
  );
};
