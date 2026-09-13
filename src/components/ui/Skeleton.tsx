import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius-sm)',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        backgroundColor: 'rgba(58, 33, 64, 0.08)',
        background: 'linear-gradient(90deg, rgba(58, 33, 64, 0.06) 0%, rgba(58, 33, 64, 0.12) 50%, rgba(58, 33, 64, 0.06) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.6s ease-in-out infinite',
        ...style,
      }}
    />
  );
};
