import React, { useState, useRef } from 'react';
import { StickyNote, Trash2, ExternalLink, X, Check, Pin, Sparkles } from 'lucide-react';
import { PageAnnotation } from '../../types/book';
import { KIN_ARCHIVE_BY_ID } from '../../data/kinArchive';

interface AnnotationOverlayProps {
  bookId: string;
  pageNumber: number;
  annotations: PageAnnotation[];
  isAddingNote: boolean;
  onAddNoteAt: (x_percent: number, y_percent: number) => void;
  onUpdateAnnotation: (id: string, updates: Partial<PageAnnotation>) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  bookId,
  pageNumber,
  annotations,
  isAddingNote,
  onAddNoteAt,
  onUpdateAnnotation,
  onDeleteAnnotation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingNote || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x_percent = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y_percent = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

    onAddNoteAt(x_percent, y_percent);
  };

  const handleOpenEdit = (ann: PageAnnotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveAnnotationId(ann.id);
    setEditText(ann.content || '');
  };

  const handleSaveEdit = (annId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onUpdateAnnotation(annId, { content: editText });
    setActiveAnnotationId(null);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: isAddingNote ? 'auto' : 'none',
        cursor: isAddingNote ? 'crosshair' : 'default',
        zIndex: 5,
      }}
    >
      {/* Banner hint when in note-dropping mode */}
      {isAddingNote && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-on-dark)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'var(--shadow-card)',
            pointerEvents: 'none',
          }}
        >
          <Pin size={13} color="var(--color-accent)" />
          <span>Click anywhere on the page to place a note</span>
        </div>
      )}

      {/* Render each annotation on this page */}
      {annotations.map((ann) => {
        const isSelected = activeAnnotationId === ann.id;
        const archiveRef = ann.ref_archive_asset_id ? KIN_ARCHIVE_BY_ID[ann.ref_archive_asset_id] : null;

        return (
          <div
            key={ann.id}
            style={{
              position: 'absolute',
              left: `${ann.x_percent}%`,
              top: `${ann.y_percent}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              zIndex: isSelected ? 30 : 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Note Pin Icon Button */}
            <button
              type="button"
              onClick={(e) => handleOpenEdit(ann, e)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isSelected
                  ? 'var(--color-accent)'
                  : archiveRef
                  ? 'var(--color-secondary)'
                  : 'var(--color-primary)',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 150ms ease, background-color 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title={ann.content || 'Page Note'}
            >
              {archiveRef ? <Sparkles size={14} /> : <StickyNote size={14} />}
            </button>

            {/* Note Editor / Details Popover */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '260px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-modal)',
                  padding: '14px',
                  zIndex: 40,
                  fontSize: '0.84rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>
                    {archiveRef ? `Kin Archive Reference: ${archiveRef.code}` : 'Page Study Note'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAnnotationId(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* If archive ref, show thumbnail */}
                {archiveRef && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', backgroundColor: 'rgba(58, 33, 64, 0.05)', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <img
                      src={archiveRef.filename}
                      alt={archiveRef.title}
                      style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {archiveRef.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {archiveRef.medium}
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit text area */}
                <textarea
                  rows={3}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Type note or study observation here..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.82rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                  }}
                  autoFocus
                />

                {/* Footer buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAnnotation(ann.id);
                      setActiveAnnotationId(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-error)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.76rem',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSaveEdit(ann.id, e)}
                    className="btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
