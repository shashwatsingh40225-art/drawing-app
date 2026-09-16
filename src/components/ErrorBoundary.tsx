import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  /** Shows the raw error name/message below the copy — useful for diagnosing device-specific
   *  crashes (e.g. iPad Safari) that are hard to reproduce and can't easily be remote-debugged. */
  showDetails?: boolean;
  /** Optional secondary link so a crash doesn't strand the user with only a reload button that
   *  re-renders the same broken screen. */
  secondaryAction?: { label: string; href: string };
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack ?? null });
  }

  private detailsText(): string {
    const { error, componentStack } = this.state;
    if (!error) return '';
    const parts = [`${error.name}: ${error.message}`];
    if (error.stack) parts.push(error.stack);
    if (componentStack) parts.push(`Component stack:${componentStack}`);
    return parts.join('\n\n');
  }

  private handleCopy = () => {
    navigator.clipboard
      .writeText(this.detailsText())
      .then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      })
      .catch(() => {});
  };

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
              src="/brand/illustrations/art-09-card.png"
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
          {this.props.showDetails && this.state.error && (
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <pre
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  margin: 0,
                  maxHeight: '200px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.detailsText()}
              </pre>
              <button
                type="button"
                onClick={this.handleCopy}
                style={{
                  marginTop: '8px',
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {this.state.copied ? 'Copied!' : 'Copy error details'}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary double-outline-btn"
              style={{ padding: '10px 24px', fontSize: '0.9rem' }}
            >
              Refresh Page
            </button>
            {this.props.secondaryAction && (
              <Link
                to={this.props.secondaryAction.href}
                className="btn-primary double-outline-btn"
                style={{ padding: '10px 24px', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                {this.props.secondaryAction.label}
              </Link>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
