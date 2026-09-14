import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Image, BookOpen, Archive, StickyNote } from 'lucide-react';
import { useArtworkStore } from '../../stores/artworkStore';
import { useBookStore } from '../../stores/bookStore';
import { KIN_ARCHIVE_ASSETS } from '../../data/kinArchive';
import { ArtRoomItemType } from '../../types/artRoom';
import { worlds } from '../../styles/tokens';

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
  const world = worlds.magentaCreature;
  const { artworks } = useArtworkStore();
  const { books } = useBookStore();

  const [activeTab, setActiveTab] = useState<'archive' | 'artworks' | 'books' | 'note'>('archive');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [bloomingId, setBloomingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddArchive = (assetId: string) => {
    const asset = KIN_ARCHIVE_ASSETS.find((a) => a.id === assetId);
    if (!asset) return;

    setBloomingId(asset.id);
    setTimeout(() => {
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
      setBloomingId(null);
      onClose();
    }, 150);
  };

  const handleAddArtwork = (artId: string) => {
    const art = artworks.find((a) => a.id === artId);
    if (!art) return;

    setBloomingId(art.id);
    setTimeout(() => {
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
      setBloomingId(null);
      onClose();
    }, 150);
  };

  const handleAddBook = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    setBloomingId(book.id);
    setTimeout(() => {
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
      setBloomingId(null);
      onClose();
    }, 150);
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

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 14, 28, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px 12px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="add-item-modal-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: 'calc(100vh - 32px)',
          margin: 'auto',
          backgroundColor: world.surface,
          borderRadius: 'var(--radius-xl)',
          border: `1.5px solid ${world.accent}`,
          boxShadow: `4px 4px 0 0 ${world.secondaryAccent}, 0 24px 60px rgba(26, 14, 28, 0.45)`,
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
            padding: '18px 24px 14px',
            borderBottom: `1px solid ${world.borderSubtle}`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: world.accent,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}
            >
              Pin to Canvas
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: world.textPrimary,
              }}
            >
              Pin Item to Art Room
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: world.textSecondary,
              padding: '6px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderBottom: `1px solid ${world.borderSubtle}`,
            backgroundColor: 'rgba(58, 33, 64, 0.02)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'archive' as const, label: 'Kin Archive', count: KIN_ARCHIVE_ASSETS.length, icon: Archive },
            { id: 'artworks' as const, label: 'My Art', count: artworks.length, icon: Image },
            { id: 'books' as const, label: 'My Library', count: books.length, icon: BookOpen },
            { id: 'note' as const, label: 'Sticky Note', icon: StickyNote },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${isActive ? world.accent : world.border}`,
                  backgroundColor: isActive ? world.accent : 'transparent',
                  color: isActive ? '#FFFFFF' : world.textSecondary,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(255, 45, 149, 0.25)' : 'none',
                  transition: 'all 180ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      opacity: isActive ? 0.9 : 0.65,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(107, 79, 94, 0.12)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {activeTab === 'archive' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
              {KIN_ARCHIVE_ASSETS.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleAddArchive(asset.id)}
                  className={`double-outline-card ${bloomingId === asset.id ? 'pigment-bloom-active' : ''}`}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${world.border}`,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left',
                    padding: '8px',
                    boxShadow: 'var(--shadow-subtle)',
                    transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = world.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = world.border;
                  }}
                >
                  <img
                    src={asset.filename}
                    alt={asset.title}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '6px',
                    }}
                  />
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: world.accent }}>
                    {asset.code}
                  </div>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: world.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {asset.title}
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'artworks' && (
            <div>
              {artworks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: world.textMuted, fontSize: '0.9rem' }}>
                  No personal artworks found in My Art yet. Upload your first sketch or painting to pin it here.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                  {artworks.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => handleAddArtwork(art.id)}
                      className={`double-outline-card ${bloomingId === art.id ? 'pigment-bloom-active' : ''}`}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: `1px solid ${world.border}`,
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        padding: '8px',
                        boxShadow: 'var(--shadow-subtle)',
                        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = world.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = world.border;
                      }}
                    >
                      <img
                        src={art.thumbnail_path || art.image_path || '/artist-reference/art-01.jpeg'}
                        alt={art.title}
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '6px',
                        }}
                      />
                      <div
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: world.textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
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
                <div style={{ textAlign: 'center', padding: '48px 20px', color: world.textMuted, fontSize: '0.9rem' }}>
                  No books found in your library yet. Upload a PDF in My Library to pin plates here.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                  {books.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => handleAddBook(book.id)}
                      className={`double-outline-card ${bloomingId === book.id ? 'pigment-bloom-active' : ''}`}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: `1px solid ${world.border}`,
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        padding: '8px',
                        boxShadow: 'var(--shadow-subtle)',
                        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = world.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = world.border;
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#2D1B36',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '6px',
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
                          <BookOpen size={24} color="#D9CBB5" />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: world.textPrimary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {book.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'note' && (
            <form
              onSubmit={handleAddNote}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: '#FFFDF0',
                border: '1px solid #FDE68A',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#78350F',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Note Heading
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Color Harmony Observation"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #FDE68A',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#78350F',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
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
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #FDE68A',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    backgroundColor: '#FFFFFF',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="submit"
                  className="btn-accent double-outline-btn"
                  style={{
                    padding: '8px 22px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.88rem',
                    backgroundColor: world.accent,
                    color: '#FFFFFF',
                    border: `1px solid ${world.accent}`,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
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

  return createPortal(modalContent, document.body);
};

