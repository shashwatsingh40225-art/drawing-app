import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtworkStore } from '../stores/artworkStore';
import { useCollectionStore } from '../stores/collectionStore';
import { useToastStore } from '../stores/toastStore';
import { PageHeader } from '../components/ui/PageHeader';
import { ArtworkMat } from '../components/ui/ArtworkMat';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { normalizeTag, deduplicateTags } from '../utils/tags';
import { ArrowLeft, Save, Plus, Check } from 'lucide-react';

const MEDIUM_OPTIONS = [
  'Pencil',
  'Ink Pen',
  'Marker',
  'Watercolor',
  'Acrylic',
  'Charcoal',
  'Digital',
  'Mixed Media',
  'Other',
];

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed Artwork' },
  { value: 'in-progress', label: 'In Progress (Draft)' },
  { value: 'study', label: 'Sketch / Study' },
  { value: 'abandoned', label: 'Abandoned / Archive' },
];

export const ArtworkEditScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { artworks, updateArtwork } = useArtworkStore();
  const { collections } = useCollectionStore();
  const { showToast } = useToastStore();

  const artwork = artworks.find((a) => a.id === id);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [medium, setMedium] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [status, setStatus] = useState<'completed' | 'in-progress' | 'study' | 'abandoned'>('completed');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Prepopulate form
  useEffect(() => {
    if (artwork) {
      setTitle(artwork.title || '');
      setDescription(artwork.description || '');
      setMedium(artwork.medium || 'Ink Pen');
      setCreationDate(artwork.creation_date || '');
      setStatus(artwork.status || 'completed');
      setTags(artwork.tags || []);
      setNotes(artwork.notes || '');
      setSelectedCollections(artwork.collection_ids || []);
    }
  }, [artwork]);

  if (!artwork) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        <EmptyState
          artworkSrc="/artist-reference/art-09.jpeg"
          headline="Artwork Not Found"
          description="Could not locate this drawing to edit."
          actionLabel="Return to Sketchbook"
          onAction={() => navigate('/sketchbook')}
        />
      </div>
    );
  }

  // Check dirty state
  const isDirty =
    title !== (artwork.title || '') ||
    description !== (artwork.description || '') ||
    medium !== (artwork.medium || 'Ink Pen') ||
    creationDate !== (artwork.creation_date || '') ||
    status !== (artwork.status || 'completed') ||
    notes !== (artwork.notes || '') ||
    JSON.stringify(tags) !== JSON.stringify(artwork.tags || []) ||
    JSON.stringify(selectedCollections) !== JSON.stringify(artwork.collection_ids || []);

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      navigate(`/sketchbook/${artwork.id}`);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const normalized = normalizeTag(tagInput);
    if (normalized && !tags.includes(normalized)) {
      setTags([...tags, normalized]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const toggleCollection = (colId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await updateArtwork(artwork.id, {
        title: title.trim(),
        description: description.trim(),
        medium,
        creation_date: creationDate,
        status,
        tags: deduplicateTags(tags),
        notes: notes.trim(),
        collection_ids: selectedCollections,
      });

      showToast({
        type: 'success',
        message: 'Artwork details successfully updated.',
      });

      navigate(`/sketchbook/${artwork.id}`);
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to update artwork details.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayImage = artwork.thumbnail_path || artwork.image_path || '/artist-reference/art-01.jpeg';

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '36px 24px 96px 24px',
      }}
    >
      <PageHeader
        eyebrowLabel="Studio Folio Editor"
        title={`Edit "${artwork.title}"`}
        description="Update your artwork title, medium classification, tags, and sketchbook collections."
        action={
          <button
            type="button"
            onClick={handleCancel}
            className="double-outline-btn"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} />
            <span>Cancel</span>
          </button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div
          className="upload-form-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
            alignItems: 'start',
          }}
        >
          {/* Left: Thumbnail & Image info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: '16px',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              <ArtworkMat
                imageUrl={displayImage}
                alt={artwork.title}
                padding="14px"
                maxHeight="440px"
              />
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                }}
              >
                Artwork image is fixed in MVP. Metadata is fully editable.
              </div>
            </div>
          </div>

          {/* Right: Metadata Inputs */}
          <div
            className="card-surface"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '28px',
              boxShadow: 'var(--shadow-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Title */}
            <div>
              <label
                htmlFor="edit-title"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px',
                }}
              >
                Title <span style={{ color: 'var(--color-accent)' }}>*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  fontSize: '0.95rem',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="edit-description"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px',
                }}
              >
                Description
              </label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Medium & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  htmlFor="edit-medium"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Medium
                </label>
                <select
                  id="edit-medium"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-body)',
                    boxSizing: 'border-box',
                  }}
                >
                  {MEDIUM_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-status"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Status
                </label>
                <select
                  id="edit-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-body)',
                    boxSizing: 'border-box',
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Creation Date */}
            <div>
              <label
                htmlFor="edit-date"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px',
                }}
              >
                Creation Date
              </label>
              <input
                id="edit-date"
                type="date"
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Tags Input */}
            <div>
              <label
                htmlFor="edit-tags"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px',
                }}
              >
                Tags
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  id="edit-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag..."
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-body)',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="double-outline-btn"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-secondary)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      label={tag}
                      variant="secondary"
                      onRemove={() => handleRemoveTag(tag)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Collections */}
            {collections.length > 0 && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  Collections
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {collections.map((col) => {
                    const selected = selectedCollections.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => toggleCollection(col.id)}
                        className="double-outline-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-pill)',
                          border: selected
                            ? '1px solid var(--color-accent)'
                            : '1px solid var(--color-border)',
                          backgroundColor: selected
                            ? 'rgba(214, 51, 122, 0.1)'
                            : 'var(--color-background)',
                          color: selected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {selected ? <Check size={13} /> : <Plus size={13} />}
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label
                htmlFor="edit-notes"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px',
                }}
              >
                Studio Notes (Private)
              </label>
              <textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  fontSize: '0.88rem',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '12px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={handleCancel}
                className="double-outline-btn"
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary double-outline-btn"
                style={{
                  padding: '10px 28px',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Discard Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard changes?"
        message="You have unsaved changes to this artwork. Leaving now will discard your modifications."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        variant="warning"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          navigate(`/sketchbook/${artwork.id}`);
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </div>
  );
};
