import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useBookStore } from '../stores/bookStore';
import { useReadingProgressStore } from '../stores/readingProgressStore';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useAnnotationStore } from '../stores/annotationStore';
import { useToastStore } from '../stores/toastStore';
import { getBookSignedUrl } from '../services/bookService';
import { ReaderToolbar } from '../components/reader/ReaderToolbar';
import { ReaderSidebar } from '../components/reader/ReaderSidebar';
import { ReaderViewport } from '../components/reader/ReaderViewport';
import { ReadingProgressBar } from '../components/reader/ReadingProgressBar';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { ConcentricPortal } from '../components/ConcentricPortal';
import { KIN_ARCHIVE_BY_ID } from '../data/kinArchive';

export const ReaderScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { getBookById, updateBook, fetchBooks } = useBookStore();
  const { getProgress, fetchProgress, saveProgress } = useReadingProgressStore();
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

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [activeSidebar, setActiveSidebar] = useState<'thumbnails' | 'bookmarks' | 'notes' | 'archive' | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<boolean>(true);
  const [isQuietReading, setIsQuietReading] = useState<boolean>(false);
  const [isChromeFaded, setIsChromeFaded] = useState<boolean>(false);

  const book = id ? getBookById(id) : undefined;
  const progress = id ? getProgress(id) : undefined;
  const bookmarks = id ? getBookmarks(id) : [];
  const bookAnnotations = id ? annotations.filter((a) => a.book_id === id) : [];
  const pageAnnotations = id ? getAnnotationsForPage(id, currentPage) : [];

  // 1. Initial data fetch
  useEffect(() => {
    fetchBooks();
    if (id) {
      fetchProgress(id);
      fetchBookmarks(id);
      fetchAnnotations(id);
    }
  }, [id, fetchBooks, fetchProgress, fetchBookmarks, fetchAnnotations]);

  // 2. Fetch signed URL or local URL for book's file
  useEffect(() => {
    let active = true;
    const loadUrl = async () => {
      if (!book) return;
      setLoadingUrl(true);

      // If file_path is already a direct path/URL
      if (
        book.file_path.startsWith('blob:') ||
        book.file_path.startsWith('data:') ||
        book.file_path.startsWith('http') ||
        book.file_path.startsWith('/')
      ) {
        if (active) {
          setPdfUrl(book.file_path);
          setLoadingUrl(false);
        }
        return;
      }

      const signed = await getBookSignedUrl(book.file_path);
      if (active) {
        setPdfUrl(signed || book.file_path);
        setLoadingUrl(false);
      }
    };

    loadUrl();
    return () => {
      active = false;
    };
  }, [book]);

  // 3. Set initial page from URL query param or saved progress
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const p = parseInt(pageParam, 10);
      if (!isNaN(p) && p >= 1) {
        setCurrentPage(p);
        return;
      }
    }

    if (progress?.current_page) {
      setCurrentPage(progress.current_page);
    }
    if (progress?.zoom_level) {
      setZoomScale(progress.zoom_level);
    }
    if (progress?.total_pages) {
      setTotalPages(progress.total_pages);
    } else if (book?.page_count) {
      setTotalPages(book.page_count);
    }
  }, [searchParams, progress, book]);

  // 4. Change page handler with auto-save
  const handlePageChange = useCallback(
    (targetPage: number) => {
      const clamped = Math.max(1, Math.min(totalPages || 1, targetPage));
      setCurrentPage(clamped);

      if (id) {
        saveProgress(id, clamped, totalPages, 0, zoomScale);
      }
    },
    [id, totalPages, zoomScale, saveProgress]
  );

  // 5. Document load success
  const handleDocumentLoadSuccess = (numPages: number) => {
    setTotalPages(numPages);
    if (id && (!book?.page_count || book.page_count !== numPages)) {
      updateBook(id, { page_count: numPages });
    }
  };

  // 6. Bookmark toggle
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

  // 7. Add annotation at coordinates
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

  // 8. Pin Kin Archive asset to current page
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

  // 8. Keyboard shortcuts
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
          if (isAddingNote) {
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
  }, [currentPage, handlePageChange, isFocusMode, isAddingNote, activeSidebar, handleToggleBookmark]);

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

  if (!book && !loadingUrl) {
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

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => handlePageChange(currentPage + 1),
    onSwipeRight: () => handlePageChange(currentPage - 1),
  });

  const bookmarked = id ? isPageBookmarked(id, currentPage) : false;

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
            onSelectPage={handlePageChange}
            onRemoveBookmark={(bmId) => removeBookmark(bmId)}
            onDeleteAnnotation={(annId) => deleteAnnotation(annId)}
            onPinArchiveAsset={handlePinArchiveAsset}
            onClose={() => setActiveSidebar(null)}
          />
        )}
      </div>
    </div>
  );
};
