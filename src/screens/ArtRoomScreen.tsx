import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ArtRoomCanvas } from '../components/artroom/ArtRoomCanvas';
import { AddItemModal } from '../components/artroom/AddItemModal';
import { useArtRoomStore } from '../stores/artRoomStore';
import { useToastStore } from '../stores/toastStore';
import { PageTransition } from '../components/motion/PageTransition';
import { worlds } from '../styles/tokens';

export const ArtRoomScreen: React.FC = () => {
  const world = worlds.magentaCreature;
  const {
    items,
    selectedItemId,
    fetchBoardAndItems,
    addItem,
    updateItemPosition,
    updateItemZIndex,
    removeItem,
    clearBoard,
    setSelectedItemId,
  } = useArtRoomStore();
  const { showToast } = useToastStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    fetchBoardAndItems();
  }, [fetchBoardAndItems]);

  const handleAddItem = async (itemData: any) => {
    const created = await addItem(itemData);
    if (created) {
      showToast({ type: 'success', message: `Pinned "${created.title}" to Art Room` });
    }
  };

  const handleClearConfirm = async () => {
    await clearBoard();
    showToast({ type: 'info', message: 'Art Room canvas cleared' });
    setShowClearConfirm(false);
  };

  return (
    <PageTransition>
      <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '36px 24px 96px 24px' }}>
        <PageHeader
          icon={<LayoutGrid size={16} />}
          eyebrowLabel="Studio Space"
          title="My Art Room"
          description="Your visual pinboard and thinking canvas. Pin and arrange personal drawings, Kin Archive references, and book plates together."
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: `1px solid ${world.border}`,
                    backgroundColor: world.surface,
                    color: world.textSecondary,
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-error)';
                    e.currentTarget.style.borderColor = 'var(--color-error)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = world.textSecondary;
                    e.currentTarget.style.borderColor = world.border;
                  }}
                >
                  <Trash2 size={14} />
                  <span>Clear Canvas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="btn-accent double-outline-btn"
                style={{
                  padding: '9px 20px',
                  fontSize: '0.9rem',
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
                <span>Pin Item</span>
              </button>
            </div>
          }
        />

        {/* Art Room Canvas */}
        <div style={{ marginTop: '16px' }}>
          <ArtRoomCanvas
            items={items}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            onUpdatePosition={updateItemPosition}
            onUpdateZIndex={updateItemZIndex}
            onRemoveItem={(id) => {
              removeItem(id);
              showToast({ type: 'info', message: 'Item removed from canvas' });
            }}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
      />

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Art Room Canvas?"
        message="Are you sure you want to remove all pinned items from your board? This does not delete original artworks or books."
        confirmLabel="Clear Canvas"
        cancelLabel="Keep Items"
        variant="danger"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  </PageTransition>
);
};
