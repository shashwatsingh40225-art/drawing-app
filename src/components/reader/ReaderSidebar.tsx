import React from 'react';
import { X, LayoutGrid, BookmarkCheck, Trash2, StickyNote, Archive, Pin } from 'lucide-react';
import { Bookmark, PageAnnotation } from '../../types/book';
import { KIN_ARCHIVE_ASSETS, KIN_ARCHIVE_BY_ID } from '../../data/kinArchive';

interface ReaderSidebarProps {
  mode: 'thumbnails' | 'bookmarks' | 'notes' | 'archive';
  totalPages: number;
  currentPage: number;
  bookmarks: Bookmark[];
  annotations?: PageAnnotation[];
  onSelectPage: (page: number) => void;
  onRemoveBookmark: (id: string) => void;
  onDeleteAnnotation?: (id: string) => void;
  onPinArchiveAsset?: (assetId: string) => void;
  onClose: () => void;
}

export const ReaderSidebar: React.FC<ReaderSidebarProps> = ({
  mode,
  totalPages,
  currentPage,
  bookmarks,
  annotations = [],
  onSelectPage,
  onRemoveBookmark,
  onDeleteAnnotation,
  onPinArchiveAsset,
  onClose,
}) => {
  return (
    <div
      style={{
        width: '320px',
        backgroundColor: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: 'var(--shadow-subtle)',
        zIndex: 15,
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          {mode === 'thumbnails' ? (
            <>
              <LayoutGrid size={16} color="var(--color-secondary)" />
              <span>Pages ({totalPages})</span>
            </>
          ) : mode === 'bookmarks' ? (
            <>
              <BookmarkCheck size={16} color="var(--color-accent)" />
              <span>Bookmarks ({bookmarks.length})</span>
            </>
          ) : mode === 'notes' ? (
            <>
              <StickyNote size={16} color="var(--color-secondary)" />
              <span>Notes & Pins ({annotations.length})</span>
            </>
          ) : (
            <>
              <Archive size={16} color="var(--color-secondary)" />
              <span>Kin Archive (20)</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {mode === 'thumbnails' ? (
          /* Pages / Thumbnails grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
          >
            {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((pageNum) => {
              const isCurrent = pageNum === currentPage;
              const hasBookmark = bookmarks.some((b) => b.page_number === pageNum);
              const pageNoteCount = annotations.filter((a) => a.page_number === pageNum).length;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onSelectPage(pageNum)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '3 / 4',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isCurrent ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                    backgroundColor: isCurrent ? 'rgba(180, 83, 31, 0.08)' : 'var(--color-surface-elevated)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 150ms ease',
                    padding: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.borderColor = 'var(--color-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  {hasBookmark && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '8px',
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--color-accent)',
                      }}
                      title="Bookmarked"
                    />
                  )}
                  {pageNoteCount > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(58, 33, 64, 0.1)',
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-pill)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {pageNoteCount} note{pageNoteCount > 1 ? 's' : ''}
                    </div>
                  )}
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: isCurrent ? 'var(--color-secondary)' : 'var(--color-text-primary)',
                    }}
                  >
                    {pageNum}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Page
                  </span>
                </button>
              );
            })}
          </div>
        ) : mode === 'bookmarks' ? (
          /* Bookmarks List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bookmarks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--color-text-muted)' }}>
                <BookmarkCheck size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No bookmarks saved</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Click "Bookmark" on any page to save references here.
                </div>
              </div>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => onSelectPage(bm.page_number)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${bm.page_number === currentPage ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    backgroundColor: bm.page_number === currentPage ? 'rgba(214, 51, 122, 0.08)' : 'var(--color-surface-elevated)',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bm.label}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Page {bm.page_number}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBookmark(bm.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    title="Remove bookmark"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : mode === 'notes' ? (
          /* Notes & Annotations List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {annotations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--color-text-muted)' }}>
                <StickyNote size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No notes added yet</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Click "Add Note" in the toolbar to drop observation notes on any page.
                </div>
              </div>
            ) : (
              annotations.map((ann) => {
                const archiveRef = ann.ref_archive_asset_id ? KIN_ARCHIVE_BY_ID[ann.ref_archive_asset_id] : null;

                return (
                  <div
                    key={ann.id}
                    onClick={() => onSelectPage(ann.page_number)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${ann.page_number === currentPage ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                      backgroundColor: ann.page_number === currentPage ? 'rgba(180, 83, 31, 0.06)' : 'var(--color-surface-elevated)',
                      cursor: 'pointer',
                      transition: 'border-color 150ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--color-primary)',
                          color: 'var(--color-text-on-dark)',
                          padding: '1px 7px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        Page {ann.page_number}
                      </span>
                      {onDeleteAnnotation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAnnotation(ann.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                          title="Delete note"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {archiveRef && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                          {archiveRef.code}: {archiveRef.title}
                        </span>
                      </div>
                    )}

                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                      {ann.content || '(Empty observation note)'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Kin Archive Asset Browser & Pinning */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 4px 0' }}>
              Pin any of the 20 studio artworks directly onto page {currentPage} as a reference overlay.
            </p>
            {KIN_ARCHIVE_ASSETS.map((asset) => (
              <div
                key={asset.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <img
                  src={asset.filename}
                  alt={asset.title}
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                    {asset.code}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {asset.title}
                  </div>
                  {onPinArchiveAsset && (
                    <button
                      type="button"
                      onClick={() => onPinArchiveAsset(asset.id)}
                      style={{
                        marginTop: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--color-border)',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        color: 'var(--color-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      <Pin size={11} />
                      <span>Pin to page {currentPage}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
