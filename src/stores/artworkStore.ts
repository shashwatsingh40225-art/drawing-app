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

import { useAuthStore } from './authStore';

async function getEffectiveUser() {
  if (isSupabaseDemoMode) {
    return useAuthStore.getState().user || { id: 'demo-artist-01', email: 'artist@kin-studio.local' };
  }
  const storeUser = useAuthStore.getState().user;
  if (storeUser && !storeUser.id.startsWith('demo-')) {
    return storeUser;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !user.id.startsWith('demo-')) {
      return user;
    }
  } catch {
    // fallback
  }
  return storeUser;
}

function isDemoArtist(): boolean {
  if (isSupabaseDemoMode) return true;
  const user = useAuthStore.getState().user;
  if (!user || user.id.startsWith('demo-')) return true;
  return false;
}

export const useArtworkStore = create<ArtworkState>((set, get) => ({
  artworks: [],
  loading: false,
  error: null,

  fetchArtworks: async () => {
    set({ loading: true, error: null });

    const currentUser = await getEffectiveUser();
    const isDemo = isSupabaseDemoMode || !currentUser || currentUser.id.startsWith('demo-');

    if (isDemo) {
      const items = loadLocalArtworks().filter((a) => !a.deleted_at);
      set({ artworks: items, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*, artwork_collection_memberships(collection_id)')
        .is('deleted_at', null)
        .order('creation_date', { ascending: false });

      if (error) {
        // Fallback without join if relationship isn't configured
        const { data: simpleData, error: simpleErr } = await supabase
          .from('artworks')
          .select('*')
          .is('deleted_at', null)
          .order('creation_date', { ascending: false });

        if (simpleErr) {
          console.warn('Supabase fetch failed, using local cache:', simpleErr.message);
          const items = loadLocalArtworks().filter((a) => !a.deleted_at);
          set({ artworks: items, loading: false });
          return;
        }
        set({ artworks: simpleData ?? [], loading: false });
        return;
      }

      const formatted = (data ?? []).map((art: any) => ({
        ...art,
        collection_ids: art.artwork_collection_memberships?.map((m: any) => m.collection_id) || [],
      }));

      set({ artworks: formatted, loading: false });
    } catch (err) {
      const items = loadLocalArtworks().filter((a) => !a.deleted_at);
      set({ artworks: items, loading: false });
    }
  },

  addArtwork: async (artwork) => {
    const now = new Date().toISOString();
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'art-' + Date.now();

    const currentUser = await getEffectiveUser();
    const isDemo = isSupabaseDemoMode || !currentUser || currentUser.id.startsWith('demo-');

    if (isDemo) {
      const newArtwork: Artwork = {
        ...artwork,
        id: newId,
        user_id: currentUser?.id || 'demo-artist-01',
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
      // Destructure collection_ids so Supabase PostgREST insert doesn't reject with PGRST204
      const { collection_ids, ...artworkData } = artwork;

      const { data, error } = await supabase
        .from('artworks')
        .insert({ ...artworkData, user_id: currentUser.id })
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert failed, saving to local artworks cache:', error.message);
        const newArtwork: Artwork = {
          ...artwork,
          id: newId,
          user_id: currentUser.id,
          upload_date: now,
          updated_at: now,
          deleted_at: null,
        };
        const all = [newArtwork, ...loadLocalArtworks()];
        saveLocalArtworks(all);
        set({ artworks: [newArtwork, ...get().artworks] });
        return newArtwork;
      }

      // Link collection memberships if selected
      if (collection_ids && collection_ids.length > 0 && data) {
        try {
          const memberships = collection_ids.map((cid) => ({
            artwork_id: data.id,
            collection_id: cid,
          }));
          await supabase.from('artwork_collection_memberships').insert(memberships);
        } catch (memErr) {
          console.warn('Could not save artwork collection memberships:', memErr);
        }
      }

      const artworkRecord: Artwork = {
        ...data,
        collection_ids: collection_ids || [],
      };

      set({ artworks: [artworkRecord, ...get().artworks] });
      return artworkRecord;
    } catch (err) {
      console.warn('Upload exception, saving to local artworks cache:', err);
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
  },

  updateArtwork: async (id, updates) => {
    const now = new Date().toISOString();

    if (isDemoArtist()) {
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
      const { collection_ids, ...updateData } = updates;
      const { error } = await supabase
        .from('artworks')
        .update({ ...updateData, updated_at: now })
        .eq('id', id);

      if (error) {
        console.warn('Supabase update failed, updating local cache:', error.message);
        const all = loadLocalArtworks().map((a) =>
          a.id === id ? { ...a, ...updates, updated_at: now } : a
        );
        saveLocalArtworks(all);
      }
      set({
        artworks: get().artworks.map((a) =>
          a.id === id ? { ...a, ...updates, updated_at: now } : a
        ),
      });
    } catch (err) {
      console.warn('Update failed:', err);
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, ...updates, updated_at: now } : a
      );
      saveLocalArtworks(all);
      set({
        artworks: get().artworks.map((a) =>
          a.id === id ? { ...a, ...updates, updated_at: now } : a
        ),
      });
    }
  },

  softDeleteArtwork: async (id) => {
    const deletedAt = new Date().toISOString();

    if (isDemoArtist()) {
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
        console.warn('Supabase delete failed, deleting from local cache:', error.message);
      }
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, deleted_at: deletedAt } : a
      );
      saveLocalArtworks(all);
      set({ artworks: get().artworks.filter((a) => a.id !== id) });
    } catch (err) {
      console.warn('Delete failed:', err);
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, deleted_at: deletedAt } : a
      );
      saveLocalArtworks(all);
      set({ artworks: get().artworks.filter((a) => a.id !== id) });
    }
  },

  restoreArtwork: async (id) => {
    if (isDemoArtist()) {
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
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, deleted_at: null } : a
      );
      saveLocalArtworks(all);
      const restored = all.find((a) => a.id === id);
      if (restored) {
        set({ artworks: [restored, ...get().artworks] });
      }
    }
  },

  toggleFavorite: async (id) => {
    const artwork = get().artworks.find((a) => a.id === id);
    if (!artwork) return;

    const newFav = !artwork.is_favorite;

    if (isDemoArtist()) {
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
        console.warn('Supabase favorite toggle failed:', error.message);
      }
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, is_favorite: newFav } : a
      );
      saveLocalArtworks(all);
      set({
        artworks: get().artworks.map((a) =>
          a.id === id ? { ...a, is_favorite: newFav } : a
        ),
      });
    } catch (err) {
      console.warn('Favorite toggle failed:', err);
      const all = loadLocalArtworks().map((a) =>
        a.id === id ? { ...a, is_favorite: newFav } : a
      );
      saveLocalArtworks(all);
      set({
        artworks: get().artworks.map((a) =>
          a.id === id ? { ...a, is_favorite: newFav } : a
        ),
      });
    }
  },
}));
