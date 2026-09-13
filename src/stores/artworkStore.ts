import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';

import { Artwork } from '../types/artwork';
export type { Artwork } from '../types/artwork';

const LOCAL_STORAGE_KEY = 'kin_artworks_cache';

const DEMO_SEED_ARTWORKS: Artwork[] = [
  {
    id: 'art-seed-01',
    user_id: 'demo-artist-01',
    title: 'Dapper Crane with Crown',
    description: 'Detailed ink pen study focusing on feathery textures and stately silhouette.',
    creation_date: '2026-08-15',
    upload_date: '2026-08-15T10:00:00Z',
    updated_at: '2026-08-15T10:00:00Z',
    deleted_at: null,
    medium: 'Ink Pen',
    subject: 'Avian & Birds',
    tags: ['crane', 'crown', 'ink', 'avian'],
    is_favorite: true,
    status: 'completed',
    notes: 'Used 0.1mm micron on cream cold-press paper.',
    image_path: '/artist-reference/art-01.jpeg',
    thumbnail_path: '/artist-reference/art-01.jpeg',
    collection_ids: ['col-seed-01'],
  },
  {
    id: 'art-seed-02',
    user_id: 'demo-artist-01',
    title: 'The Gilded Falcon',
    description: 'Exploration of plumage layering with warm sepia and rust highlights.',
    creation_date: '2026-08-20',
    upload_date: '2026-08-20T14:30:00Z',
    updated_at: '2026-08-20T14:30:00Z',
    deleted_at: null,
    medium: 'Mixed Media',
    subject: 'Avian & Birds',
    tags: ['falcon', 'plumage', 'wings'],
    is_favorite: false,
    status: 'completed',
    notes: 'Drying time between washes was essential.',
    image_path: '/artist-reference/art-02.jpeg',
    thumbnail_path: '/artist-reference/art-02.jpeg',
    collection_ids: ['col-seed-01'],
  },
  {
    id: 'art-seed-03',
    user_id: 'demo-artist-01',
    title: 'Ceremonial Owl Study',
    description: 'Focusing on concentric disc structures around the eyes.',
    creation_date: '2026-08-28',
    upload_date: '2026-08-28T09:15:00Z',
    updated_at: '2026-08-28T09:15:00Z',
    deleted_at: null,
    medium: 'Pencil',
    subject: 'Avian & Birds',
    tags: ['owl', 'eyes', 'pencil', 'study'],
    is_favorite: true,
    status: 'study',
    notes: 'Need to refine contrast around the beak.',
    image_path: '/artist-reference/art-03.jpeg',
    thumbnail_path: '/artist-reference/art-03.jpeg',
    collection_ids: [],
  },
  {
    id: 'art-seed-04',
    user_id: 'demo-artist-01',
    title: 'Heraldic Crest Draft',
    description: 'Work-in-progress botanical and animal shield iconography.',
    creation_date: '2026-09-02',
    upload_date: '2026-09-02T16:00:00Z',
    updated_at: '2026-09-02T16:00:00Z',
    deleted_at: null,
    medium: 'Marker',
    subject: 'Heraldry & Flora',
    tags: ['heraldry', 'botanical', 'flora'],
    is_favorite: false,
    status: 'in-progress',
    notes: 'Palette restricted to rust and burgundy.',
    image_path: '/artist-reference/art-04.jpeg',
    thumbnail_path: '/artist-reference/art-04.jpeg',
    collection_ids: ['col-seed-02'],
  },
  {
    id: 'art-seed-05',
    user_id: 'demo-artist-01',
    title: 'Foliage & Feathers Motif',
    description: 'Intertwined organic patterns with fine linework.',
    creation_date: '2026-09-08',
    upload_date: '2026-09-08T11:00:00Z',
    updated_at: '2026-09-08T11:00:00Z',
    deleted_at: null,
    medium: 'Ink Pen',
    subject: 'Botany & Texture',
    tags: ['leaves', 'pattern', 'linework'],
    is_favorite: true,
    status: 'completed',
    notes: 'Experimenting with rhythmic spacing.',
    image_path: '/artist-reference/art-05.jpeg',
    thumbnail_path: '/artist-reference/art-05.jpeg',
    collection_ids: ['col-seed-02'],
  },
];

interface ArtworkState {
  artworks: Artwork[];
  loading: boolean;
  error: string | null;
  fetchArtworks: () => Promise<void>;
  addArtwork: (artwork: Omit<Artwork, 'id' | 'user_id' | 'upload_date' | 'updated_at' | 'deleted_at'>) => Promise<Artwork | null>;
  updateArtwork: (id: string, updates: Partial<Artwork>) => Promise<void>;
  softDeleteArtwork: (id: string) => Promise<void>;
  restoreArtwork: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

function loadLocalArtworks(): Artwork[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEMO_SEED_ARTWORKS));
      return DEMO_SEED_ARTWORKS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_SEED_ARTWORKS;
  }
}

