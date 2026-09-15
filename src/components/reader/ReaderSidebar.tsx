import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutGrid,
  BookmarkCheck,
  Trash2,
  StickyNote,
  Archive,
  Pin,
  Sparkles,
  Clock,
  Edit3,
  RotateCcw,
  ArrowRight,
  Check,
  BookOpen,
} from 'lucide-react';
import { Bookmark, PageAnnotation, ReadingSession } from '../../types/book';
import { KIN_ARCHIVE_ASSETS, KIN_ARCHIVE_BY_ID } from '../../data/kinArchive';

interface ReaderSidebarProps {
  mode: 'thumbnails' | 'bookmarks' | 'notes' | 'archive' | 'recap';
  totalPages: number;
  currentPage: number;
  bookmarks: Bookmark[];
  annotations?: PageAnnotation[];
  sessions?: ReadingSession[];
  isGeneratingRecap?: boolean;
  onSelectPage: (page: number) => void;
  onRemoveBookmark: (id: string) => void;
  onDeleteAnnotation?: (id: string) => void;
  onPinArchiveAsset?: (assetId: string) => void;
  onUpdateSessionBoundaries?: (sessionId: string, startPage: number, endPage: number) => Promise<void>;
  onRegenerateSessionRecap?: (sessionId: string) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onClose: () => void;
}

