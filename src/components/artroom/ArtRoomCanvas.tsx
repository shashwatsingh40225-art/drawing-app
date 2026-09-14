import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Trash2, ArrowUp, ArrowDown, Move, Pin } from 'lucide-react';
import { ArtRoomItem } from '../../types/artRoom';

interface ArtRoomCanvasProps {
  items: ArtRoomItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdatePosition: (id: string, x_percent: number, y_percent: number) => void;
  onUpdateZIndex: (id: string, z_index: number) => void;
  onRemoveItem: (id: string) => void;
}

export const ArtRoomCanvas: React.FC<ArtRoomCanvasProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onUpdatePosition,
  onUpdateZIndex,
  onRemoveItem,
}) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (item: ArtRoomItem, e: React.PointerEvent) => {
    e.stopPropagation();
    onSelectItem(item.id);

    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Calculate mouse offset from item top-left in percentages
    const itemLeftPx = (item.x_percent / 100) * canvasRect.width;
    const itemTopPx = (item.y_percent / 100) * canvasRect.height;

    const clickX = e.clientX - canvasRect.left;
    const clickY = e.clientY - canvasRect.top;

    setDragOffset({
      x: clickX - itemLeftPx,
      y: clickY - itemTopPx,
    });
    setDraggingItemId(item.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingItemId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - canvasRect.left;
    const currentY = e.clientY - canvasRect.top;

    const newLeftPx = currentX - dragOffset.x;
    const newTopPx = currentY - dragOffset.y;

    const newXPercent = (newLeftPx / canvasRect.width) * 100;
    const newYPercent = (newTopPx / canvasRect.height) * 100;

    onUpdatePosition(draggingItemId, newXPercent, newYPercent);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingItemId) {
      setDraggingItemId(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleNavigateSource = (item: ArtRoomItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.ref_artwork_id) {
      navigate(`/my-art/${item.ref_artwork_id}`);
    } else if (item.ref_book_id) {
      navigate(`/reader/${item.ref_book_id}${item.ref_book_page ? `?page=${item.ref_book_page}` : ''}`);
    } else if (item.ref_archive_asset_id) {
      navigate('/archive');
    }
  };

  const handleBringToFront = (item: ArtRoomItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const maxZ = items.reduce((m, i) => Math.max(m, i.z_index), 0);
    onUpdateZIndex(item.id, maxZ + 1);
  };

  const handleSendToBack = (item: ArtRoomItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const minZ = items.reduce((m, i) => Math.min(m, i.z_index), 0);
    onUpdateZIndex(item.id, Math.max(0, minZ - 1));
  };

  return (
    <div
      ref={canvasRef}
      className="ruled-paper-pattern"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={() => onSelectItem(null)}
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        minHeight: '560px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '2px solid var(--color-border)',
        boxShadow: 'inset 0 2px 12px rgba(36, 19, 41, 0.04), var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `radial-gradient(rgba(58, 33, 64, 0.08) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Board Watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'rgba(58, 33, 64, 0.2)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        Kin Studio · My Art Room
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <img
            src="/artist-reference/art-01.jpeg"
            alt="Crane illustration"
            className="artwork-img-blend"
            style={{ width: '180px', margin: '0 auto 16px', display: 'block', opacity: 0.8 }}
          />
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
            Pin your first artwork, book plate, or Archive reference to begin.
          </p>
        </div>
      )}

      {/* Render Canvas Items */}
      {items.map((item) => {
        const isSelected = selectedItemId === item.id;
        const isDragging = draggingItemId === item.id;

        return (
          <div
            key={item.id}
            onPointerDown={(e) => handlePointerDown(item, e)}
            style={{
              position: 'absolute',
              left: `${item.x_percent}%`,
              top: `${item.y_percent}%`,
              width: `${item.width_percent}%`,
              zIndex: isSelected ? 50 : item.z_index,
              transform: `rotate(${item.rotation_degrees}deg) scale(${isDragging ? 1.04 : 1})`,
              transition: isDragging ? 'none' : 'transform 180ms ease-out, box-shadow 180ms ease',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            {/* Visual Card / Mat */}
            <div
              style={{
                backgroundColor: item.type === 'note' ? '#FFFBEB' : '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: '10px 10px 14px 10px',
                boxShadow: isSelected
                  ? '0 12px 30px rgba(36, 19, 41, 0.22), 0 0 0 2px var(--color-secondary)'
                  : '0 6px 18px rgba(36, 19, 41, 0.1)',
                border: item.type === 'note' ? '1px solid #FDE68A' : '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Decorative pushpin */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-secondary)',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              />

              {/* Item Content */}
              {item.thumbnail_url ? (
                <div style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: '4px', marginBottom: '8px' }}>
                  <img
                    src={item.thumbnail_url}
                    alt={item.title || 'Art item'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              ) : item.type === 'note' ? (
                <div style={{ padding: '8px', minHeight: '80px' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350F', lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>
                    {item.note_content}
                  </p>
                </div>
              ) : null}

              {/* Title & Type badge */}
              <div style={{ padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.title}
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {item.type.replace('_', ' ')}
                </span>
              </div>

              {/* Context Actions Bar (Visible when selected) */}
              {isSelected && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed rgba(58, 33, 64, 0.15)',
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleBringToFront(item, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--color-text-muted)' }}
                      title="Bring to Front"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSendToBack(item, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--color-text-muted)' }}
                      title="Send to Back"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(item.ref_artwork_id || item.ref_book_id || item.ref_archive_asset_id) && (
                      <button
                        type="button"
                        onClick={(e) => handleNavigateSource(item, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.72rem',
                          color: 'var(--color-secondary)',
                          fontWeight: 600,
                          padding: '2px',
                        }}
                        title="Go to Original"
                      >
                        <ExternalLink size={12} />
                        <span>Open</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-error)',
                        padding: '2px',
                      }}
                      title="Remove from board"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
