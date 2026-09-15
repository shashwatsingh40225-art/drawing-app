import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useBookStore } from '../stores/bookStore';
import { useReadingProgressStore } from '../stores/readingProgressStore';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { useToastStore } from '../stores/toastStore';
import { useReadingSessionStore, RecapBookSource } from '../stores/readingSessionStore';
import { getBookSignedUrl } from '../services/bookService';
import { isTransientRecapError, RecapErrorCode } from '../services/geminiRecapService';
import { SessionDraft, maxEditablePage, pickBridgeSession } from '../services/readingSessionLogic';
import { useReadingSessionTracker, SessionCloseReason } from '../hooks/useReadingSessionTracker';
import { ReaderToolbar } from '../components/reader/ReaderToolbar';
import { ReaderSidebar } from '../components/reader/ReaderSidebar';
import { ReaderViewport } from '../components/reader/ReaderViewport';
import { ReadingProgressBar } from '../components/reader/ReadingProgressBar';
import { MemoryBridgeCard } from '../components/reader/MemoryBridgeCard';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { ConcentricPortal } from '../components/ConcentricPortal';
import { KIN_ARCHIVE_BY_ID } from '../data/kinArchive';
import { Book, ReadingSession } from '../types/book';

const NO_SESSIONS: ReadingSession[] = [];

function recapSource(book: Book): RecapBookSource {
  return { filePath: book.file_path, title: book.title, author: book.author };
}