export const ReaderSidebar: React.FC<ReaderSidebarProps> = ({
  mode,
  totalPages,
  currentPage,
  bookmarks,
  annotations = [],
  sessions = [],
  isGeneratingRecap = false,
  onSelectPage,
  onRemoveBookmark,
  onDeleteAnnotation,
  onPinArchiveAsset,
  onUpdateSessionBoundaries,
  onRegenerateSessionRecap,
  onDeleteSession,
  onClose,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState<string>('1');
  const [editEnd, setEditEnd] = useState<string>('1');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const checkIsMobile = () =>
    typeof window !== 'undefined' && (window.innerWidth <= 768 || window.innerHeight <= 500);

  const [isMobile, setIsMobile] = useState(checkIsMobile);

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

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobile && (
        <div
          onClick={onClose}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(36, 19, 41, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 999,
          }}
          aria-hidden="true"
        />
      )}
      <div
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        style={{
          width: isMobile ? 'min(320px, 85vw)' : '320px',
          backgroundColor: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: isMobile ? 'var(--shadow-modal)' : 'var(--shadow-subtle)',
          zIndex: isMobile ? 1000 : 15,
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 'auto',
          bottom: isMobile ? 0 : 'auto',
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
          ) : mode === 'archive' ? (
            <>
              <Archive size={16} color="var(--color-secondary)" />
              <span>Kin Archive (20)</span>
            </>
          ) : (
            <>
              <Sparkles size={16} color="var(--color-secondary)" />
              <span>Memory Bridge ({sessions.length})</span>
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
        ) : mode === 'archive' ? (
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
        ) : (
          /* Memory Bridge & Reading Sessions */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.45,
                padding: '10px 12px',
                backgroundColor: 'rgba(180, 83, 31, 0.05)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Sessions are recorded automatically. Meaningful reading produces a 30-second AI memory bridge grounded in only what you read.
            </div>

            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-text-muted)' }}>
                <Sparkles size={32} color="var(--color-secondary)" style={{ opacity: 0.5, marginBottom: '10px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '6px' }}>
                  No reading sessions yet
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                  Read through this document and return later. Your reading boundaries and memory bridge will appear here automatically.
                </div>
              </div>
            ) : (
              sessions.map((sess) => {
                const isEditing = editingSessionId === sess.id;
                const durationMin = Math.max(1, Math.round(sess.duration_seconds / 60));
                const sessDate = new Date(sess.ended_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={sess.id}
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderLeft: sess.recap ? '3px solid var(--color-secondary)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: 'var(--shadow-subtle)',
                    }}
                  >
                    {/* Session Top Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          backgroundColor: sess.is_meaningful ? 'rgba(180, 83, 31, 0.1)' : 'rgba(107, 91, 77, 0.08)',
                          color: sess.is_meaningful ? 'var(--color-secondary)' : 'var(--color-text-secondary)',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        <BookOpen size={11} />
                        Pages {sess.start_page}–{sess.end_page}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        <Clock size={11} />
                        <span>~{durationMin}m</span>
                        <span>·</span>
                        <span>{sessDate}</span>
                      </div>
                    </div>

                    {/* Edit Boundary Mode */}
                    {isEditing ? (
                      <div
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          Correct session boundaries:
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                            <span>Start:</span>
                            <input
                              type="number"
                              min={1}
                              max={totalPages}
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              style={{
                                width: '48px',
                                padding: '2px 6px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                              }}
                            />
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                            <span>End:</span>
                            <input
                              type="number"
                              min={1}
                              max={totalPages}
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              style={{
                                width: '48px',
                                padding: '2px 6px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '4px',
                                fontSize: '0.78rem',
                              }}
                            />
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => setEditingSessionId(null)}
                            style={{
                              padding: '3px 8px',
                              background: 'none',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingEdit}
                            onClick={async () => {
                              const s = parseInt(editStart, 10);
                              const e = parseInt(editEnd, 10);
                              if (!isNaN(s) && !isNaN(e) && s >= 1 && e >= s && onUpdateSessionBoundaries) {
                                setSavingEdit(true);
                                try {
                                  await onUpdateSessionBoundaries(sess.id, s, e);
                                  setEditingSessionId(null);
                                } finally {
                                  setSavingEdit(false);
                                }
                              }
                            }}
                            className="btn-primary"
                            style={{
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Check size={11} />
                            <span>{savingEdit ? 'Updating…' : 'Save & Regenerate'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Recap Content or Empty Note */}
                        {sess.recap ? (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              lineHeight: '1.55',
                              color: 'var(--color-text-primary)',
                              whiteSpace: 'pre-line',
                              padding: '6px 0',
                            }}
                          >
                            {sess.recap}
                          </div>
                        ) : sess.recap_error ? (
                          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', backgroundColor: 'rgba(0,0,0,0.03)', padding: '5px 8px', borderRadius: '4px' }}>
                            <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Recap note: </span>
                            {sess.recap_error}
                          </div>
                        ) : sess.is_meaningful ? (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                            {isGeneratingRecap ? 'Generating AI memory bridge…' : 'Meaningful session recorded. Recap not yet generated.'}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '2px 0' }}>
                            Brief session (under automatic recap threshold).
                          </div>
                        )}

                        {/* Session Actions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--color-border-subtle)',
                            paddingTop: '6px',
                            marginTop: '2px',
                            flexWrap: 'wrap',
                            gap: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => onSelectPage(sess.start_page)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                fontSize: '0.74rem',
                                color: 'var(--color-secondary)',
                                fontWeight: 600,
                              }}
                              title={`Jump to Page ${sess.start_page}`}
                            >
                              <span>Go to p. {sess.start_page}</span>
                              <ArrowRight size={11} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingSessionId(sess.id);
                                setEditStart(sess.start_page.toString());
                                setEditEnd(sess.end_page.toString());
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                fontSize: '0.74rem',
                                color: 'var(--color-text-muted)',
                              }}
                              title="Correct start/end pages"
                            >
                              <Edit3 size={11} />
                              <span>Edit</span>
                            </button>

                            {onRegenerateSessionRecap && (
                              <button
                                type="button"
                                onClick={() => onRegenerateSessionRecap(sess.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                  fontSize: '0.74rem',
                                  color: 'var(--color-text-muted)',
                                }}
                                title="Regenerate memory bridge recap"
                              >
                                <RotateCcw size={11} />
                                <span>{sess.recap ? 'Regen' : 'Generate'}</span>
                              </button>
                            )}
                          </div>

                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={() => onDeleteSession(sess.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                opacity: 0.7,
                              }}
                              title="Delete this session record"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  </>
);
};
