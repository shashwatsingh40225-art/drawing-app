import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArtworkStore } from '../stores/artworkStore';
import { useCollectionStore } from '../stores/collectionStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterBar, FilterState } from '../components/sketchbook/FilterBar';
import { ArtworkCard } from '../components/sketchbook/ArtworkCard';
import { CollectionModal } from '../components/collections/CollectionModal';
import { UploadCloud, Palette, Download } from 'lucide-react';
import { exportAllData } from '../services/exportService';

export const SketchbookScreen: React.FC = () => {
  const navigate = useNavigate();
  const { artworks, loading, fetchArtworks } = useArtworkStore();
  const { fetchCollections } = useCollectionStore();

  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    medium: 'All Mediums',
    status: 'all',
    collectionId: 'all',
    favoritesOnly: false,
    searchTag: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    fetchArtworks();
    fetchCollections();
  }, [fetchArtworks, fetchCollections]);

  // Client-side additive filtering and sorting
  const filteredArtworks = useMemo(() => {
    return artworks.filter((art) => {
      // Medium filter
      if (filters.medium !== 'All Mediums' && art.medium !== filters.medium) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && art.status !== filters.status) {
        return false;
      }

      // Collection filter
      if (filters.collectionId !== 'all') {
        if (!art.collection_ids || !art.collection_ids.includes(filters.collectionId)) {
          return false;
        }
      }

      // Favorites only
      if (filters.favoritesOnly && !art.is_favorite) {
        return false;
      }

      // Tag & title search
      if (filters.searchTag.trim()) {
        const query = filters.searchTag.trim().toLowerCase();
        const matchesTitle = art.title.toLowerCase().includes(query);
        const matchesDesc = art.description?.toLowerCase().includes(query);
        const matchesMedium = art.medium?.toLowerCase().includes(query);
        const matchesTags = art.tags?.some((t) => t.toLowerCase().includes(query));

        if (!matchesTitle && !matchesDesc && !matchesMedium && !matchesTags) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.creation_date || b.upload_date).getTime() - new Date(a.creation_date || a.upload_date).getTime();
      }
      if (filters.sortBy === 'oldest') {
        return new Date(a.creation_date || a.upload_date).getTime() - new Date(b.creation_date || b.upload_date).getTime();
      }
      if (filters.sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (filters.sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
  }, [artworks, filters]);

  return (
    <div
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '36px 24px 96px 24px',
      }}
    >
      <PageHeader
        icon={<Palette size={16} />}
        eyebrowLabel={`${artworks.length} drawings in sketchbook`}
        title="Your Sketchbook"
        description="Every drawing, study, and folio in your personal artistic journey. Organized by medium, status, and theme."
        action={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={exportAllData}
              className="double-outline-btn"
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title="Export all artwork data as JSON"
            >
              <Download size={15} />
              <span>Export</span>
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary double-outline-btn"
              style={{
                padding: '10px 20px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <UploadCloud size={16} />
              <span>Upload New Drawing</span>
            </button>
          </div>
        }
      />

      {/* Filter and Control Bar */}
      {artworks.length > 0 && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onOpenCollections={() => setIsCollectionsOpen(true)}
          totalCount={artworks.length}
          filteredCount={filteredArtworks.length}
        />
      )}

      {/* Main Grid View or Empty States */}
      {artworks.length === 0 && !loading ? (
        <EmptyState
          artworkSrc="/artist-reference/art-01.jpeg"
          headline="Your sketchbook is waiting"
          description="Upload your first drawing to start preserving your artistic expressions and creative timeline."
          actionLabel="Upload First Drawing"
          onAction={() => navigate('/upload')}
        />
      ) : filteredArtworks.length === 0 && !loading ? (
        <EmptyState
          artworkSrc="/artist-reference/art-01.jpeg"
          headline="No artworks match your filters"
          description="Try adjusting your medium, status, or search keywords to view your drawings."
          actionLabel="Clear All Filters"
          onAction={() =>
            setFilters({
              medium: 'All Mediums',
              status: 'all',
              collectionId: 'all',
              favoritesOnly: false,
              searchTag: '',
              sortBy: 'newest',
            })
          }
        />
      ) : (
        <div
          className="sketchbook-grid artwork-gallery-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredArtworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}

      {/* Collection Management Modal */}
      <CollectionModal
        isOpen={isCollectionsOpen}
        onClose={() => setIsCollectionsOpen(false)}
      />
    </div>
  );
};
