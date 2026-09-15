import React, { useState } from 'react';
import { ArrowLeft, Pin, StickyNote, Archive, X } from 'lucide-react';
import { KIN_ARCHIVE_ASSETS } from '../../data/kinArchive';

interface AddPinChooserProps {
  currentPage: number;
  onChooseNote: () => void;
  onChooseArchiveAsset: (assetId: string) => void;
  onClose: () => void;
}

const stopTouch = (e: React.TouchEvent) => e.stopPropagation();

/**
 * The single Add Pin entry point (decision 6): a brief chooser — write a note, or pick from the
 * Kin Archive — before anything is placed. Nothing lands on the page until a choice is made and
 * the reader taps a spot; there's no default pin that later gets edited into the other kind.
 */
export const AddPinChooser: React.FC<AddPinChooserProps> = ({ currentPage, onChooseNote, onChooseArchiveAsset, onClose }) => {
  const [step, setStep] = useState<'choice' | 'archive-pick'>('choice');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: 'rgba(36, 19, 41, 0.4)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <section
        aria-label="Add Pin"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={stopTouch}
        onTouchMove={stopTouch}
        onTouchEnd={stopTouch}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '72vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          boxShadow: 'var(--shadow-modal)',
          padding: '18px 20px calc(18px + env(safe-area-inset-bottom, 0px))',
          boxSizing: 'border-box',
          animation: 'memory-bridge-enter 0.24s ease-out',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          {step === 'archive-pick' && (
            <button
              type="button"
              onClick={() => setStep('choice')}
              aria-label="Back"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '6px', display: 'flex' }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              {step === 'choice' ? 'Add Pin' : 'Pick from Kin Archive'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Page {currentPage}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '40px',
              height: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: '50%',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          {step === 'choice' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={onChooseNote}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: '44px',
                }}
              >
                <StickyNote size={20} color="var(--color-secondary)" />
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Write a note</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Tap a spot on the page, then jot an observation.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep('archive-pick')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: '44px',
                }}
              >
                <Archive size={20} color="var(--color-secondary)" />
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Pick from Kin Archive</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Attach one of the 20 studio artworks as a reference.
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {KIN_ARCHIVE_ASSETS.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onChooseArchiveAsset(asset.id)}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: '44px',
                  }}
                >
                  <img
                    src={asset.filename}
                    alt={asset.title}
                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{asset.code}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {asset.title}
                    </div>
                  </div>
                  <Pin size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
