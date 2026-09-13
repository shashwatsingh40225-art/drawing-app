import React from 'react';

interface PageHeaderProps {
  icon?: React.ReactNode;
  eyebrowLabel?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  eyebrowLabel,
  title,
  description,
  action,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`page-header ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--color-border)',
        ...style,
      }}
    >
      <div>
        {eyebrowLabel && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-secondary)',
              marginBottom: '6px',
            }}
          >
            {icon && <span>{icon}</span>}
            <span>{eyebrowLabel}</span>
          </div>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              color: 'var(--color-text-secondary)',
              margin: '6px 0 0 0',
              maxWidth: '640px',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {action && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{action}</div>}
    </div>
  );
};
