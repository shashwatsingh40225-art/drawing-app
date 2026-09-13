import React from 'react';

export type BadgeVariant = 'default' | 'accent' | 'secondary' | 'teal' | 'muted' | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  onRemove?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  icon,
  onRemove,
  className = '',
  style = {},
}) => {
  const getStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'accent':
        return {
          backgroundColor: 'rgba(214, 51, 122, 0.1)',
          color: 'var(--color-accent)',
          border: '1px solid rgba(214, 51, 122, 0.25)',
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(180, 83, 31, 0.09)',
          color: 'var(--color-secondary)',
          border: '1px solid rgba(180, 83, 31, 0.25)',
        };
      case 'teal':
        return {
          backgroundColor: 'rgba(46, 139, 114, 0.1)',
          color: 'var(--color-accent-teal)',
          border: '1px solid rgba(46, 139, 114, 0.25)',
        };
      case 'muted':
        return {
          backgroundColor: 'rgba(74, 58, 64, 0.07)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border-subtle)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        };
      default:
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        };
    }
  };

  return (
    <span
      className={`badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        fontSize: '0.76rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        ...getStyles(),
        ...style,
      }}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0 2px',
            marginLeft: '2px',
            fontSize: '0.85rem',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
          }}
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
};