export const ReaderScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const { getBookById, updateBook, fetchBooks } = useBookStore();
  const { getProgress, fetchProgress, saveProgress, flushProgress } = useReadingProgressStore();
  const { getBookmarks, fetchBookmarks, addBookmark, removeBookmark, isPageBookmarked } = useBookmarkStore();
  const {
    fetchAnnotations,
    getAnnotationsForPage,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    annotations,
  } = useAnnotationStore();
  const { showToast } = useToastStore();

  const bookSessions = useReadingSessionStore((s) => (id ? s.sessionsByBookId[id] : undefined)) ?? NO_SESSIONS;
  const generatingIds = useReadingSessionStore((s) => s.generatingIds);
  const fetchSessions = useReadingSessionStore((s) => s.fetchSessions);
  const getFrontier = useReadingSessionStore((s) => s.getFrontier);
  const saveFinishedSession = useReadingSessionStore((s) => s.saveFinishedSession);
  const updateSessionBoundaries = useReadingSessionStore((s) => s.updateSessionBoundaries);
  const generateRecap = useReadingSessionStore((s) => s.generateRecap);
  const markRecapViewed = useReadingSessionStore((s) => s.markRecapViewed);
  const deleteSession = useReadingSessionStore((s) => s.deleteSession);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [urlReloadKey, setUrlReloadKey] = useState(0);
  const [loadingUrl, setLoadingUrl] = useState<boolean>(true);
  const [docLoaded, setDocLoaded] = useState(false);
  const [booksFetched, setBooksFetched] = useState(false);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [activeSidebar, setActiveSidebar] = useState<'thumbnails' | 'bookmarks' | 'notes' | 'archive' | 'recap' | null>(null);
  const [isQuietReading, setIsQuietReading] = useState<boolean>(false);
  const [isChromeFaded, setIsChromeFaded] = useState<boolean>(false);
  const [bridgeSessionId, setBridgeSessionId] = useState<string | null>(null);

  const checkIsMobile = () =>
    typeof window !== 'undefined' && (window.innerWidth <= 768 || window.innerHeight <= 500);
  const [isMobile, setIsMobile] = useState<boolean>(checkIsMobile);

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

  const book = id ? getBookById(id) : undefined;
  const progress = id ? getProgress(id) : undefined;
  const bookmarks = id ? getBookmarks(id) : [];
  const bookAnnotations = id ? annotations.filter((a) => a.book_id === id) : [];
  const pageAnnotations = id ? getAnnotationsForPage(id, currentPage) : [];

  const userNavigatedRef = useRef(false);
  const bridgeCheckedForRef = useRef<string | null>(null);
  const autoRecapAttemptedRef = useRef(new Set<string>());
  const bridgeSessionIdRef = useRef<string | null>(null);
  bridgeSessionIdRef.current = bridgeSessionId;

  // 1. Restore the reading position for this book: ?page= wins, then the saved position.
  useEffect(() => {
    if (!id) return;
    userNavigatedRef.current = false;
    const saved = getProgress(id);
    const pageParam = parseInt(searchParams.get('page') ?? '', 10);
    if (!isNaN(pageParam) && pageParam >= 1) {
      setCurrentPage(pageParam);
    } else {
      setCurrentPage(saved?.current_page || 1);
    }
    if (saved?.zoom_level) setZoomScale(saved.zoom_level);
    const knownTotal = saved?.total_pages || getBookById(id)?.page_count;
    if (knownTotal) setTotalPages(knownTotal);
  }, [id, searchParams]);

  // 2. Fetch book data. A newer server position is applied only if the reader hasn't moved yet.
  useEffect(() => {
    let active = true;
    setBooksFetched(false);
    setSessionsReady(false);
    fetchBooks().finally(() => {
      if (active) setBooksFetched(true);
    });
    if (id) {
      fetchProgress(id).then((serverProgress) => {
        if (!active || !serverProgress || userNavigatedRef.current || searchParams.get('page')) return;
        setCurrentPage(serverProgress.current_page);
      });
      fetchBookmarks(id);
      fetchAnnotations(id);
      fetchSessions(id).finally(() => {
        if (active) setSessionsReady(true);
      });
    }
    return () => {
      active = false;
    };
  }, [id, fetchBooks, fetchProgress, fetchBookmarks, fetchAnnotations, fetchSessions]);

  // 3. Resolve the book file. Keyed on the file path, not the book object, so metadata updates
  //    (e.g. page_count) never reload the document.
  const filePath = book?.file_path;
  useEffect(() => {
    if (!filePath) return;
    let active = true;
    let createdUrl: string | null = null;
    setLoadingUrl(true);
    setFileError(null);
    setDocLoaded(false);

    getBookSignedUrl(filePath).then((resolved) => {
      const isOwnBlob = Boolean(resolved && resolved.startsWith('blob:') && resolved !== filePath);
      if (!active) {
        if (isOwnBlob) URL.revokeObjectURL(resolved as string);
        return;
      }
      if (isOwnBlob) createdUrl = resolved;
      if (!resolved) {
        setFileError("This book's file couldn't be retrieved. Check your connection and try again.");
      }
      setPdfUrl(resolved);
      setLoadingUrl(false);
    });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [filePath, urlReloadKey]);

  // 4. Reading sessions — inferred automatically while the document is on screen.
  const handleSessionClosed = useCallback(
    (draft: SessionDraft, reason: SessionCloseReason) => {
      const saved = saveFinishedSession(draft);
      if (!saved.is_meaningful) return;

      if ((reason === 'break' || reason === 'recovered') && draft.bookId === id) {
        // Returning after a real break: bridge from what was read before it.
        const pick = pickBridgeSession(useReadingSessionStore.getState().sessionsByBookId[draft.bookId] ?? [], Date.now());
        if (pick) setBridgeSessionId(pick.id);
      }

      const sourceBook = getBookById(draft.bookId);
      if (sourceBook) {
        autoRecapAttemptedRef.current.add(saved.id);
        void generateRecap(saved.id, recapSource(sourceBook));
      }
    },
    [id, saveFinishedSession, getBookById, generateRecap]
  );

  useReadingSessionTracker({
    bookId: id,
    currentPage,
    enabled: Boolean(id && book && docLoaded),
    getFrontier,
    onSessionClosed: handleSessionClosed,
    onHidden: flushProgress,
  });

  useEffect(() => () => flushProgress(), [id, flushProgress]);

  // 5. "Previously…" — decided once per open, after sessions have loaded.
  useEffect(() => {
    if (!id || !sessionsReady || bridgeCheckedForRef.current === id) return;
    bridgeCheckedForRef.current = id;
    const pick = pickBridgeSession(useReadingSessionStore.getState().sessionsByBookId[id] ?? [], Date.now());
    setBridgeSessionId(pick ? pick.id : null);
  }, [id, sessionsReady]);

  const bridgeSession = bridgeSessionId ? bookSessions.find((s) => s.id === bridgeSessionId) ?? null : null;
  const bridgeGenerating = bridgeSession ? Boolean(generatingIds[bridgeSession.id]) : false;
  const bridgePermanentlyUnavailable = Boolean(
    bridgeSession &&
      !bridgeSession.recap &&
      !bridgeGenerating &&
      bridgeSession.recap_error_code &&
      !isTransientRecapError(bridgeSession.recap_error_code as RecapErrorCode)
  );
  const editableLimit = Math.min(
    Math.max(totalPages, 1),
    maxEditablePage(bookSessions, Math.max(progress?.current_page ?? 1, currentPage))
  );

  // Generate a missing recap for the bridge in the background — never blocks the book.
  useEffect(() => {
    if (!bridgeSession || bridgeSession.recap || !book) return;
    if (autoRecapAttemptedRef.current.has(bridgeSession.id)) return;
    autoRecapAttemptedRef.current.add(bridgeSession.id);
    void generateRecap(bridgeSession.id, recapSource(book));
  }, [bridgeSession?.id, bridgeSession?.recap, book?.id, generateRecap]);

  const closeBridge = useCallback(
    (reason: 'explicit' | 'page-turn') => {
      const sessionId = bridgeSessionIdRef.current;
      if (!sessionId) return;
      const session = bookSessions.find((s) => s.id === sessionId);
      // Turning the page while the recap is still loading doesn't count as having seen it.
      if (reason === 'explicit' || session?.recap) markRecapViewed(sessionId);
      setBridgeSessionId(null);
    },
    [bookSessions, markRecapViewed]
  );

  // 6. Change page (local save is immediate, the server write is debounced in the store)
  const handlePageChange = useCallback(
    (targetPage: number) => {
      const clamped = Math.max(1, Math.min(totalPages || 1, targetPage));
      userNavigatedRef.current = true;
      setCurrentPage(clamped);
      if (bridgeSessionIdRef.current) closeBridge('page-turn');
      if (id) {
        saveProgress(id, clamped, totalPages, 0, zoomScale);
      }
    },
    [id, totalPages, zoomScale, saveProgress, closeBridge]
  );

  const handleUpdateBoundaries = useCallback(
    async (sessionId: string, startPage: number, endPage: number): Promise<boolean> => {
      const updated = await updateSessionBoundaries(sessionId, startPage, endPage, editableLimit);
      if (!updated) {
        showToast({ type: 'error', message: `Choose pages between 1 and ${editableLimit}.` });
        return false;
      }
      if (book) {
        autoRecapAttemptedRef.current.add(updated.id);
        void generateRecap(updated.id, recapSource(book), { force: true });
      }
      return true;
    },
    [updateSessionBoundaries, editableLimit, book, generateRecap, showToast]
  );

  const handleRetryRecap = useCallback(
    (sessionId: string) => {
      if (book) void generateRecap(sessionId, recapSource(book), { force: true });
    },
    [book, generateRecap]
  );

  // 7. Document load success
  const handleDocumentLoadSuccess = (numPages: number) => {
    setTotalPages(numPages);
    setDocLoaded(true);
    setCurrentPage((page) => Math.min(page, numPages));
    if (id && (!book?.page_count || book.page_count !== numPages)) {
      updateBook(id, { page_count: numPages });
    }
  };

  // 8. Bookmark toggle
  const handleToggleBookmark = async () => {
    if (!id) return;
    const isBookmarked = isPageBookmarked(id, currentPage);
    if (isBookmarked) {
      const bm = bookmarks.find((b) => b.book_id === id && b.page_number === currentPage);
      if (bm) {
        await removeBookmark(bm.id);
        showToast({ type: 'info', message: `Bookmark on page ${currentPage} removed` });
      }
    } else {
      await addBookmark(id, currentPage, `Page ${currentPage} study note`);
      showToast({ type: 'success', message: `Page ${currentPage} bookmarked` });
    }
  };

  // 9. Add annotation at coordinates
  const handleAddNoteAt = async (x_percent: number, y_percent: number) => {
    if (!id) return;
    setIsAddingNote(false);
    const newAnn = await addAnnotation({
      book_id: id,
      page_number: currentPage,
      type: 'note',
      content: 'Observation on page ' + currentPage,
      x_percent,
      y_percent,
    });
    if (newAnn) {
      showToast({ type: 'success', message: `Note placed on page ${currentPage}` });
    }
  };

  // 10. Pin Kin Archive asset to current page
  const handlePinArchiveAsset = async (assetId: string) => {
    if (!id) return;
    const asset = KIN_ARCHIVE_BY_ID[assetId];
    const newAnn = await addAnnotation({
      book_id: id,
      page_number: currentPage,
      type: 'archive_ref',
      content: asset?.title || 'Studio reference',
      ref_archive_asset_id: assetId,
      x_percent: 50,
      y_percent: 35,
    });
    if (newAnn) {
      showToast({ type: 'success', message: `Pinned ${asset?.code} to page ${currentPage}` });
    }
  };

  // 11. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          handlePageChange(currentPage - 1);
          break;
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          handlePageChange(currentPage + 1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoomScale((z) => Math.min(2.5, z + 0.15));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setZoomScale((z) => Math.max(0.5, z - 0.15));
          break;
        case '0':
          e.preventDefault();
          setZoomScale(1.0);
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          handleToggleBookmark();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setIsFocusMode((f) => !f);
          break;
        case 'q':
        case 'Q':
          e.preventDefault();
          setIsQuietReading((q) => !q);
          break;
        case 'Escape':
          if (bridgeSessionIdRef.current) {
            e.preventDefault();
            closeBridge('explicit');
          } else if (isAddingNote) {
            e.preventDefault();
            setIsAddingNote(false);
          } else if (isFocusMode) {
            e.preventDefault();
            setIsFocusMode(false);
          } else if (activeSidebar) {
            e.preventDefault();
            setActiveSidebar(null);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, handlePageChange, isFocusMode, isAddingNote, activeSidebar, handleToggleBookmark, closeBridge]);

  // Chrome fade-on-read inactivity timer (3.5s)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      setIsChromeFaded(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setIsChromeFaded(true);
      }, 3500);
    };

    resetTimer();

    const events = ['mousemove', 'mousedown', 'scroll', 'touchstart', 'keydown'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, []);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (zoomScale <= 1.0) {
        handlePageChange(currentPage + 1);
      }
    },
    onSwipeRight: () => {
      if (zoomScale <= 1.0) {
        handlePageChange(currentPage - 1);
      }
    },
  });

  // All hooks are above this line: the early return below must not change the hook order.
  if (!book && booksFetched) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>Book not found</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          This document could not be found in your private library.
        </p>
        <Link to="/library" className="btn-primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius-pill)', textDecoration: 'none' }}>
          Return to Library
        </Link>
      </div>
    );
  }

  const bookmarked = id ? isPageBookmarked(id, currentPage) : false;
  const hasUnreadRecap = bookSessions.some((s) => s.is_meaningful && s.recap && !s.recap_viewed_at);

  return (
    <div
      className={isQuietReading ? 'quiet-reading-active' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: isFocusMode ? 'fixed' : 'relative',
        inset: isFocusMode ? 0 : 'auto',
        height: isFocusMode ? '100vh' : 'calc(100vh - 64px)',
        zIndex: isFocusMode ? 9999 : 'auto',
        backgroundColor: 'var(--color-background)',
        overflow: 'hidden',
      }}
    >
      <ReadingProgressBar currentPage={currentPage} totalPages={totalPages} />

      {/* Top Toolbar in Kin Layer */}
      <div className={`reader-kin-chrome ${isChromeFaded ? 'reader-kin-chrome-faded' : ''}`}>
        <ReaderToolbar
          bookTitle={book?.title || 'PDF Document'}
          bookId={book?.id || ''}
          currentPage={currentPage}
          totalPages={totalPages}
          zoomScale={zoomScale}
          isBookmarked={bookmarked}
          isFocusMode={isFocusMode}
          isAddingNote={isAddingNote}
          hasUnreadRecap={hasUnreadRecap}
          activeSidebar={activeSidebar}
          onPageChange={handlePageChange}
          onZoomChange={setZoomScale}
          onToggleBookmark={handleToggleBookmark}
          onToggleAddNote={() => setIsAddingNote(!isAddingNote)}
          onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
          onToggleSidebar={(sidebar) =>
            setActiveSidebar((current) => (current === sidebar ? null : sidebar))
          }
          onFitWidth={() => setZoomScale(1.3)}
          onFitPage={() => setZoomScale(1.0)}
          isQuietReading={isQuietReading}
          onToggleQuietReading={() => setIsQuietReading((q) => !q)}
        />
      </div>

      {/* Reader Main Layout */}
      <div {...swipeHandlers} style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {loadingUrl ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <ConcentricPortal size={70} />
            <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}>
              Opening book...
            </div>
          </div>
        ) : fileError ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div
              role="alert"
              style={{
                maxWidth: '420px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '28px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <AlertCircle size={32} color="var(--color-error)" style={{ marginBottom: '10px' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: '0 0 18px' }}>{fileError}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setUrlReloadKey((k) => k + 1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px', padding: '10px 20px', borderRadius: 'var(--radius-pill)', cursor: 'pointer' }}
              >
                <RefreshCw size={15} />
                <span>Try again</span>
              </button>
            </div>
          </div>
        ) : (
          <ReaderViewport
            fileUrl={pdfUrl}
            bookId={book?.id || ''}
            currentPage={currentPage}
            zoomScale={zoomScale}
            bookTitle={book?.title || ''}
            annotations={pageAnnotations}
            isAddingNote={isAddingNote}
            onAddNoteAt={handleAddNoteAt}
            onUpdateAnnotation={updateAnnotation}
            onDeleteAnnotation={deleteAnnotation}
            onLoadSuccess={handleDocumentLoadSuccess}
            isQuietReading={isQuietReading}
            isFocusMode={isFocusMode}
          />
        )}

        {/* "Previously…" memory bridge — floats over the page, never blocks it from loading */}
        {bridgeSession && !bridgePermanentlyUnavailable && (
          <MemoryBridgeCard
            session={bridgeSession}
            isGenerating={bridgeGenerating}
            isMobile={isMobile}
            isFocusMode={isFocusMode}
            maxEditablePage={editableLimit}
            sidebarOffset={activeSidebar && !isMobile ? 320 : 0}
            onClose={() => closeBridge('explicit')}
            onUpdateBoundaries={(start, end) => handleUpdateBoundaries(bridgeSession.id, start, end)}
            onRetry={() => handleRetryRecap(bridgeSession.id)}
          />
        )}

        {/* Sidebar */}
        {activeSidebar && (
          <ReaderSidebar
            mode={activeSidebar}
            totalPages={totalPages}
            currentPage={currentPage}
            bookmarks={bookmarks}
            annotations={bookAnnotations}
            sessions={bookSessions}
            generatingSessionIds={generatingIds}
            maxEditablePage={editableLimit}
            onSelectPage={handlePageChange}
            onRemoveBookmark={(bmId) => removeBookmark(bmId)}
            onDeleteAnnotation={(annId) => deleteAnnotation(annId)}
            onPinArchiveAsset={handlePinArchiveAsset}
            onUpdateSessionBoundaries={async (sessId, sPage, ePage) => {
              if (await handleUpdateBoundaries(sessId, sPage, ePage)) {
                showToast({ type: 'success', message: `Session updated to pages ${sPage}–${Math.min(ePage, editableLimit)}` });
              }
            }}
            onRegenerateSessionRecap={async (sessId) => handleRetryRecap(sessId)}
            onDeleteSession={async (sessId) => {
              await deleteSession(sessId);
              showToast({ type: 'info', message: 'Reading session record deleted' });
            }}
            onClose={() => setActiveSidebar(null)}
          />
        )}
      </div>
    </div>
  );
};
