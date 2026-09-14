import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { ArtRoomItem } from '../../types/artRoom';
import { worlds } from '../../styles/tokens';

interface ArtRoomCanvasProps {
  items: ArtRoomItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdatePosition: (id: string, x_percent: number, y_percent: number) => void;
  onUpdateZIndex: (id: string, z_index: number) => void;
  onRemoveItem: (id: string) => void;
  onOpenAddModal?: () => void;
}

export const ArtRoomCanvas: React.FC<ArtRoomCanvasProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onUpdatePosition,
  onUpdateZIndex,
  onRemoveItem,
  onOpenAddModal,
}) => {
  const world = worlds.magentaCreature;
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
      className="artroom-canvas-container"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={() => onSelectItem(null)}
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        minHeight: '560px',
        backgroundColor: world.surface,
        borderRadius: 'var(--radius-xl)',
        border: `2px solid ${world.border}`,
        boxShadow: `inset 0 2px 14px rgba(36, 19, 41, 0.05), 0 8px 30px rgba(36, 19, 41, 0.06)`,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `radial-gradient(${world.borderSubtle} 1.5px, transparent 0)`,
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
          fontSize: '0.72rem',
          fontWeight: 700,
          color: world.textMuted,
          opacity: 0.6,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        Kin Studio · Art Room Canvas
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              backgroundColor: '#FFFFFF',
              padding: '12px',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${world.border}`,
              boxShadow: '0 10px 28px rgba(36, 19, 41, 0.08)',
              marginBottom: '20px',
            }}
          >
            <img
              src="/artist-reference/art-01.jpeg"
              alt="Crane illustration"
              className="artwork-img-blend"
              style={{ width: '160px', borderRadius: 'var(--radius-sm)', display: 'block' }}
            />
          </div>
          <h3
            style={{
              color: world.textPrimary,
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              margin: '0 0 8px 0',
            }}
          >
            Your Canvas is Ready
          </h3>
          <p
            style={{
              color: world.textSecondary,
              fontSize: '0.88rem',
              maxWidth: '380px',
              margin: '0 0 20px 0',
              lineHeight: 1.5,
            }}
          >
            Pin artworks from the Kin Archive, your personal sketchbook, or book plates to start arranging your visual pinboard.
          </p>
          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="btn-accent double-outline-btn"
              style={{
                padding: '9px 20px',
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: world.accent,
                color: '#FFFFFF',
                border: `1px solid ${world.accent}`,
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Plus size={16} />
              <span>Pin Reference to Begin</span>
            </button>
          )}
        </div>
      )}

      {/* Render Canvas Items */}
      {items.map((item) => {
        const isSelected = selectedItemId === item.id;
        const isDragging = draggingItemId === item.id;
        const isNote = item.type === 'note';

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
              transform: `rotate(${item.rotation_degrees}deg) scale(${isDragging ? 1.05 : 1})`,
              transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.34, 1.3, 0.64, 1), box-shadow 180ms ease',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            {/* Visual Card / Mat */}
            <div
              style={{
                backgroundColor: isNote ? '#FFFDF0' : '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: isNote ? '12px 14px' : '10px 10px 12px 10px',
                boxShadow: isSelected
                  ? `0 16px 36px rgba(26, 14, 28, 0.22), 0 0 0 2px ${world.accent}, 3px 3px 0 0 ${world.secondaryAccent}`
                  : isDragging
                  ? '0 24px 48px rgba(26, 14, 28, 0.28)'
                  : '0 8px 22px rgba(26, 14, 28, 0.1)',
                border: isSelected
                  ? `1.5px solid ${world.accent}`
                  : isNote
                  ? '1px solid #FDE68A'
                  : `1px solid ${world.border}`,
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 180ms ease',
                position: 'relative',
              }}
            >
              {/* Decorative 3D pushpin */}
              <div
                style={{
                  position: 'absolute',
                  top: '-9px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isNote
                    ? 'radial-gradient(circle at 35% 35%, #FDE047 0%, #EAB308 65%, #854D0E 100%)'
                    : 'radial-gradient(circle at 35% 35%, #FF72B6 0%, #FF2D95 65%, #9E004E 100%)',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 3px 6px rgba(26, 14, 28, 0.35), inset 0 1px 2px rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 0 2px rgba(0,0,0,0.2)',
                  }}
                />
              </div>

              {/* Item Content */}
              {item.thumbnail_url ? (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: '1px solid rgba(58, 33, 64, 0.08)',
                  }}
                >
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
              ) : isNote ? (
                <div style={{ minHeight: '70px', padding: '2px 0' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      color: '#78350F',
                      lineHeight: 1.45,
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                    }}
                  >
                    {item.note_content}
                  </p>
                </div>
              ) : null}

              {/* Title & Type badge */}
              <div style={{ padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: world.textPrimary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    color: world.textMuted,
                    textTransform: 'capitalize',
                    fontWeight: 600,
                    backgroundColor: 'rgba(58, 33, 64, 0.05)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
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
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: `1px dashed ${world.borderSubtle}`,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleBringToFront(item, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: world.textSecondary,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Bring to Front"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSendToBack(item, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: world.textSecondary,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Send to Back"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
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
                          color: world.accent,
                          fontWeight: 600,
                          padding: '2px 5px',
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
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 'var(--radius-sm)',
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

