import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  BookmarkCheck,
  Trash2,
  Archive,
  Pin,
  Sparkles,
  Clock,
  Edit3,
  RotateCcw,
  ArrowRight,
  Check,
  BookOpen,
  Moon,
  Sun,
} from 'lucide-react';
import { Bookmark, ReadingSession } from '../../types/book';
import { KIN_ARCHIVE_ASSETS } from '../../data/kinArchive';

type ToolsView = 'menu' | 'thumbnails' | 'bookmarks' | 'archive' | 'recap';

interface ReaderToolsPanelProps {
  totalPages: number;
  currentPage: number;
  bookmarks: Bookmark[];
  sessions?: ReadingSession[];
  generatingSessionIds?: Record<string, boolean>;
  hasUnreadRecap?: boolean;
  /** Highest page the reader has reached; corrections cannot extend past it. */
  maxEditablePage?: number;
  /** One title per section, from the EPUB's table of contents. Present only for EPUB books —
   *  swaps the "Thumbnails" number grid for a "Chapters" list of real chapter names. */
  chapterTitles?: string[];
  onSelectPage: (page: number) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateSessionBoundaries?: (sessionId: string, startPage: number, endPage: number) => Promise<void>;
  onRegenerateSessionRecap?: (sessionId: string) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onStartAddPin: () => void;
  /** Pins anchor to an x/y point on a rendered page image — meaningless for reflowable EPUB text. */
  showAddPin?: boolean;
  nightMode?: boolean;
  onToggleNightMode?: () => void;
  onClose: () => void;
}

const MENU_ITEMS: { view: Exclude<ToolsView, 'menu'>; label: string; icon: React.ReactNode; color: string }[] = [
  { view: 'thumbnails', label: 'Thumbnails', icon: <LayoutGrid size={17} />, color: 'var(--color-secondary)' },
  { view: 'bookmarks', label: 'Bookmarks', icon: <BookmarkCheck size={17} />, color: 'var(--color-accent)' },
  { view: 'archive', label: 'Kin Archive', icon: <Archive size={17} />, color: 'var(--color-secondary)' },
  { view: 'recap', label: 'Recaps', icon: <Sparkles size={17} />, color: 'var(--color-secondary)' },
];

const VIEW_TITLES: Record<ToolsView, string> = {
  menu: 'Tools',
  thumbnails: 'Thumbnails',
  bookmarks: 'Bookmarks',
  archive: 'Kin Archive',
  recap: 'Recaps',
};

/**
 * The Reader's single secondary entry point (decision 5): opens on a menu of everything that
 * isn't Back, Bookmark, or Chrome itself, ordered by how often each is actually reached for.
 * Add Pin is an action row, not a browsable view — it hands off to the chooser immediately.
 */
