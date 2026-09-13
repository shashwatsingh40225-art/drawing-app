import React from 'react';
import { useCollectionStore } from '../../stores/collectionStore';
import { Search, Star, X, SlidersHorizontal, Folder } from 'lucide-react';

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
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '16px 20px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top Filter Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Tag Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 12px',
            flex: '1 1 220px',
            maxWidth: '340px',
          }}
        >
          <Search size={16} color="var(--color-text-secondary)" />
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
              fontSize: '0.88rem',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
            }}
          />
          {filters.searchTag && (
            <button
              onClick={() => onChange({ ...filters, searchTag: '' })}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
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
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text-primary)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
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
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text-primary)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
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
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text-primary)',
            fontSize: '0.88rem',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
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
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: filters.favoritesOnly
              ? '1px solid var(--color-accent)'
              : '1px solid var(--color-border)',
            backgroundColor: filters.favoritesOnly ? 'rgba(214, 51, 122, 0.1)' : 'var(--color-background)',
            color: filters.favoritesOnly ? 'var(--color-accent)' : 'var(--color-text-primary)',
            fontSize: '0.88rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Star
            size={15}
            fill={filters.favoritesOnly ? 'var(--color-accent)' : 'none'}
            color={filters.favoritesOnly ? 'var(--color-accent)' : 'currentColor'}
          />
          <span>Favorites</span>
        </button>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-primary)',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
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
          paddingTop: '10px',
          borderTop: '1px solid var(--color-border-subtle)',
          fontSize: '0.82rem',
          color: 'var(--color-text-secondary)',
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
                color: 'var(--color-accent)',
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
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 12px',
            color: 'var(--color-secondary)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Folder size={14} />
          <span>Manage Collections ({collections.length})</span>
        </button>
      </div>
    </div>
  );
};
