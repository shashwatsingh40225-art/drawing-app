import React, { useState } from 'react';
import { useCollectionStore } from '../../stores/collectionStore';
import { useArtworkStore } from '../../stores/artworkStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Folder, Plus, Trash2, Edit2, Check, X, Layers } from 'lucide-react';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose }) => {
  const { collections, addCollection, updateCollection, deleteCollection } = useCollectionStore();
  const { artworks } = useArtworkStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await addCollection(newColName.trim(), newColDesc.trim());
    setNewColName('');
    setNewColDesc('');
    setIsAdding(false);
  };

  const handleStartEdit = (col: typeof collections[0]) => {
    setEditingId(col.id);
    setEditName(col.name);
    setEditDesc(col.description || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await updateCollection(id, { name: editName.trim(), description: editDesc.trim() });
    setEditingId(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await deleteCollection(deletingId);
      setDeletingId(null);
    }
  };

  const getArtworkCount = (colId: string) => {
    return artworks.filter((a) => a.collection_ids?.includes(colId) && !a.deleted_at).length;
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(35, 23, 16, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 8000,
          padding: '16px',
          animation: 'fadeIn 150ms ease-out',
        }}
        onClick={onClose}
      >
        <div
          className="card-surface"
          style={{
            width: '100%',
            maxWidth: '540px',
            maxHeight: '85vh',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-elevated)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={22} color="var(--color-secondary)" />
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.35rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  margin: 0,
                }}
              >
                Studio Collections
              </h2>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="Close collections modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* List of Collections */}
          <div
            style={{
              padding: '20px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {collections.length === 0 && !isAdding && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                No collections yet. Group your drawings into folios, series, or sketchbooks!
              </div>
            )}

            {collections.map((col) => {
              const isEditing = editingId === col.id;
              const count = getArtworkCount(col.id);

              return (
                <div
                  key={col.id}
                  style={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Collection name"
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                        }}
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Optional description"
                        style={{
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text-secondary)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.85rem',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: '4px 10px',
                            background: 'none',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(col.id)}
                          className="double-outline-btn"
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'var(--color-accent)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                        <Folder size={18} color="var(--color-secondary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                              {col.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-secondary)',
                                backgroundColor: 'rgba(180, 83, 31, 0.08)',
                                padding: '1px 7px',
                                borderRadius: 'var(--radius-pill)',
                                fontWeight: 600,
                              }}
                            >
                              {count} {count === 1 ? 'artwork' : 'artworks'}
                            </span>
                          </div>
                          {col.description && (
                            <p
                              style={{
                                margin: '4px 0 0 0',
                                fontSize: '0.82rem',
                                color: 'var(--color-text-secondary)',
                                lineHeight: 1.4,
                              }}
                            >
                              {col.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleStartEdit(col)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                          aria-label={`Edit ${col.name}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingId(col.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-error)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                          aria-label={`Delete ${col.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Collection Form */}
            {isAdding ? (
              <form
                onSubmit={handleCreate}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-accent)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                  Create New Collection
                </div>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Autumn Field Studies, Inktober 2026"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                  }}
                  autoFocus
                  required
                />
                <input
                  type="text"
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Description (optional)"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewColName('');
                      setNewColDesc('');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'none',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="double-outline-btn"
                    style={{
                      padding: '6px 16px',
                      backgroundColor: 'var(--color-accent)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Create Collection
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="double-outline-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--color-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-secondary)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                <Plus size={16} />
                <span>Create New Collection</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? The drawings inside will not be deleted, only unassigned from this collection."
        confirmLabel="Delete Collection"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  );
};
