import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useArtworkStore } from '../stores/artworkStore';
import { useCollectionStore } from '../stores/collectionStore';
import { useToastStore } from '../stores/toastStore';
import { getImageUrl } from '../services/imageService';
import { ArtworkMat } from '../components/ui/ArtworkMat';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, formatRelative } from '../utils/dates';
import { 
  ArrowLeft, 
  Star, 
  Edit3, 
  Trash2, 
  Calendar, 
  Folder, 
  FileText,
  Tag as TagIcon
} from 'lucide-react';

export const PersonalArtworkDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { artworks, toggleFavorite, softDeleteArtwork, restoreArtwork, fetchArtworks } = useArtworkStore();
  const { collections, fetchCollections } = useCollectionStore();
  const { showToast } = useToastStore();

  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchArtworks();
    fetchCollections();
  }, [fetchArtworks, fetchCollections]);

  const artwork = artworks.find((a) => a.id === id);

  useEffect(() => {
    if (artwork?.image_path) {
      getImageUrl(artwork.image_path).then((url) => {
        setFullImageUrl(url);
      });
    }
  }, [artwork?.image_path]);

  if (!artwork) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        <EmptyState
          artworkSrc="/brand/illustrations/art-09-card.png"
          headline="Drawing Not Found"
          description="This artwork may have been removed or does not exist in your sketchbook."
          actionLabel="Return to Sketchbook"
          onAction={() => navigate('/my-art')}
        />
      </div>
    );
  }

  const assignedCollections = collections.filter((c) =>
    artwork.collection_ids?.includes(c.id)
  );

  const displayImage = fullImageUrl || artwork.thumbnail_path || artwork.image_path || null;

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    await softDeleteArtwork(artwork.id);
    navigate('/my-art');

    showToast({
      type: 'info',
      message: `"${artwork.title}" moved to trash.`,
      duration: 10000,
      action: {
        label: 'Undo',
        onClick: async () => {
          await restoreArtwork(artwork.id);
          showToast({ type: 'success', message: `"${artwork.title}" restored.` });
        },
      },
    });
  };

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '36px 24px 96px 24px',
      }}
    >
      {/* Back Navigation Bar */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/my-art')}
          className="double-outline-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Sketchbook</span>
        </button>
      </div>

      {/* Two Column Layout: 60% Image Mat, 40% Metadata Panel */}
      <div
        className="two-column-detail-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Image Mat */}
        <div>
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '20px',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <ArtworkMat
              imageUrl={displayImage}
              alt={artwork.title}
              padding="16px"
              style={{
                minHeight: '380px',
                maxHeight: '640px',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Right Column: Metadata Details */}
        <div
          className="card-surface"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '32px',
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Header Title & Badges */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {artwork.medium && (
                <Badge label={artwork.medium} variant="secondary" />
              )}
              {artwork.status && (
                <Badge
                  label={
                    artwork.status === 'completed'
                      ? 'Completed'
                      : artwork.status === 'in-progress'
                      ? 'In Progress'
                      : artwork.status === 'study'
                      ? 'Study'
                      : 'Abandoned'
                  }
                  variant={artwork.status === 'completed' ? 'teal' : 'muted'}
                />
              )}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  marginLeft: 'auto',
                }}
              >
                <Calendar size={13} />
                <span>{formatDate(artwork.creation_date || artwork.upload_date)}</span>
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                margin: '0 0 10px 0',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {artwork.title}
            </h1>

            {artwork.description ? (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {artwork.description}
              </p>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                No description provided.
              </p>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: 0 }} />

          {/* Tags */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <TagIcon size={13} />
              <span>Tags</span>
            </div>
            {artwork.tags && artwork.tags.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {artwork.tags.map((tag) => (
                  <Badge key={tag} label={`#${tag}`} variant="outline" />
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>No tags added</span>
            )}
          </div>

          {/* Collections */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Folder size={13} />
              <span>Collections</span>
            </div>
            {assignedCollections.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {assignedCollections.map((col) => (
                  <span
                    key={col.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(58, 33, 64, 0.05)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    📁 {col.name}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Unassigned to any collection</span>
            )}
          </div>

          {/* Studio Notes */}
          {artwork.notes && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <FileText size={13} />
                <span>Private Studio Notes</span>
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.88rem',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {artwork.notes}
              </div>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: 0 }} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => toggleFavorite(artwork.id)}
              className="double-outline-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                border: artwork.is_favorite
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                backgroundColor: artwork.is_favorite ? 'rgba(214, 51, 122, 0.1)' : 'transparent',
                color: artwork.is_favorite ? 'var(--color-accent)' : 'var(--color-text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Star
                size={16}
                fill={artwork.is_favorite ? 'var(--color-accent)' : 'none'}
                color={artwork.is_favorite ? 'var(--color-accent)' : 'currentColor'}
              />
              <span>{artwork.is_favorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            <Link
              to={`/my-art/${artwork.id}/edit`}
              className="double-outline-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              <Edit3 size={15} />
              <span>Edit Details</span>
            </Link>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'none',
                color: 'var(--color-error)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this artwork?"
        message="This drawing will be moved to trash. You can undo this action immediately after deletion."
        confirmLabel="Move to Trash"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};