export const ReaderToolsPanel: React.FC<ReaderToolsPanelProps> = ({
  totalPages,
  currentPage,
  bookmarks,
  sessions = [],
  generatingSessionIds = {},
  hasUnreadRecap = false,
  maxEditablePage,
  chapterTitles,
  onSelectPage,
  onRemoveBookmark,
  onUpdateSessionBoundaries,
  onRegenerateSessionRecap,
  onDeleteSession,
  onStartAddPin,
  showAddPin = true,
  nightMode = false,
  onToggleNightMode,
  onClose,
}) => {
  const [view, setView] = useState<ToolsView>('menu');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState<string>('1');
  const [editEnd, setEditEnd] = useState<string>('1');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

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

  // A quiet, opt-in nudge toward installing (see ADR context: the browser's own Fullscreen exit
  // toast already announces itself on every immersive tap, so this must never be another popup —
  // it only shows inside a panel the reader chose to open). Skipped once actually installed.
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone === true);
  const showInstallTip = isMobile && !isStandalone;
  const hasChapters = Boolean(chapterTitles?.length);
  const headerTitle = view === 'thumbnails' && hasChapters ? 'Chapters' : VIEW_TITLES[view];

  return (
    <>
      {isMobile && (
        <div
          onClick={onClose}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(36, 19, 41, 0.4)', backdropFilter: 'blur(2px)', zIndex: 999 }}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', minWidth: 0 }}>
            {view !== 'menu' && (
              <button
                type="button"
                onClick={() => setView('menu')}
                aria-label="Back to Tools menu"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex' }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <span>{headerTitle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
            aria-label="Close Tools"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {view === 'menu' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {MENU_ITEMS.filter((item) => showAddPin || item.view !== 'archive').map((item) => {
                const isChaptersItem = item.view === 'thumbnails' && hasChapters;
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => setView(item.view)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      minHeight: '44px',
                      position: 'relative',
                    }}
                  >
                    <span style={{ color: item.color, display: 'flex' }}>
                      {isChaptersItem ? <List size={17} /> : item.icon}
                    </span>
                    <span style={{ flex: 1 }}>{isChaptersItem ? 'Chapters' : item.label}</span>
                    {item.view === 'recap' && hasUnreadRecap && (
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)' }} />
                    )}
                    <ChevronRight size={15} color="var(--color-text-muted)" />
                  </button>
                );
              })}

              {onToggleNightMode && (
                <button
                  type="button"
                  onClick={onToggleNightMode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    minHeight: '44px',
                  }}
                >
                  <span style={{ color: 'var(--color-secondary)', display: 'flex' }}>
                    {nightMode ? <Sun size={17} /> : <Moon size={17} />}
                  </span>
                  <span style={{ flex: 1 }}>{nightMode ? 'Light Mode' : 'Night Mode'}</span>
                </button>
              )}

              {showAddPin && (
                <>
                  <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)', margin: '6px 0' }} />

                  <button
                    type="button"
                    onClick={onStartAddPin}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-secondary)',
                      backgroundColor: 'rgba(180, 83, 31, 0.06)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--color-secondary)',
                      minHeight: '44px',
                    }}
                  >
                    <Pin size={17} />
                    <span style={{ flex: 1 }}>Add Pin</span>
                  </button>
                </>
              )}

              {showInstallTip && (
                <div
                  style={{
                    marginTop: '4px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px dashed var(--color-border)',
                    fontSize: '0.78rem',
                    lineHeight: 1.5,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Tip: add Kin to your home screen (your browser's menu → "Add to Home Screen") to
                  read with no browser bar at all, like a real app.
                </div>
              )}
            </div>
          ) : view === 'thumbnails' && hasChapters ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(chapterTitles ?? []).map((title, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => onSelectPage(pageNum)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isCurrent ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                      backgroundColor: isCurrent ? 'rgba(180, 83, 31, 0.08)' : 'var(--color-surface-elevated)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: '44px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isCurrent ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                        minWidth: '20px',
                      }}
                    >
                      {pageNum}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: isCurrent ? 'var(--color-secondary)' : 'var(--color-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {title}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : view === 'thumbnails' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((pageNum) => {
                const isCurrent = pageNum === currentPage;
                const hasBookmark = bookmarks.some((b) => b.page_number === pageNum);

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
                  >
                    {hasBookmark && (
                      <div
                        style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-accent)' }}
                        title="Bookmarked"
                      />
                    )}
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: isCurrent ? 'var(--color-secondary)' : 'var(--color-text-primary)' }}>
                      {pageNum}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Page</span>
                  </button>
                );
              })}
            </div>
          ) : view === 'bookmarks' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bookmarks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--color-text-muted)' }}>
                  <BookmarkCheck size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No bookmarks saved</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Bookmark any page from the top bar to save references here.</div>
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
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bm.label}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Page {bm.page_number}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(bm.id);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px', borderRadius: 'var(--radius-sm)' }}
                      title="Remove bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : view === 'archive' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0 0 4px 0' }}>
                20 studio artworks. Use Add Pin to attach one to a page.
              </p>
              {KIN_ARCHIVE_ASSETS.map((asset) => (
                <div key={asset.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }}>
                  <img src={asset.filename} alt={asset.title} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{asset.code}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {asset.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.45, padding: '10px 12px', backgroundColor: 'rgba(180, 83, 31, 0.05)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                Your sessions are tracked automatically. Read for a while, and a short recap of those pages will be waiting next time you open this book.
              </div>

              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-text-muted)' }}>
                  <Sparkles size={32} color="var(--color-secondary)" style={{ opacity: 0.5, marginBottom: '10px' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '6px' }}>No sessions yet</div>
                  <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>Come back after a longer sitting and a recap of what you read will show up here.</div>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isEditing = editingSessionId === sess.id;
                  const durationMin = Math.max(1, Math.round(sess.duration_seconds / 60));
                  const sessDate = new Date(sess.ended_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

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

                      {isEditing ? (
                        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Correct session boundaries:</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                              <span>Start:</span>
                              <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={editStart}
                                onChange={(e) => setEditStart(e.target.value)}
                                style={{ width: '48px', padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.78rem' }}
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
                                style={{ width: '48px', padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.78rem' }}
                              />
                            </label>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setEditingSessionId(null)} style={{ padding: '3px 8px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', cursor: 'pointer' }}>
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={async () => {
                                const s = parseInt(editStart, 10);
                                const e = parseInt(editEnd, 10);
                                if (!isNaN(s) && !isNaN(e) && s >= 1 && e >= s && (!maxEditablePage || e <= maxEditablePage) && onUpdateSessionBoundaries) {
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
                              style={{ padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Check size={11} />
                              <span>{savingEdit ? 'Updating…' : 'Save & Regenerate'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {sess.recap ? (
                            <div style={{ fontSize: '0.8rem', lineHeight: '1.55', color: 'var(--color-text-primary)', whiteSpace: 'pre-line', padding: '6px 0' }}>{sess.recap}</div>
                          ) : sess.recap_error && !generatingSessionIds[sess.id] ? (
                            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', backgroundColor: 'rgba(0,0,0,0.03)', padding: '5px 8px', borderRadius: '4px' }}>
                              <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Recap note: </span>
                              {sess.recap_error}
                            </div>
                          ) : sess.is_meaningful ? (
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                              {generatingSessionIds[sess.id] ? 'Recalling this session…' : 'Recap not generated yet.'}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '2px 0' }}>Brief session (under automatic recap threshold).</div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '6px', marginTop: '2px', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => onSelectPage(sess.start_page)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.74rem', color: 'var(--color-secondary)', fontWeight: 600 }}
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
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}
                                title="Correct start/end pages"
                              >
                                <Edit3 size={11} />
                                <span>Edit</span>
                              </button>

                              {onRegenerateSessionRecap && sess.is_meaningful && !sess.recap && !generatingSessionIds[sess.id] && (
                                <button
                                  type="button"
                                  onClick={() => onRegenerateSessionRecap(sess.id)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}
                                  title="Regenerate recap"
                                >
                                  <RotateCcw size={11} />
                                  <span>Get recap</span>
                                </button>
                              )}
                            </div>

                            {onDeleteSession && (
                              <button
                                type="button"
                                onClick={() => onDeleteSession(sess.id)}
                                style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--color-text-muted)', opacity: 0.7 }}
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
