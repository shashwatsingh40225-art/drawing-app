import React from 'react';

interface ReaderPageStripProps {
  currentPage: number;
  totalPages: number;
  /** Overrides the "Page X of Y" label outright — EPUB passes its live on-screen page within the
   *  current chapter, since `currentPage`/`totalPages` alone (spine sections) don't move on every
   *  page turn. */
  labelOverride?: string;
}

/** The page-position strip — a lightweight, text-only chrome element, distinct from the primary bar. */
export const ReaderPageStrip: React.FC<ReaderPageStripProps> = ({ currentPage, totalPages, labelOverride }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5px 12px',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border-subtle)',
      fontSize: '0.78rem',
      fontWeight: 600,
      color: 'var(--color-text-muted)',
      userSelect: 'none',
    }}
  >
    {labelOverride ?? `Page ${currentPage} of ${totalPages || 1}`}
  </div>
);
