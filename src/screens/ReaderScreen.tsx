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
import { ReaderPageStrip } from '../components/reader/ReaderPageStrip';
import { ReaderZoomStrip } from '../components/reader/ReaderZoomStrip';
import { ReaderToolsPanel } from '../components/reader/ReaderToolsPanel';
import { AddPinChooser } from '../components/reader/AddPinChooser';
import { ReaderViewport } from '../components/reader/ReaderViewport';
import { EpubViewport, EpubViewportHandle } from '../components/reader/EpubViewport';
import { ReadingProgressBar } from '../components/reader/ReadingProgressBar';
import { MemoryBridgeCard } from '../components/reader/MemoryBridgeCard';
import { PendingPin } from '../components/reader/AnnotationOverlay';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { ConcentricPortal } from '../components/ConcentricPortal';
import { KIN_ARCHIVE_BY_ID } from '../data/kinArchive';
import { Book, Bookmark, ReadingSession } from '../types/book';

const NO_SESSIONS: ReadingSession[] = [];

function recapSource(book: Book): RecapBookSource {
  return { filePath: book.file_path, title: book.title, author: book.author, format: book.format };
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
  // EPUB only: `currentPage`/`totalPages` are spine sections (chapters), the only unit bookmarks
  // and reading sessions track — coarse enough that the progress bar/strip would otherwise sit
  // frozen for dozens of page turns within one chapter. epub.js reports pagination within the
  // section actually on screen directly on every relocation; this mirrors that for display only.
  const [epubIntraProgress, setEpubIntraProgress] = useState<{ fraction: number; page: number; total: number } | null>(null);
  const [chapterTitles, setChapterTitles] = useState<string[] | undefined>(undefined);
  // EPUB only: precise position within currentPage's spine section. `epubNav.cfi` paired with
  // `epubNav.token` requests a jump to that exact position (see EpubViewport's targetCfi/navToken);
  // `currentCfi` mirrors the live position as the reader moves, for progress-saving and bookmarks.
  const [epubNav, setEpubNav] = useState<{ token: number; cfi: string | null }>({ token: 0, cfi: null });
  const [currentCfi, setCurrentCfi] = useState<string | null>(null);
  const epubViewportRef = useRef<EpubViewportHandle>(null);
  const lastCfiForPageRef = useRef<{ page: number; cfi: string } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [fitToPage, setFitToPage] = useState<boolean>(false);
  const [nightMode, setNightMode] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('kin_reader_night_mode') === '1'
  );
  const toggleNightMode = useCallback(() => {
    setNightMode((v) => {
      const next = !v;
      if (typeof window !== 'undefined') {
        localStorage.setItem('kin_reader_night_mode', next ? '1' : '0');
      }
      return next;
    });
  }, []);
  // Full-screen is the default reading mode on every device; tapping the page centre reveals chrome.
  const [isChromeVisible, setIsChromeVisible] = useState<boolean>(false);

  // Immersive reading also asks the browser itself for the Fullscreen API, which hides the
  // browser's own address bar / nav bar on platforms that support it (mainly Android Chrome —
  // iOS Safari doesn't expose this on iPhone, so there it's a no-op and the tap-to-hide chrome
  // above is still the main lever). Best-effort: never blocks reading if the browser refuses.
  //
  // This is requested once per reading session, not on every chrome show/hide tap: entering and
  // leaving native Fullscreen re-triggers the browser's own "swipe down to exit" toast each time,
  // which was firing on every single tap and made the reader unusable. So showing the chrome again
  // does NOT exit fullscreen — the session stays fullscreen (independent of our own chrome overlay)
  // until the reader screen itself is left, when the effect below releases it exactly once.
  const requestImmersive = useCallback(() => {
    const el = document.documentElement;
    if (document.fullscreenElement || !el.requestFullscreen) return;
    el.requestFullscreen().catch(() => {});
  }, []);
  const exitImmersive = useCallback(() => {
    if (!document.fullscreenElement || !document.exitFullscreen) return;
    document.exitFullscreen().catch(() => {});
  }, []);
  const toggleChromeVisible = useCallback(() => {
    setIsChromeVisible((v) => {
      const next = !v;
      if (!next) requestImmersive();
      return next;
    });
  }, [requestImmersive]);
  // Leaving the reader screen must always release fullscreen, however it was left.
  useEffect(() => () => exitImmersive(), [exitImmersive]);
  const [showTapHint, setShowTapHint] = useState<boolean>(
    () => typeof window !== 'undefined' && !localStorage.getItem('kin_reader_hint_seen')
  );
  const [toolsOpen, setToolsOpen] = useState<boolean>(false);
  const [pinChooserOpen, setPinChooserOpen] = useState<boolean>(false);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
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
  const isEpub = book?.format === 'epub';
  const progress = id ? getProgress(id) : undefined;
  const bookmarks = id ? getBookmarks(id) : [];
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
    setChapterTitles(undefined);
    setEpubIntraProgress(null);
    const saved = getProgress(id);
    const pageParam = parseInt(searchParams.get('page') ?? '', 10);
    const hasPageParam = !isNaN(pageParam) && pageParam >= 1;
    if (hasPageParam) {
      setCurrentPage(pageParam);
    } else {
      setCurrentPage(saved?.current_page || 1);
    }
    setCurrentCfi(hasPageParam ? null : saved?.epub_cfi ?? null);
    setEpubNav({ token: 0, cfi: hasPageParam ? null : saved?.epub_cfi ?? null });
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
        setCurrentCfi(serverProgress.epub_cfi ?? null);
        setEpubNav({ token: 0, cfi: serverProgress.epub_cfi ?? null });
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
      const cfiForEnd = lastCfiForPageRef.current?.page === draft.endPage ? lastCfiForPageRef.current.cfi : null;
      const saved = saveFinishedSession(draft, cfiForEnd);
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

  // 6. Change page (local save is immediate, the server write is debounced in the store).
  // `cfi` (EPUB only): omit it entirely for an internal, section-crossing page report (epub.js
  // already tracks the precise position via onLocationChange below) — pass null explicitly for
  // an external jump to a section's start (chapter select), or a string for a precise position
  // (a bookmark that carries one).
  const handlePageChange = useCallback(
    (targetPage: number, cfi?: string | null) => {
      const clamped = Math.max(1, Math.min(totalPages || 1, targetPage));
      userNavigatedRef.current = true;
      setCurrentPage(clamped);
      if (cfi !== undefined) {
        setCurrentCfi(cfi);
        setEpubNav((n) => ({ token: n.token + 1, cfi }));
      } else {
        // An internal, section-crossing turn (epub.js already relocated there on its own — see
        // EpubViewport's 'relocated' handler, which omits `cfi` for exactly this case). Any
        // previously-requested target CFI (from opening at a saved position, a bookmark, etc.) is
        // now stale: leaving it set would make EpubViewport's nav effect re-jump to that old
        // position the moment `currentPage` changes again, permanently trapping the reader on
        // whichever chapter they first opened the book to.
        setEpubNav((n) => (n.cfi === null ? n : { ...n, cfi: null }));
      }
      if (bridgeSessionIdRef.current) closeBridge('page-turn');
      if (id) {
        saveProgress(id, clamped, totalPages, 0, zoomScale, undefined, cfi);
      }
    },
    [id, totalPages, zoomScale, saveProgress, closeBridge]
  );

  // Precise, live position as the reader moves through an EPUB (every relocation, not just
  // section crossings) — keeps resume position and the recap spoiler guard accurate to the
  // on-screen location instead of only the chapter.
  const handleEpubLocationChange = useCallback(
    (cfi: string, page: number) => {
      setCurrentCfi(cfi);
      lastCfiForPageRef.current = { page, cfi };
      if (id) saveProgress(id, page, totalPages, 0, zoomScale, undefined, cfi);
    },
    [id, totalPages, zoomScale, saveProgress]
  );

  const handleEpubIntraProgress = useCallback(
    (info: { sectionIndex: number; sectionCount: number; displayedPage: number; displayedTotal: number }) => {
      const sectionCount = Math.max(1, info.sectionCount);
      const displayedTotal = Math.max(1, info.displayedTotal);
      const withinSection = (info.displayedPage - 1) / displayedTotal;
      setEpubIntraProgress({
        fraction: (info.sectionIndex + withinSection) / sectionCount,
        page: info.displayedPage,
        total: info.displayedTotal,
      });
    },
    []
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

  // Minimal, one-time tap-zone hint — shown once per browser, dismissed by any tap or after a few seconds.
  const dismissTapHint = useCallback(() => {
    setShowTapHint(false);
    localStorage.setItem('kin_reader_hint_seen', '1');
  }, []);

  useEffect(() => {
    if (!showTapHint) return;
    const timer = setTimeout(dismissTapHint, 4000);
    return () => clearTimeout(timer);
  }, [showTapHint, dismissTapHint]);

  // 7. Document load success
  const handleDocumentLoadSuccess = (numPages: number) => {
    setTotalPages(numPages);
    setDocLoaded(true);
    setCurrentPage((page) => Math.min(page, numPages));
    if (id && (!book?.page_count || book.page_count !== numPages)) {
      updateBook(id, { page_count: numPages });
    }
  };

  // 8. Bookmark toggle. EPUB: keyed on the precise on-screen CFI, not just the chapter, so
  // multiple screens within one chapter can each be bookmarked independently.
  const handleToggleBookmark = useCallback(async () => {
    if (!id) return;
    const cfi = isEpub ? currentCfi : null;
    const isBookmarked = isPageBookmarked(id, currentPage, cfi);
    if (isBookmarked) {
      const bm = bookmarks.find(
        (b) => b.book_id === id && b.page_number === currentPage && (cfi ? b.epub_cfi === cfi : !b.epub_cfi)
      );
      if (bm) {
        await removeBookmark(bm.id);
        showToast({ type: 'info', message: `Bookmark on page ${currentPage} removed` });
      }
    } else {
      await addBookmark(id, currentPage, `Page ${currentPage} study note`, undefined, cfi);
      showToast({ type: 'success', message: `Page ${currentPage} bookmarked` });
    }
  }, [id, currentPage, isEpub, currentCfi, isPageBookmarked, bookmarks, removeBookmark, addBookmark, showToast]);

  // 9. Place the pending pin (note or archive reference) at a tapped point on the page
  const handlePlacePin = useCallback(
    async (x_percent: number, y_percent: number) => {
      if (!id || !pendingPin) return;
      const pin = pendingPin;
      setPendingPin(null);

      if (pin.type === 'note') {
        const newAnn = await addAnnotation({
          book_id: id,
          page_number: currentPage,
          type: 'note',
          content: 'Observation on page ' + currentPage,
          x_percent,
          y_percent,
        });
        if (newAnn) showToast({ type: 'success', message: `Note placed on page ${currentPage}` });
      } else {
        const asset = KIN_ARCHIVE_BY_ID[pin.assetId];
        const newAnn = await addAnnotation({
          book_id: id,
          page_number: currentPage,
          type: 'archive_ref',
          content: asset?.title || 'Studio reference',
          ref_archive_asset_id: pin.assetId,
          x_percent,
          y_percent,
        });
        if (newAnn) showToast({ type: 'success', message: `Pinned ${asset?.code} to page ${currentPage}` });
      }
    },
    [id, currentPage, pendingPin, addAnnotation, showToast]
  );

  // 11. Keyboard shortcuts. Extracted so the same non-navigation commands (zoom, bookmark,
  // escape) can also be reached from EpubViewport's own keydown listener — a window-level
  // listener here never sees a keydown that landed inside the book's iframe (a separate browsing
  // context), so without forwarding, those shortcuts would be dead whenever the book itself has
  // focus rather than the surrounding chrome.
  const handleReaderKeyCommand = useCallback(
    (key: string) => {
      switch (key) {
        case '+':
        case '=':
          setFitToPage(false);
          setZoomScale((z) => Math.min(2.5, z + 0.15));
          break;
        case '-':
        case '_':
          setFitToPage(false);
          setZoomScale((z) => Math.max(0.5, z - 0.15));
          break;
        case '0':
          setFitToPage(false);
          setZoomScale(1.0);
          break;
        case 'b':
        case 'B':
          void handleToggleBookmark();
          break;
        case 'Escape':
          if (bridgeSessionIdRef.current) {
            closeBridge('explicit');
          } else if (pinChooserOpen || pendingPin) {
            setPinChooserOpen(false);
            setPendingPin(null);
          } else if (toolsOpen) {
            setToolsOpen(false);
          }
          break;
        default:
          break;
      }
    },
    [handleToggleBookmark, pinChooserOpen, pendingPin, toolsOpen, closeBridge]
  );

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
          // EPUB: turn exactly one on-screen page, like the book's own iframe keyboard handler —
          // handlePageChange would jump a whole spine section (chapter) instead.
          if (isEpub) epubViewportRef.current?.prev();
          else handlePageChange(currentPage - 1);
          break;
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          if (isEpub) epubViewportRef.current?.next();
          else handlePageChange(currentPage + 1);
          break;
        case '+':
        case '=':
        case '-':
        case '_':
        case '0':
        case 'b':
        case 'B':
        case 'Escape':
          e.preventDefault();
          handleReaderKeyCommand(e.key);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, handlePageChange, isEpub, handleReaderKeyCommand]);

  // PDF only: this turns a whole page on its own. EPUB has its own independent swipe handling
  // inside EpubViewport's iframe listeners, which turns exactly one on-screen page via
  // epubViewportRef — routing the *same* gesture through this handler too, keyed on `currentPage`
  // (a whole spine section for EPUB), made an edge swipe skip an entire chapter.
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

  const bookmarked = id ? isPageBookmarked(id, currentPage, isEpub ? currentCfi : null) : false;
  const hasUnreadRecap = bookSessions.some((s) => s.is_meaningful && s.recap && !s.recap_viewed_at);
  const isChromeHidden = !isChromeVisible;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: isChromeHidden ? 'fixed' : 'relative',
        inset: isChromeHidden ? 0 : 'auto',
        // 100vh includes the area a mobile browser's retractable address/nav bar can cover;
        // 100dvh tracks the actual visible viewport (supported by all current browsers).
        height: '100dvh',
        zIndex: isChromeHidden ? 9999 : 'auto',
        backgroundColor: 'var(--color-background)',
        overflow: 'hidden',
      }}
    >
      <ReadingProgressBar
        currentPage={currentPage}
        totalPages={totalPages}
        fractionOverride={isEpub ? epubIntraProgress?.fraction : undefined}
      />

      {/* Chrome: top bar + page-position strip, shown/hidden as a single unit */}
      {isChromeVisible && (
        <div className="reader-kin-chrome">
          <ReaderToolbar
            bookTitle={book?.title || 'PDF Document'}
            bookId={book?.id || ''}
            isBookmarked={bookmarked}
            hasUnreadRecap={hasUnreadRecap}
            toolsOpen={toolsOpen}
            onToggleBookmark={handleToggleBookmark}
            onOpenTools={() => setToolsOpen((v) => !v)}
          />
          <ReaderPageStrip
            currentPage={currentPage}
            totalPages={totalPages}
            labelOverride={
              isEpub && epubIntraProgress
                ? `Page ${epubIntraProgress.page} of ${epubIntraProgress.total} · Chapter ${currentPage} of ${totalPages}`
                : undefined
            }
          />
        </div>
      )}

      {/* Reader Main Layout */}
      <div {...(isEpub ? {} : swipeHandlers)} style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
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
        ) : isEpub ? (
          <EpubViewport
            ref={epubViewportRef}
            fileUrl={pdfUrl}
            currentPage={currentPage}
            targetCfi={epubNav.cfi}
            navToken={epubNav.token}
            zoomScale={zoomScale}
            onLoadSuccess={handleDocumentLoadSuccess}
            onChaptersLoaded={setChapterTitles}
            isChromeHidden={isChromeHidden}
            nightMode={nightMode}
            onPageChange={handlePageChange}
            onLocationChange={handleEpubLocationChange}
            onIntraSectionProgress={handleEpubIntraProgress}
            onActivity={() => window.dispatchEvent(new Event('touchstart'))}
            onKeyCommand={handleReaderKeyCommand}
            onLeftTap={() => {
              if (showTapHint) dismissTapHint();
            }}
            onRightTap={() => {
              if (showTapHint) dismissTapHint();
            }}
            onCenterTap={() => {
              if (showTapHint) dismissTapHint();
              toggleChromeVisible();
            }}
          />
        ) : (
          <ReaderViewport
            fileUrl={pdfUrl}
            bookId={book?.id || ''}
            currentPage={currentPage}
            zoomScale={zoomScale}
            bookTitle={book?.title || ''}
            annotations={pageAnnotations}
            pendingPin={pendingPin}
            onPlacePin={handlePlacePin}
            onUpdateAnnotation={updateAnnotation}
            onDeleteAnnotation={deleteAnnotation}
            onLoadSuccess={handleDocumentLoadSuccess}
            isChromeHidden={isChromeHidden}
            fitToPage={fitToPage}
            nightMode={nightMode}
            onLeftTap={() => {
              if (showTapHint) dismissTapHint();
              handlePageChange(currentPage - 1);
            }}
            onRightTap={() => {
              if (showTapHint) dismissTapHint();
              handlePageChange(currentPage + 1);
            }}
            onCenterTap={() => {
              if (showTapHint) dismissTapHint();
              toggleChromeVisible();
            }}
          />
        )}

        {/* One-time hint: shown once per browser, explains tap zones, then never again */}
        {showTapHint && !loadingUrl && !fileError && (
          <div
            role="status"
            style={{
              position: 'absolute',
              left: '50%',
              bottom: isMobile ? '28px' : '36px',
              transform: 'translateX(-50%)',
              zIndex: 40,
              maxWidth: 'calc(100vw - 32px)',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(36, 19, 41, 0.88)',
              color: '#FFF',
              fontSize: '0.82rem',
              fontWeight: 500,
              whiteSpace: isMobile ? 'normal' : 'nowrap',
              pointerEvents: 'none',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            Tap the edges to turn pages · tap the middle for controls
          </div>
        )}

        {/* "Previously…" memory bridge — floats over the page, never blocks it from loading */}
        {bridgeSession && !bridgePermanentlyUnavailable && (
          <MemoryBridgeCard
            session={bridgeSession}
            isGenerating={bridgeGenerating}
            isMobile={isMobile}
            isChromeHidden={isChromeHidden}
            maxEditablePage={editableLimit}
            sidebarOffset={toolsOpen && !isMobile ? 320 : 0}
            onClose={() => closeBridge('explicit')}
            onUpdateBoundaries={(start, end) => handleUpdateBoundaries(bridgeSession.id, start, end)}
            onRetry={() => handleRetryRecap(bridgeSession.id)}
          />
        )}

        {isChromeVisible && (
          <ReaderZoomStrip
            zoomScale={zoomScale}
            onZoomChange={(scale) => {
              setFitToPage(false);
              setZoomScale(scale);
            }}
            onFitWidth={() => {
              setFitToPage(false);
              setZoomScale(1.0);
            }}
            onFitPage={() => setFitToPage(true)}
            showFitPage={!isEpub}
          />
        )}

        {/* Tools panel */}
        {toolsOpen && (
          <ReaderToolsPanel
            totalPages={totalPages}
            currentPage={currentPage}
            bookmarks={bookmarks}
            sessions={bookSessions}
            generatingSessionIds={generatingIds}
            hasUnreadRecap={hasUnreadRecap}
            maxEditablePage={editableLimit}
            chapterTitles={isEpub ? chapterTitles : undefined}
            onSelectPage={(page) => handlePageChange(page, isEpub ? null : undefined)}
            onSelectBookmark={(bm: Bookmark) => handlePageChange(bm.page_number, bm.epub_cfi ?? null)}
            onRemoveBookmark={(bmId) => removeBookmark(bmId)}
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
            onStartAddPin={() => {
              setToolsOpen(false);
              setPinChooserOpen(true);
            }}
            showAddPin={!isEpub}
            nightMode={nightMode}
            onToggleNightMode={toggleNightMode}
            onClose={() => setToolsOpen(false)}
          />
        )}
      </div>

      {/* Add Pin chooser */}
      {pinChooserOpen && (
        <AddPinChooser
          currentPage={currentPage}
          onChooseNote={() => {
            setPendingPin({ type: 'note' });
            setPinChooserOpen(false);
          }}
          onChooseArchiveAsset={(assetId) => {
            setPendingPin({ type: 'archive_ref', assetId });
            setPinChooserOpen(false);
          }}
          onClose={() => setPinChooserOpen(false)}
        />
      )}
    </div>
  );
};
