import React from 'react';

interface ReadingProgressBarProps {
  currentPage: number;
  totalPages: number;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  currentPage,
  totalPages,
}) => {
  const percent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

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
