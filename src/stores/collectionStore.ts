import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const LOCAL_STORAGE_KEY = 'kin_collections_cache';

const DEMO_SEED_COLLECTIONS: Collection[] = [
  {
    id: 'col-seed-01',
    user_id: 'demo-artist-01',
    name: 'Avian Chronicles',
    description: 'Studies of ceremonial birds, plumage textures, and avian poses.',
    sort_order: 1,
    created_at: '2026-08-10T12:00:00Z',
    updated_at: '2026-08-10T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 'col-seed-02',
    user_id: 'demo-artist-01',
    name: 'Botanical & Heraldry',
    description: 'Shield emblems, foliate borders, and ornamental crests.',
    sort_order: 2,
    created_at: '2026-08-25T15:00:00Z',
    updated_at: '2026-08-25T15:00:00Z',
    deleted_at: null,
  },
];

interface CollectionState {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  fetchCollections: () => Promise<void>;
  addCollection: (name: string, description?: string) => Promise<Collection | null>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}

function loadLocalCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEMO_SEED_COLLECTIONS));
      return DEMO_SEED_COLLECTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_SEED_COLLECTIONS;
  }
}

function saveLocalCollections(cols: Collection[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cols));
  } catch (err) {
    console.warn('Could not save collections to localStorage:', err);
  }
}

import { useAuthStore } from './authStore';

function isDemoArtist(): boolean {
  if (isSupabaseDemoMode) return true;
  const user = useAuthStore.getState().user;
  if (!user || user.id.startsWith('demo-')) return true;
  return false;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  loading: false,
  error: null,

  fetchCollections: async () => {
    set({ loading: true, error: null });

    if (isDemoArtist()) {
      const items = loadLocalCollections().filter((c) => !c.deleted_at);
      set({ collections: items, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (error) {
        const items = loadLocalCollections().filter((c) => !c.deleted_at);
        set({ collections: items, loading: false });
        return;
      }
      set({ collections: data ?? [], loading: false });
    } catch {
      const items = loadLocalCollections().filter((c) => !c.deleted_at);
      set({ collections: items, loading: false });
    }
  },

  addCollection: async (name, description = '') => {
    const now = new Date().toISOString();
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'col-' + Date.now();

    if (isDemoArtist()) {
      const newCol: Collection = {
        id: newId,
        user_id: useAuthStore.getState().user?.id || 'demo-artist-01',
        name,
        description,
        sort_order: get().collections.length + 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      const all = [...loadLocalCollections(), newCol];
      saveLocalCollections(all);
      set({ collections: [...get().collections, newCol] });
      return newCol;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const newCol: Collection = {
          id: newId,
          user_id: 'demo-artist-01',
          name,
          description,
          sort_order: get().collections.length + 1,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        };
        const all = [...loadLocalCollections(), newCol];
        saveLocalCollections(all);
        set({ collections: [...get().collections, newCol] });
        return newCol;
      }

      const { data, error } = await supabase
        .from('collections')
        .insert({ name, description, user_id: user.id })
        .select()
        .single();

      if (error) {
        console.warn('Supabase add collection error, saving locally:', error.message);
        const newCol: Collection = {
          id: newId,
          user_id: user.id,
          name,
          description,
          sort_order: get().collections.length + 1,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        };
        const all = [...loadLocalCollections(), newCol];
        saveLocalCollections(all);
        set({ collections: [...get().collections, newCol] });
        return newCol;
      }
      set({ collections: [...get().collections, data] });
      return data;
    } catch (err) {
      console.warn('Collection add exception, saving locally:', err);
      const newCol: Collection = {
        id: newId,
        user_id: 'demo-artist-01',
        name,
        description,
        sort_order: get().collections.length + 1,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      const all = [...loadLocalCollections(), newCol];
      saveLocalCollections(all);
      set({ collections: [...get().collections, newCol] });
      return newCol;
    }
  },

  updateCollection: async (id, updates) => {
    const now = new Date().toISOString();

    if (isDemoArtist()) {
      const all = loadLocalCollections().map((c) =>
        c.id === id ? { ...c, ...updates, updated_at: now } : c
      );
      saveLocalCollections(all);
      set({
        collections: get().collections.map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: now } : c
        ),
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('collections')
        .update({ ...updates, updated_at: now })
        .eq('id', id);

      if (error) {
        console.warn('Update collection error, saving locally:', error.message);
        const all = loadLocalCollections().map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: now } : c
        );
        saveLocalCollections(all);
      }
      set({
        collections: get().collections.map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: now } : c
        ),
      });
    } catch (err) {
      console.warn('Update collection error:', err);
      const all = loadLocalCollections().map((c) =>
        c.id === id ? { ...c, ...updates, updated_at: now } : c
      );
      saveLocalCollections(all);
      set({
        collections: get().collections.map((c) =>
          c.id === id ? { ...c, ...updates, updated_at: now } : c
        ),
      });
    }
  },

  deleteCollection: async (id) => {
    const now = new Date().toISOString();

    if (isDemoArtist()) {
      const all = loadLocalCollections().map((c) =>
        c.id === id ? { ...c, deleted_at: now } : c
      );
      saveLocalCollections(all);
      set({ collections: get().collections.filter((c) => c.id !== id) });
      return;
    }

    try {
      const { error } = await supabase
        .from('collections')
        .update({ deleted_at: now })
        .eq('id', id);

      if (error) {
        console.warn('Delete collection error, updating locally:', error.message);
      }
      const all = loadLocalCollections().map((c) =>
        c.id === id ? { ...c, deleted_at: now } : c
      );
      saveLocalCollections(all);
      set({ collections: get().collections.filter((c) => c.id !== id) });
    } catch (err) {
      console.warn('Delete collection error:', err);
      const all = loadLocalCollections().map((c) =>
        c.id === id ? { ...c, deleted_at: now } : c
      );
      saveLocalCollections(all);
      set({ collections: get().collections.filter((c) => c.id !== id) });
    }
  },
}));
