import React, { useEffect, useRef, useState } from 'react';
import ePub, { Book as EpubBook, Rendition } from 'epubjs';
import { ConcentricPortal } from '../ConcentricPortal';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { useTapZones } from '../../hooks/useTapZones';

interface EpubViewportProps {
  fileUrl: string | null;
  /** 1-indexed spine section (EPUB has no fixed page, so a "page" here is one chapter/section — see epubTextExtractor.ts). */
  currentPage: number;
  zoomScale: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  isChromeHidden?: boolean;
  nightMode?: boolean;
  /** Zone-based tap navigation, same contract as ReaderViewport: left/right turn a section, center toggles chrome. */
  onLeftTap: () => void;
  onCenterTap: () => void;
  onRightTap: () => void;
}

const NIGHT_THEME = {
  body: { background: '#18181a !important', color: '#e4e0d8 !important' },
  a: { color: '#d9a55c !important' },
};

/**
 * EPUB rendering via epub.js. Unlike ReaderViewport (react-pdf), this is a controlled jump-to-
 * section component, not a fine-grained page renderer: reflowable text has no fixed page, so
 * `currentPage` addresses a whole spine section and a "page turn" always lands at that
 * section's start. Coarser than PDF, but correct and consistent with how sections are tracked
 * everywhere else (bookmarks, reading sessions, the recap spoiler guard).
 */
export const EpubViewport: React.FC<EpubViewportProps> = ({
  fileUrl,
  currentPage,
  zoomScale,
  onLoadSuccess,
  onLoadError,
  isChromeHidden = false,
  nightMode = false,
  onLeftTap,
  onCenterTap,
  onRightTap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const tapZoneHandlers = useTapZones({ onLeftTap, onCenterTap, onRightTap });

  // Open the book and mount the rendition. Re-runs only when the file or an explicit retry changes.
  useEffect(() => {
    if (!fileUrl || !containerRef.current) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    // epub.js's own URL-fetching (ePub(url)) silently hangs forever on a blob: URL (our
    // IndexedDB demo-mode cache path) and is extension-sniffed for everything else — fetching
    // the bytes ourselves and handing epub.js an ArrayBuffer sidesteps its request layer
    // entirely. Same fix in spirit as disabling range/stream fetching for the PDF path.
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not download this book (HTTP ${res.status}).`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        const book = ePub(buffer);
        bookRef.current = book;
        return book.ready.then(() => book);
      })
      .then((book) => {
        if (cancelled || !book || !containerRef.current) return;
        // epub.js's bundled .d.ts omits `Spine.length`, though it's set at runtime in spine.js.
        onLoadSuccess((book.spine as unknown as { length: number }).length ?? 0);

        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'scrolled-doc',
          spread: 'none',
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;

        rendition.themes.register('night', NIGHT_THEME);
        rendition.themes.select(nightMode ? 'night' : 'default');
        rendition.themes.fontSize(`${Math.round(100 * zoomScale)}%`);

        rendition.on('displayerror', (err: Error) => {
          if (cancelled) return;
          setIsLoading(false);
          setLoadError('Could not display this section of the book.');
          if (onLoadError) onLoadError(err);
        });
        rendition.on('rendered', () => {
          if (!cancelled) setIsLoading(false);
        });

        const target = book.spine.get(Math.max(0, currentPage - 1));
        return rendition.display(target ? target.href : undefined);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setIsLoading(false);
        setLoadError(err?.message || 'This EPUB file could not be opened. It may be corrupted or unsupported.');
        if (onLoadError) onLoadError(err);
      });

    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      renditionRef.current = null;
      bookRef.current?.destroy();
      bookRef.current = null;
    };
    // Only the file itself (and an explicit retry) should tear down and recreate the rendition;
    // page/zoom/night-mode changes are handled by the effects below on the live instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, reloadKey]);

  // Jump to the requested section whenever it changes (page-turn, bookmark, resume, keyboard nav).
  useEffect(() => {
    const rendition = renditionRef.current;
    const book = bookRef.current;
    if (!rendition || !book) return;
    const section = book.spine.get(Math.max(0, currentPage - 1));
    if (section) void rendition.display(section.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${Math.round(100 * zoomScale)}%`);
  }, [zoomScale]);

  useEffect(() => {
    renditionRef.current?.themes.select(nightMode ? 'night' : 'default');
  }, [nightMode]);

  const topPadding = isChromeHidden ? '10px' : '24px';
  const sidePadding = isChromeHidden ? '10px' : '16px';
  const bottomPadding = isChromeHidden ? '10px' : '16px';

  return (
    <div
      onPointerDown={tapZoneHandlers.onPointerDown}
      onPointerUp={tapZoneHandlers.onPointerUp}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: nightMode ? '#18181a' : 'var(--color-background)',
        padding: `${topPadding} ${sidePadding} ${bottomPadding} ${sidePadding}`,
        boxSizing: 'border-box',
      }}
    >
      {fileUrl ? (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--color-text-muted)' }}>
          <BookOpen size={40} style={{ opacity: 0.5, marginBottom: '12px' }} />
          <div>No EPUB file provided for this book.</div>
        </div>
      )}

      {isLoading && fileUrl && !loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            backgroundColor: nightMode ? '#18181a' : 'var(--color-background)',
          }}
        >
          <ConcentricPortal size={70} />
          <span style={{ fontSize: '0.88rem', color: 'var(--color-primary)' }}>Opening chapter…</span>
        </div>
      )}

      {loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <AlertCircle size={36} color="var(--color-error)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', margin: '0 0 8px 0' }}>
              Unable to display this book
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
