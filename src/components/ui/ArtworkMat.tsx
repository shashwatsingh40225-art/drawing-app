import React from 'react';

interface ArtworkMatProps {
  imageUrl?: string | null;
  alt: string;
  aspectRatio?: string | number;
  padding?: string | number;
  maxHeight?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const ArtworkMat: React.FC<ArtworkMatProps> = ({
  imageUrl,
  alt,
  aspectRatio,
  padding = '14px',
  maxHeight,
  className = '',
  style = {},
  children,
}) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  const sourceUrl = (!hasError && imageUrl) ? imageUrl : '/artist-reference/art-01.jpeg';

  return (
    <div
      className={`artwork-mat ${className}`}
      style={{
        backgroundColor: '#FAF5EC',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        maxHeight: maxHeight ? `${maxHeight}` : undefined,
        ...style,
      }}
    >
      <img
        src={sourceUrl}
        alt={alt}
        className="artwork-img-blend"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 'var(--radius-sm)',
          display: 'block',
        }}
        loading="lazy"
        onError={() => setHasError(true)}
      />
      {children}
    </div>
  );
};
