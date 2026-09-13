import React, { useState } from 'react';
import { X, Image, BookOpen, Archive, StickyNote, Plus, Check } from 'lucide-react';
import { useArtworkStore } from '../../stores/artworkStore';
import { useBookStore } from '../../stores/bookStore';
import { KIN_ARCHIVE_ASSETS } from '../../data/kinArchive';
import { ArtRoomItemType } from '../../types/artRoom';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (itemData: {
    type: ArtRoomItemType;
    title: string;
    thumbnail_url?: string;
    note_content?: string;
    ref_artwork_id?: string;
    ref_book_id?: string;
    ref_book_page?: number;
    ref_archive_asset_id?: string;
    width_percent: number;
    height_percent: number;
    x_percent: number;
    y_percent: number;
    rotation_degrees: number;
  }) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const { artworks } = useArtworkStore();
  const { books } = useBookStore();

  const [activeTab, setActiveTab] = useState<'archive' | 'artworks' | 'books' | 'note'>('archive');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  if (!isOpen) return null;

  const handleAddArchive = (assetId: string) => {
    const asset = KIN_ARCHIVE_ASSETS.find((a) => a.id === assetId);
    if (!asset) return;

    onAddItem({
      type: 'archive_ref',
      title: asset.title,
      thumbnail_url: asset.filename,
      ref_archive_asset_id: asset.id,
      width_percent: 24,
      height_percent: 28,
      x_percent: 38 + (Math.random() * 10 - 5),
      y_percent: 35 + (Math.random() * 10 - 5),
      rotation_degrees: Math.round(Math.random() * 6 - 3),
    });
    onClose();
  };

  const handleAddArtwork = (artId: string) => {
    const art = artworks.find((a) => a.id === artId);
    if (!art) return;

    onAddItem({
      type: 'artwork',
      title: art.title,
      thumbnail_url: art.thumbnail_path || art.image_path || undefined,
      ref_artwork_id: art.id,
      width_percent: 25,
      height_percent: 30,
      x_percent: 40 + (Math.random() * 10 - 5),
      y_percent: 35 + (Math.random() * 10 - 5),
      rotation_degrees: Math.round(Math.random() * 6 - 3),
    });
    onClose();
  };

  const handleAddBook = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    onAddItem({
      type: 'book_page',
      title: `${book.title} (p. 1)`,
      thumbnail_url: book.cover_thumbnail_path || book.cover_image_path || undefined,
      ref_book_id: book.id,
      ref_book_page: 1,
      width_percent: 24,
      height_percent: 28,
      x_percent: 42 + (Math.random() * 10 - 5),
      y_percent: 38 + (Math.random() * 10 - 5),
      rotation_degrees: Math.round(Math.random() * 6 - 3),
    });
    onClose();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    onAddItem({
      type: 'note',
      title: noteTitle.trim() || 'Studio Note',
      note_content: noteContent.trim(),
      width_percent: 22,
      height_percent: 20,
      x_percent: 45 + (Math.random() * 10 - 5),
      y_percent: 40 + (Math.random() * 10 - 5),
      rotation_degrees: Math.round(Math.random() * 8 - 4),
    });
    setNoteTitle('');
    setNoteContent('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(35, 23, 16, 0.7)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9500,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card-surface"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            Pin Item to Art Room
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(58, 33, 64, 0.03)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'archive' ? 'var(--color-secondary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'archive' ? '2px solid var(--color-secondary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Archive size={15} />
            <span>Kin Archive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('artworks')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'artworks' ? 'var(--color-secondary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'artworks' ? '2px solid var(--color-secondary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Image size={15} />
            <span>My Art ({artworks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('books')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'books' ? 'var(--color-secondary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'books' ? '2px solid var(--color-secondary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <BookOpen size={15} />
            <span>My Library ({books.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('note')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: activeTab === 'note' ? 'var(--color-secondary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'note' ? '2px solid var(--color-secondary)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <StickyNote size={15} />
            <span>Sticky Note</span>
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'archive' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
              {KIN_ARCHIVE_ASSETS.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAddArchive(asset.id)}
                  style={{
                    background: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left',
                    padding: '8px',
                    transition: 'transform 150ms ease, border-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--color-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  <img
                    src={asset.filename}
                    alt={asset.title}
                    style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                  />
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                    {asset.code}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {asset.title}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'artworks' && (
            <div>
              {artworks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  No personal artworks found in My Art yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                  {artworks.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => handleAddArtwork(art.id)}
                      style={{
                        background: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        padding: '8px',
                      }}
                    >
                      <img
                        src={art.thumbnail_path || art.image_path || '/artist-reference/art-01.jpeg'}
                        alt={art.title}
                        style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                      />
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {art.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'books' && (
            <div>
              {books.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  No books found in your library yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                  {books.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => handleAddBook(book.id)}
                      style={{
                        background: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        padding: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: 'var(--color-primary-dark)',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {book.cover_thumbnail_path || book.cover_image_path ? (
                          <img
                            src={book.cover_thumbnail_path || book.cover_image_path!}
                            alt={book.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <BookOpen size={24} color="var(--color-text-on-dark)" />
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {book.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'note' && (
            <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Note Heading
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Palette Observation"
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
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Content *
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your study thought, observation, or quote..."
                  required
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-pill)', fontSize: '0.88rem' }}
                >
                  Pin Note to Canvas
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
