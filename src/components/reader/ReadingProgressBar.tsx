import React from 'react';

interface ReadingProgressBarProps {
  currentPage: number;
  totalPages: number;
  /** 0–1 override for the filled fraction — EPUB passes its live intra-chapter position here,
   *  since `currentPage`/`totalPages` alone (spine sections) only move once per chapter. */
  fractionOverride?: number;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  currentPage,
  totalPages,
  fractionOverride,
}) => {
  const percent =
    fractionOverride !== undefined
      ? Math.min(100, Math.max(0, fractionOverride * 100))
      : totalPages > 0
      ? (currentPage / totalPages) * 100
      : 0;

  return (
    <div
      className="reading-progress-bar"
      style={{ width: `${percent}%` }}
      role="progressbar"
      aria-valuenow={currentPage}
      aria-valuemin={1}
      aria-valuemax={totalPages}
      aria-label={`Reading progress: page ${currentPage} of ${totalPages}`}
    />
  );
};
