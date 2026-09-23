import React, { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, X } from 'lucide-react';
import { ReadingSession } from '../../types/book';

interface MemoryBridgeCardProps {
  session: ReadingSession;
  unit?: 'page' | 'section';
  isGenerating: boolean;
  isMobile: boolean;
  /** Chrome-hidden layout covers the app's bottom navigation, so the sheet can sit at the very bottom. */
  isChromeHidden?: boolean;
  /** Highest page the reader has reached — the upper bound for a boundary correction. */
  maxEditablePage: number;
  /** Width of an inline sidebar on the right (desktop), so the card stays centred on the page. */
  sidebarOffset?: number;
  onClose: () => void;
  onUpdateBoundaries: (startPage: number, endPage: number) => Promise<boolean>;
  onRetry: () => void;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function formatWhen(iso: string): string {
  const ended = new Date(iso);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - new Date(ended).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return 'earlier today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return ended.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const stopTouch = (e: React.TouchEvent) => e.stopPropagation();

/**
 * "Previously…" — a compact memory bridge shown when a reader returns to a book.
 * Phone: a bottom sheet in thumb reach. Larger screens: a card floating above the page's lower edge.
 */
export const MemoryBridgeCard: React.FC<MemoryBridgeCardProps> = ({
  session,
  unit = 'page',
  isGenerating,
  isMobile,
  isChromeHidden = false,
  maxEditablePage,
  sidebarOffset = 0,
  onClose,
  onUpdateBoundaries,
  onRetry,
}) => {
  const [editing, setEditing] = useState(false);
  const [fromInput, setFromInput] = useState(String(session.start_page));
  const [toInput, setToInput] = useState(String(session.end_page));
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) {
      setFromInput(String(session.start_page));
      setToInput(String(session.end_page));
      setEditError(null);
    }
  }, [session.start_page, session.end_page, editing]);

  const unitLabel = unit === 'section' ? 'Section' : 'Page';
  const pagesLabel = session.start_page === session.end_page
    ? `${unitLabel} ${session.start_page}`
    : `${unitLabel}s ${session.start_page}–${session.end_page}`;
  const meta = [pagesLabel, formatWhen(session.ended_at), session.duration_seconds > 0 ? formatDuration(session.duration_seconds) : null]
    .filter(Boolean)
    .join(' · ');

  const handleSave = async () => {
    const from = Number(fromInput);
    const to = Number(toInput);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
      setEditError('Enter a first page, then a last page that comes after it.');
      return;
    }
    if (to > maxEditablePage) {
      setEditError(`You've only reached page ${maxEditablePage} so far.`);
      return;
    }
    setSaving(true);
    setEditError(null);
    const ok = await onUpdateBoundaries(from, to);
    setSaving(false);
    if (ok) setEditing(false);
    else setEditError("Those pages couldn't be saved. Try again.");
  };

  const inputStyle: React.CSSProperties = {
    width: '84px',
    minHeight: '44px',
    padding: '8px 10px',
    fontSize: '16px',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    boxSizing: 'border-box',
  };

  const quietButton: React.CSSProperties = {
    minHeight: '44px',
    padding: '0 12px',
    background: 'none',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    fontSize: '0.88rem',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  };

  let body: React.ReactNode;
  if (editing) {
    body = (
      <div>
        <p style={{ margin: '0 0 12px', fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
          {unit === 'section' ? 'Which section did you start in? The recap will be rewritten up to your saved stopping place.' : 'Which pages did you read last time? The recap will be rewritten for them.'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
            From
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxEditablePage}
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              style={inputStyle}
              aria-label="First page read"
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
            to
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxEditablePage}
              value={toInput}
              disabled={unit === 'section'}
              onChange={(e) => setToInput(e.target.value)}
              style={inputStyle}
              aria-label="Last page read"
            />
          </label>
        </div>
        <p
          role={editError ? 'alert' : undefined}
          style={{ margin: '8px 0 0', fontSize: '0.8rem', color: editError ? 'var(--color-error)' : 'var(--color-text-muted)' }}
        >
          {editError ?? (unit === 'section' ? 'Your stopping section is fixed to avoid including unread text.' : `You've reached page ${maxEditablePage}.`)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
          <button type="button" onClick={() => setEditing(false)} style={quietButton}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={handleSave}
            style={{ minHeight: '44px', padding: '0 20px', borderRadius: 'var(--radius-pill)', fontSize: '0.9rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}
          >
            {saving ? 'Saving…' : 'Update recap'}
          </button>
        </div>
      </div>
    );
  } else if (session.recap) {
    body = (
      <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-line', color: 'var(--color-text-primary)' }}>
        {session.recap}
      </p>
    );
  } else if (isGenerating) {
    body = (
      <div aria-busy="true">
        <div className="memory-bridge-skeleton" style={{ width: '100%' }} />
        <div className="memory-bridge-skeleton" style={{ width: '94%' }} />
        <div className="memory-bridge-skeleton" style={{ width: '62%' }} />
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Recalling {pagesLabel.toLowerCase()}…
        </p>
      </div>
    );
  } else {
    body = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
          {session.recap_error ?? 'This recap is not ready yet.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{ ...quietButton, display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-secondary)', fontWeight: 600 }}
        >
          <RotateCcw size={15} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      className={`memory-bridge-layer${isChromeHidden ? ' memory-bridge-layer--chrome-hidden' : ''}`}
      style={{
        position: 'absolute',
        left: 0,
        right: sidebarOffset,
        bottom: 0,
        zIndex: 30,
        display: 'flex',
        justifyContent: 'center',
        padding: isMobile ? '0 10px calc(10px + env(safe-area-inset-bottom, 0px))' : '0 24px 28px',
        pointerEvents: 'none',
      }}
    >
      <section
        className="memory-bridge-card"
        aria-label="Previously"
        onTouchStart={stopTouch}
        onTouchMove={stopTouch}
        onTouchEnd={stopTouch}
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: '560px',
          maxHeight: isMobile ? '70vh' : '60vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          padding: isMobile ? '16px 16px 12px' : '20px 22px 16px',
          boxSizing: 'border-box',
          animation: 'memory-bridge-enter 0.28s ease-out',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Previously…
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{meta}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recap"
            style={{
              width: '44px',
              height: '44px',
              margin: '-10px -10px 0 0',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: '50%',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div
          aria-live="polite"
          style={{ margin: '12px 0 14px', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {body}
        </div>

        {!editing && (
          <footer
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column-reverse' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: isMobile ? '2px' : '12px',
            }}
          >
            <button type="button" onClick={() => setEditing(true)} style={quietButton}>
              {unit === 'section' ? 'Wrong starting section?' : 'Not the right pages?'}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
              style={{
                minHeight: '48px',
                padding: '0 24px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Continue reading
              <ArrowRight size={16} />
            </button>
          </footer>
        )}
      </section>
    </div>
  );
};