function saveLocalArtworks(artworks: Artwork[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(artworks));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
}

export const useArtworkStore = create<ArtworkState>((set, get) => ({
  artworks: [],
  loading: false,
  error: null,

  fetchArtworks: async () => {
    set({ loading: true, error: null });

    if (isSupabaseDemoMode) {
      const items = loadLocalArtworks().filter((a) => !a.deleted_at);
      set({ artworks: items, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .is('deleted_at', null)
        .order('creation_date', { ascending: false });

      if (error) {
        // Fallback to local cache if offline or error
        const items = loadLocalArtworks().filter((a) => !a.deleted_at);
        set({ artworks: items, loading: false });
        return;
      }
      set({ artworks: data ?? [], loading: false });
    } catch (err) {
      const items = loadLocalArtworks().filter((a) => !a.deleted_at);
      set({ artworks: items, loading: false });
    }
  },

  addArtwork: async (artwork) => {
    const now = new Date().toISOString();
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'art-' + Date.now();

    if (isSupabaseDemoMode) {
      const newArtwork: Artwork = {
        ...artwork,
        id: newId,
        user_id: 'demo-artist-01',
        upload_date: now,
        updated_at: now,
        deleted_at: null,
      };
      const all = [newArtwork, ...loadLocalArtworks()];
      saveLocalArtworks(all);
      set({ artworks: [newArtwork, ...get().artworks] });
      return newArtwork;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: 'Not authenticated' });
        return null;
      }

      const { data, error } = await supabase
        .from('artworks')
        .insert({ ...artwork, user_id: user.id })
        .select()
        .single();

      if (error) {
        set({ error: error.message });
        return null;
      }
      set({ artworks: [data, ...get().artworks] });
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      set({ error: msg });
      return null;
    }
  },

  updateArtwork: async (id, updates) => {
    const now = new Date().toISOString();

    if (isSupabaseDemoMode) {
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, ...updates, updated_at: now } : a
      );
      saveLocalArtworks(all);
      set({
        artworks: get().artworks.map((a) =>
          a.id === id ? { ...a, ...updates, updated_at: now } : a
        ),
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('artworks')
        .update({ ...updates, updated_at: now })
        .eq('id', id);

      if (error) {
        set({ error: error.message });
        return;
      }
      set({
        artworks: get().artworks.map((a) =>
          a.id === id ? { ...a, ...updates, updated_at: now } : a
        ),
      });
    } catch (err) {
      console.warn('Update failed:', err);
    }
  },

  softDeleteArtwork: async (id) => {
    const deletedAt = new Date().toISOString();

    if (isSupabaseDemoMode) {
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, deleted_at: deletedAt } : a
      );
      saveLocalArtworks(all);
      set({ artworks: get().artworks.filter((a) => a.id !== id) });
      return;
    }

    try {
      const { error } = await supabase
        .from('artworks')
        .update({ deleted_at: deletedAt })
        .eq('id', id);

      if (error) {
        set({ error: error.message });
        return;
      }
      set({ artworks: get().artworks.filter((a) => a.id !== id) });
    } catch (err) {
      console.warn('Delete failed:', err);
    }
  },

  restoreArtwork: async (id) => {
    if (isSupabaseDemoMode) {
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, deleted_at: null } : a
      );
      saveLocalArtworks(all);
      const restored = all.find((a) => a.id === id);
      if (restored) {
        set({ artworks: [restored, ...get().artworks] });
      }
      return;
    }

    try {
      await supabase
        .from('artworks')
        .update({ deleted_at: null })
        .eq('id', id);
      get().fetchArtworks();
    } catch (err) {
      console.warn('Restore failed:', err);
    }
  },

  toggleFavorite: async (id) => {
    const artwork = get().artworks.find((a) => a.id === id);
    if (!artwork) return;

    const newFav = !artwork.is_favorite;

    if (isSupabaseDemoMode) {
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, is_favorite: newFav } : a
      );
      saveLocalArtworks(all);
      set({
        artworks: get().artworks.map((a) =>
          a.id === id ? { ...a, is_favorite: newFav } : a
        ),
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('artworks')
        .update({ is_favorite: newFav })
        .eq('id', id);

      if (error) {
        set({ error: error.message });
        return;
      }
      set({
        artworks: get().artworks.map((a) =>
          a.id === id ? { ...a, is_favorite: newFav } : a
        ),
      });
    } catch (err) {
      console.warn('Favorite toggle failed:', err);
    }
  },
}));
