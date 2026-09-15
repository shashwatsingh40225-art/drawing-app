import React from 'react';

interface ReaderPageStripProps {
  currentPage: number;
  totalPages: number;
}

/** The page-position strip — a lightweight, text-only chrome element, distinct from the primary bar. */
export const ReaderPageStrip: React.FC<ReaderPageStripProps> = ({ currentPage, totalPages }) => (
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
    Page {currentPage} of {totalPages || 1}
  </div>
);
