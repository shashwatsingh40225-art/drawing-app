import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            maxWidth: '560px',
            margin: '80px auto',
            textAlign: 'center',
            padding: '40px 24px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              width: '180px',
              height: '180px',
              margin: '0 auto 20px',
              backgroundColor: '#FAF5EC',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '12px',
            }}
          >
            <img
              src="/artist-reference/art-09.jpeg"
              alt="Friendly mushroom creature"
              style={{ maxHeight: '160px', width: 'auto' }}
            />
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: 'var(--color-primary)',
              marginBottom: '8px',
            }}
          >
            {this.props.fallbackTitle || 'Something went sideways'}
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred. Your data is safe — try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary double-outline-btn"
            style={{ padding: '10px 24px', fontSize: '0.9rem' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
