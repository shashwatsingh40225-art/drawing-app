import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArtworkStore } from '../stores/artworkStore';
import { useCollectionStore } from '../stores/collectionStore';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { uploadArtworkImage } from '../services/imageService';
import { PageHeader } from '../components/ui/PageHeader';
import { ArtworkMat } from '../components/ui/ArtworkMat';
import { Badge } from '../components/ui/Badge';
import { toISODate } from '../utils/dates';
import { normalizeTag, deduplicateTags } from '../utils/tags';
import { ConcentricPortal } from '../components/ConcentricPortal';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  Check, 
  ArrowLeft, 
  Plus, 
  FileText
} from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

interface UploadScreenProps {
  onProceedToProcessing?: (drawing: { url: string; title: string; source: string }) => void;
  onCancel?: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = () => {
  const navigate = useNavigate();
  const { addArtwork } = useArtworkStore();
  const { collections } = useCollectionStore();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload & File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Metadata Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [medium, setMedium] = useState('Ink Pen');
  const [creationDate, setCreationDate] = useState(toISODate(new Date()));
  const [status, setStatus] = useState<'completed' | 'in-progress' | 'study' | 'abandoned'>('completed');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  const handleValidateAndSetFile = (file: File) => {
    setFileError(null);

    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic)$/i)) {
      setFileError('Supported formats: JPEG, PNG, WebP, HEIC.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Image must be under 10MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Default title to filename without extension
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const formattedTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    setTitle(formattedTitle);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleValidateAndSetFile(e.target.files[0]);
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

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleResetImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('Please select a drawing to upload.');
      return;
    }
    if (!title.trim()) {
      setFileError('Please provide a title for your drawing.');
      return;
    }

    setIsSubmitting(true);
    const userId = user?.id || 'demo-artist-01';
    const artworkId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'art-' + Date.now();

    try {
      // 1. Compress and upload images
      const uploadRes = await uploadArtworkImage(selectedFile, userId, artworkId);

      // 2. Insert artwork metadata into database
      const created = await addArtwork({
        title: title.trim(),
        description: description.trim(),
        creation_date: creationDate,
        medium,
        subject: '',
        tags: deduplicateTags(tags),
        is_favorite: false,
        status,
        notes: notes.trim(),
        image_path: uploadRes.imageUrl || uploadRes.imagePath,
        thumbnail_path: uploadRes.thumbnailUrl || uploadRes.thumbnailPath,
        collection_ids: selectedCollections,
      });

      showToast({
        type: 'success',
        message: `"${title}" has been saved to your sketchbook.`,
      });

      if (created) {
        navigate(`/sketchbook/${created.id}`);
      } else {
        navigate('/sketchbook');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setFileError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '36px 24px 96px 24px',
      }}
    >
      <PageHeader
        icon={<UploadCloud size={16} />}
        eyebrowLabel="Studio Folio Upload"
        title="Upload Drawing"
        description="Preserve your drawing in high fidelity with metadata, medium classification, and sketchbook collections."
        action={
          <button
            type="button"
            onClick={() => navigate('/sketchbook')}
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
            <span>To Sketchbook</span>
          </button>
        }
      />

      {/* Main Upload / Metadata Container */}
      {!selectedFile ? (
        /* Drag & Drop Ruled Notebook Box */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="double-outline-card"
          style={{
            border: `2px dashed ${dragActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: dragActive ? 'rgba(214, 51, 122, 0.04)' : 'var(--color-surface)',
            padding: '64px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--shadow-subtle)',
            maxWidth: '720px',
            margin: '0 auto',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(58, 33, 64, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: 'var(--color-secondary)',
            }}
          >
            <UploadCloud size={32} />
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              margin: '0 0 8px 0',
            }}
          >
            Drop your artwork here, or browse files
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              margin: '0 0 20px 0',
            }}
          >
            Supports JPEG, PNG, WebP, or HEIC up to 10MB.
          </p>

          <button
            type="button"
            className="btn-primary double-outline-btn"
            style={{
              padding: '10px 24px',
              fontSize: '0.92rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ImageIcon size={16} />
            <span>Select Image File</span>
          </button>

          {fileError && (
            <div
              style={{
                marginTop: '20px',
                color: 'var(--color-error)',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              {fileError}
            </div>
          )}
        </div>
      ) : (
        /* Image Preview + Metadata Entry Split Layout */
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
            {/* Left Column: ArtworkMat Preview */}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Image Preview
                  </span>
                  <button
                    type="button"
                    onClick={handleResetImage}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-accent)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <X size={14} />
                    <span>Choose Different Image</span>
                  </button>
                </div>

                <ArtworkMat
                  imageUrl={previewUrl}
                  alt={title || 'Drawing preview'}
                  padding="14px"
                  maxHeight="440px"
                  style={{ minHeight: '300px' }}
                />

                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '0.78rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{selectedFile.name}</span>
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            </div>

            {/* Right Column: Metadata Form */}
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
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  margin: 0,
                  borderBottom: '1px solid var(--color-border-subtle)',
                  paddingBottom: '12px',
                }}
              >
                Artwork Metadata
              </h2>

              {/* Title */}
              <div>
                <label
                  htmlFor="artwork-title"
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
                  id="artwork-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dapper Heron Study"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontSize: '0.95rem',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-primary)',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="artwork-desc"
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
                  id="artwork-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artistic notes, inspirations, or context behind this drawing..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-primary)',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Medium and Status (2-col grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    htmlFor="artwork-medium"
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
                    id="artwork-medium"
                    value={medium}
                    onChange={(e) => setMedium(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-text-primary)',
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
                    htmlFor="artwork-status"
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
                    id="artwork-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-text-primary)',
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
                  htmlFor="artwork-date"
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
                  id="artwork-date"
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
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Tags Input */}
              <div>
                <label
                  htmlFor="artwork-tags"
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Tags (Press Enter or comma to add)
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    id="artwork-tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="e.g. bird, ink, feather, study"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-text-primary)',
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

              {/* Collections Multi-Select */}
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
                    Assign to Collections
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
                  htmlFor="artwork-notes"
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
                  id="artwork-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paper texture, pigments used, technique observations..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontSize: '0.88rem',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-primary)',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {fileError && (
                <div
                  style={{
                    color: 'var(--color-error)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(178, 58, 46, 0.08)',
                  }}
                >
                  {fileError}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
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
                  onClick={() => navigate('/sketchbook')}
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
                  disabled={isSubmitting}
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
                  {isSubmitting ? (
                    <>
                      <ConcentricPortal size={18} />
                      <span>Saving to Sketchbook...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Drawing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
