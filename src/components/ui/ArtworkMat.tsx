import React, { useState, useEffect } from 'react';
import { AlertCircle, ImageOff } from 'lucide-react';

export interface ArtworkMatProps {
  imageUrl?: string | null;
  alt: string;
  aspectRatio?: string | number;
  padding?: string | number;
  maxHeight?: string | number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  fallbackUrl?: string;
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
  fallbackUrl,
}) => {
  const [hasError, setHasError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setHasError(false);
    setFallbackFailed(false);
  }, [imageUrl, fallbackUrl]);

  const effectiveUrl = (!hasError && imageUrl) 
    ? imageUrl 
    : (hasError && fallbackUrl && !fallbackFailed ? fallbackUrl : null);

  const isFailed = (hasError && !fallbackUrl) || fallbackFailed;

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
      {isFailed ? (
        <div
          role="alert"
          aria-label={`Unable to display image: ${alt}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(178, 58, 46, 0.08)',
              color: 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div style={{ maxWidth: '260px' }}>
            <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary)', margin: '0 0 4px 0' }}>
              Unable to display image
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
              Format unsupported or image file could not be loaded.
            </p>
          </div>
        </div>
      ) : !effectiveUrl ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            width: '100%',
          }}
        >
          <ImageOff size={28} />
          <p style={{ fontSize: '0.8rem', margin: 0 }}>No image provided</p>
        </div>
      ) : (
        <img
          src={effectiveUrl}
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
          onError={() => {
            if (hasError && fallbackUrl) {
              setFallbackFailed(true);
            } else {
              setHasError(true);
            }
          }}
        />
      )}
      {children}
    </div>
  );
};
