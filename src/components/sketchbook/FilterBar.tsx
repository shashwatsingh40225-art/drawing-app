import React from 'react';
import { useCollectionStore } from '../../stores/collectionStore';
import { Search, Star, X, Folder } from 'lucide-react';
import { worlds } from '../../styles/tokens';

export interface FilterState {
  medium: string;
  status: string;
  collectionId: string;
  favoritesOnly: boolean;
  searchTag: string;
  sortBy: 'newest' | 'oldest' | 'title-asc' | 'title-desc';
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onOpenCollections: () => void;
  totalCount: number;
  filteredCount: number;
}

const MEDIUM_OPTIONS = [
  'All Mediums',
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
  { value: 'all', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'study', label: 'Study' },
  { value: 'abandoned', label: 'Abandoned' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onOpenCollections,
  totalCount,
  filteredCount,
}) => {
  const world = worlds.magentaCreature;
  const { collections } = useCollectionStore();

  const isFiltered =
    filters.medium !== 'All Mediums' ||
    filters.status !== 'all' ||
    filters.collectionId !== 'all' ||
    filters.favoritesOnly ||
    Boolean(filters.searchTag.trim());

  const handleReset = () => {
    onChange({
      medium: 'All Mediums',
      status: 'all',
      collectionId: 'all',
      favoritesOnly: false,
      searchTag: '',
      sortBy: 'newest',
    });
  };

  return (
    <div
      className="filter-bar-container"
      style={{
        backgroundColor: world.surface,
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${world.border}`,
        padding: '14px 18px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Top Filter Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Tag Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: `1px solid ${world.border}`,
            borderRadius: 'var(--radius-pill)',
            padding: '6px 14px',
            flex: '1 1 220px',
            maxWidth: '340px',
          }}
        >
          <Search size={15} color={world.textMuted} />
          <input
            type="text"
            value={filters.searchTag}
            onChange={(e) => onChange({ ...filters, searchTag: e.target.value })}
            placeholder="Search tags or keywords..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '0.86rem',
              color: world.textPrimary,
              fontFamily: 'var(--font-body)',
            }}
          />
          {filters.searchTag && (
            <button
              onClick={() => onChange({ ...filters, searchTag: '' })}
              style={{
                background: 'none',
                border: 'none',
                color: world.textMuted,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Medium Dropdown */}
        <select
          value={filters.medium}
          onChange={(e) => onChange({ ...filters, medium: e.target.value })}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-pill)',
            border: `1px solid ${world.border}`,
            backgroundColor: '#FFFFFF',
            color: world.textPrimary,
            fontSize: '0.84rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-subtle)',
          }}
          aria-label="Filter by medium"
        >
          {MEDIUM_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-pill)',
            border: `1px solid ${world.border}`,
            backgroundColor: '#FFFFFF',
            color: world.textPrimary,
            fontSize: '0.84rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-subtle)',
          }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Collection Dropdown */}
        <select
          value={filters.collectionId}
          onChange={(e) => onChange({ ...filters, collectionId: e.target.value })}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--radius-pill)',
            border: `1px solid ${world.border}`,
            backgroundColor: '#FFFFFF',
            color: world.textPrimary,
            fontSize: '0.84rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-subtle)',
          }}
          aria-label="Filter by collection"
        >
          <option value="all">All Collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              📁 {c.name}
            </option>
          ))}
        </select>

        {/* Favorites Toggle */}
        <button
          onClick={() => onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
          className="double-outline-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: 'var(--radius-pill)',
            border: `1px solid ${filters.favoritesOnly ? world.accent : world.border}`,
            backgroundColor: filters.favoritesOnly ? world.accent : '#FFFFFF',
            color: filters.favoritesOnly ? '#FFFFFF' : world.textPrimary,
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: filters.favoritesOnly ? '0 2px 8px rgba(255, 45, 149, 0.25)' : 'var(--shadow-subtle)',
            transition: 'all 180ms ease',
          }}
        >
          <Star
            size={14}
            fill={filters.favoritesOnly ? '#FFFFFF' : 'none'}
            color={filters.favoritesOnly ? '#FFFFFF' : world.accent}
          />
          <span>Favorites</span>
        </button>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: world.textSecondary, fontWeight: 500 }}>Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${world.border}`,
              backgroundColor: '#FFFFFF',
              color: world.textPrimary,
              fontSize: '0.84rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-subtle)',
            }}
            aria-label="Sort artworks"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Bottom Bar: Collection Manager Link & Active Filters Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          paddingTop: '8px',
          borderTop: `1px solid ${world.borderSubtle}`,
          fontSize: '0.82rem',
          color: world.textSecondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>
            Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> artworks
          </span>
          {isFiltered && (
            <button
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: world.accent,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
                textDecoration: 'underline',
              }}
            >
              <X size={13} />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        <button
          onClick={onOpenCollections}
          className="double-outline-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: world.surface,
            border: `1px solid ${world.border}`,
            borderRadius: 'var(--radius-pill)',
            padding: '5px 14px',
            color: world.textSecondary,
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Folder size={14} color={world.accent} />
          <span>Manage Collections ({collections.length})</span>
        </button>
      </div>
    </div>
  );
};
