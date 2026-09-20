import React from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
  fileSize?: number;
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  error?: string | null;
  onCancel?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
  fileSize,
  status,
  error,
  onCancel,
}) => {
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Uploading (${Math.round(progress)}%)...`;
      case 'processing':
        return 'Processing book & generating structure...';
      case 'done':
        return 'Ready in Library';
      case 'error':
        return error || 'Upload failed';
      default:
        return 'Preparing upload...';
    }
  };

  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {status === 'uploading' || status === 'processing' ? (
            <Loader2
              size={18}
              color="var(--color-secondary)"
              style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }}
            />
          ) : status === 'done' ? (
            <CheckCircle2 size={18} color="var(--color-success)" style={{ flexShrink: 0 }} />
          ) : status === 'error' ? (
            <AlertCircle size={18} color="var(--color-error)" style={{ flexShrink: 0 }} />
          ) : null}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fileName}
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: status === 'error' ? 'var(--color-error)' : 'var(--color-text-muted)',
              }}
            >
              {getStatusText()} {fileSize ? `· ${formatBytes(fileSize)}` : ''}
            </div>
          </div>
        </div>

        {onCancel && (status === 'uploading' || status === 'processing') && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar Container */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(58, 33, 64, 0.08)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor:
              status === 'error'
                ? 'var(--color-error)'
                : status === 'done'
                ? 'var(--color-success)'
                : 'var(--color-secondary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 200ms ease-out',
          }}
        />
      </div>
    </div>
  );
};
