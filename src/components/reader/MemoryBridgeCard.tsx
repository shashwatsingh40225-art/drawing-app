import React, { useState } from 'react';
import { Sparkles, ArrowRight, Edit3, Check, X, RotateCcw, Clock, BookOpen, Key, AlertCircle } from 'lucide-react';
import { ReadingSession } from '../../types/book';
import { getGeminiApiKey, setGeminiApiKey } from '../../services/geminiRecapService';

interface MemoryBridgeCardProps {
  session: ReadingSession;
  bookTitle: string;
  isGenerating?: boolean;
  onContinueReading: () => void;
  onDismiss: () => void;
  onUpdateBoundaries: (startPage: number, endPage: number) => Promise<void>;
  onRegenerateRecap: () => Promise<void>;
  totalPages?: number;
}

export const MemoryBridgeCard: React.FC<MemoryBridgeCardProps> = ({
  session,
  bookTitle,
  isGenerating = false,
  onContinueReading,
  onDismiss,
  onUpdateBoundaries,
  onRegenerateRecap,
  totalPages = 500,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [startInput, setStartInput] = useState(session.start_page.toString());
  const [endInput, setEndInput] = useState(session.end_page.toString());
  const [savingEdit, setSavingEdit] = useState(false);

  // Key management inline modal / dropdown
  const [isConfiguringKey, setIsConfiguringKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getGeminiApiKey());

  const durationMin = Math.max(1, Math.round(session.duration_seconds / 60));

  const handleSaveEdit = async () => {
    const s = parseInt(startInput, 10);
    const e = parseInt(endInput, 10);

    if (isNaN(s) || isNaN(e) || s < 1 || e < s || (totalPages && e > totalPages)) {
      return;
    }

    setSavingEdit(true);
    try {
      await onUpdateBoundaries(s, e);
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div
      className="memory-bridge-card"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto 20px auto',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: '4px solid var(--color-secondary)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '18px 22px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.25s ease-out',
        zIndex: 25,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--color-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            <Sparkles size={16} color="var(--color-secondary)" />
            <span>Previously…</span>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.76rem',
              fontWeight: 600,
              padding: '2px 8px',
              backgroundColor: 'rgba(180, 83, 31, 0.08)',
              color: 'var(--color-secondary)',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            <BookOpen size={12} />
            Pages {session.start_page}–{session.end_page}
          </span>

          {session.duration_seconds > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.76rem',
                color: 'var(--color-text-muted)',
              }}
            >
              <Clock size={12} />
              ~{durationMin}m session
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Correct reading session boundaries"
            >
              <Edit3 size={13} />
              <span>Edit range</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Dismiss memory bridge"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Manual Boundary Correction Mode */}
      {isEditing ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Adjust the exact pages you read during this session. The recap will automatically regenerate:
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-text-primary)' }}>
              <span>Start Page:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                style={{
                  width: '64px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--color-text-primary)' }}>
              <span>End Page:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                style={{
                  width: '64px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                }}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '5px 12px',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.8rem',
                  cursor: savingEdit ? 'not-allowed' : 'pointer',
                }}
              >
                <Check size={14} />
                <span>{savingEdit ? 'Updating…' : 'Save & Regenerate'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Inline API Key Configuration */}
      {isConfiguringKey && (
        <div
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Configure Gemini Flash API Key
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
            Enter your Google AI Studio Gemini API key to enable instant reading session memory bridges:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
              }}
            />
            <button
              type="button"
              onClick={async () => {
                setGeminiApiKey(apiKeyInput);
                setIsConfiguringKey(false);
                await onRegenerateRecap();
              }}
              className="btn-primary"
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Save & Generate
            </button>
            <button
              type="button"
              onClick={() => setIsConfiguringKey(false)}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-pill)',
                padding: '5px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Body / Recap Text */}
      <div style={{ marginBottom: '14px' }}>
        {isGenerating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-secondary)', padding: '10px 0' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                border: '2px solid var(--color-border)',
                borderTopColor: 'var(--color-secondary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '0.88rem', fontStyle: 'italic' }}>
              Generating memory bridge from Pages {session.start_page}–{session.end_page}…
            </span>
          </div>
        ) : session.recap ? (
          <div
            style={{
              fontSize: '0.92rem',
              lineHeight: '1.65',
              color: 'var(--color-text-primary)',
              whiteSpace: 'pre-line',
            }}
          >
            {session.recap}
          </div>
        ) : session.recap_error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--color-text-primary)' }}>
              You read Pages {session.start_page} through {session.end_page} in your last session.
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                backgroundColor: 'rgba(0,0,0,0.03)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <AlertCircle size={14} color="var(--color-secondary)" />
              <span style={{ flex: 1 }}>{session.recap_error}</span>
              <button
                type="button"
                onClick={() => setIsConfiguringKey(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-secondary)',
                  fontWeight: 600,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px',
                }}
              >
                Set Key
              </button>
              <button
                type="button"
                onClick={onRegenerateRecap}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '2px 8px',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                }}
              >
                <RotateCcw size={11} />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '6px 0' }}>
            <span style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)' }}>
              You read Pages {session.start_page} through {session.end_page} in your last session.
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsConfiguringKey(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.76rem',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
                title="Configure custom Gemini API key"
              >
                <Key size={11} />
                <span>API Key</span>
              </button>
              <button
                type="button"
                onClick={onRegenerateRecap}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.78rem',
                  color: 'var(--color-secondary)',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} />
                <span>Generate AI Recap</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Continue Reading CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: '10px',
        }}
      >
        <button
          type="button"
          onClick={onContinueReading}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.86rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <span>Continue reading</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};
