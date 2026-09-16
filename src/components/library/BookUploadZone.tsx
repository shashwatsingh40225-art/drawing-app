import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { validatePDFFile, validateEpubFile, uploadBookFile, detectBookFormat } from '../../services/bookService';
import { useBookStore } from '../../stores/bookStore';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { UploadProgress } from '../ui/UploadProgress';
import { Book, BookFormat } from '../../types/book';

interface BookUploadZoneProps {
  onSuccess?: (book: Book) => void;
  onCancel?: () => void;
}

export const BookUploadZone: React.FC<BookUploadZoneProps> = ({ onSuccess, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addBook } = useBookStore();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<BookFormat>('pdf');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cleanFilenameToTitle = (filename: string) => {
    return filename
      .replace(/\.(pdf|epub)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleFile = async (file: File) => {
    setValidationError(null);
    setUploadError(null);
    setStatus('idle');

    // Sniff the actual content first — a valid PDF/EPUB downloaded or renamed without its
    // original extension would otherwise be misclassified by filename alone and rejected.
    const sniffed = await detectBookFormat(file);
    const format: BookFormat = sniffed ?? (file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf');
    const result = format === 'epub' ? await validateEpubFile(file) : await validatePDFFile(file);
    if (!result.valid) {
      setValidationError(result.error || `Invalid ${format.toUpperCase()} file`);
      setSelectedFile(null);
      return;
    }

    setSelectedFormat(format);
    setSelectedFile(file);
    setTitle(cleanFilenameToTitle(file.name));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (!title.trim()) {
      setValidationError('Please provide a title for the book');
      return;
    }

    setStatus('uploading');
    setUploadProgress(10);
    setUploadError(null);

    const userId = user?.id || 'demo-artist-01';
    const bookId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'book-' + Date.now();

    try {
      // 1. Upload to storage
      const { filePath } = await uploadBookFile(
        userId,
        bookId,
        selectedFile,
        selectedFormat,
        (percent) => setUploadProgress(percent)
      );

      setStatus('processing');

      // 2. Parse tags
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      // 3. Save to database / store
      const newBook = await addBook({
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        file_path: filePath,
        file_size_bytes: selectedFile.size,
        format: selectedFormat,
        page_count: null, // Will be updated on first render in the reader
        cover_thumbnail_path: null,
        tags,
      });

      if (!newBook) {
        throw new Error('Failed to create book record');
      }

      setStatus('done');
      showToast({
        type: 'success',
        message: `"${title.trim()}" added to your library!`,
      });

      if (onSuccess) {
        onSuccess(newBook);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setStatus('error');
      setUploadError(msg);
      showToast({
        type: 'error',
        message: msg,
      });
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setSelectedFormat('pdf');
    setTitle('');
    setAuthor('');
    setDescription('');
    setTagsInput('');
    setValidationError(null);
    setUploadError(null);
    setStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              margin: '0 0 4px 0',
            }}
          >
            Upload to Private Library
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)' }}>
            Upload reference manuals, anatomy studies, and sketchbook PDFs or EPUBs (max 25MB).
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
            aria-label="Close upload"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {validationError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'rgba(178, 58, 46, 0.08)',
            border: '1px solid rgba(178, 58, 46, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)',
            fontSize: '0.85rem',
            marginBottom: '18px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      {!selectedFile ? (
        /* Dropzone view */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--color-secondary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: isDragging ? 'rgba(180, 83, 31, 0.05)' : 'rgba(58, 33, 64, 0.02)',
            padding: '44px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 200ms ease, background-color 200ms ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf,application/epub+zip,.epub"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(58, 33, 64, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <UploadCloud size={28} color="var(--color-secondary)" />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              marginBottom: '6px',
            }}
          >
            Drop your PDF or EPUB here, or click to browse
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Only valid PDF or EPUB files up to 25MB are supported. Files remain private to your account.
          </p>
        </div>
      ) : (
        /* Selected file & metadata form */
        <form onSubmit={handleUploadSubmit}>
          {/* File summary pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'rgba(58, 33, 64, 0.04)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} color="var(--color-secondary)" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFormat.toUpperCase()} Document
                </div>
              </div>
            </div>
            {status === 'idle' && (
              <button
                type="button"
                onClick={resetSelection}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label="Change file"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Upload Progress Bar when active */}
          {status !== 'idle' && (
            <div style={{ marginBottom: '20px' }}>
              <UploadProgress
                progress={uploadProgress}
                fileName={selectedFile.name}
                fileSize={selectedFile.size}
                status={status}
                error={uploadError}
                onCancel={resetSelection}
              />
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px',
                }}
              >
                Book Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dynamic Anatomy Studies"
                required
                disabled={status === 'uploading' || status === 'processing'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-primary)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Author / Publisher
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Burne Hogarth"
                  disabled={status === 'uploading' || status === 'processing'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="anatomy, reference, hands"
                  disabled={status === 'uploading' || status === 'processing'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: '6px',
                }}
              >
                Description / Study Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key concepts or focus areas covered in this book..."
                rows={3}
                disabled={status === 'uploading' || status === 'processing'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-primary)',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={resetSelection}
              disabled={status === 'uploading' || status === 'processing'}
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'uploading' || status === 'processing'}
              className="btn-primary"
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: status === 'uploading' || status === 'processing' ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'uploading' ? 'Uploading...' : status === 'processing' ? 'Saving...' : 'Add Book to Library'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
