import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { ArtRoomBoard, ArtRoomItem } from '../types/artRoom';

const LOCAL_STORAGE_BOARD_KEY = 'kin_art_room_board_cache';
const LOCAL_STORAGE_ITEMS_KEY = 'kin_art_room_items_cache';

const DEMO_BOARD: ArtRoomBoard = {
  id: 'board-demo-01',
  user_id: 'demo-artist-01',
  name: 'My Studio Canvas',
  created_at: '2026-08-20T10:00:00Z',
  updated_at: '2026-08-20T10:00:00Z',
};

const DEMO_ITEMS: ArtRoomItem[] = [
  {
    id: 'item-demo-01',
    user_id: 'demo-artist-01',
    board_id: 'board-demo-01',
    type: 'archive_ref',
    x_percent: 22,
    y_percent: 26,
    width_percent: 24,
    height_percent: 28,
    rotation_degrees: -3,
    z_index: 2,
    title: 'Winged Creature & Eye Orb',
    ref_archive_asset_id: 'art-03',
    thumbnail_url: '/artist-reference/art-03.jpeg',
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-08-20T10:00:00Z',
  },
  {
    id: 'item-demo-02',
    user_id: 'demo-artist-01',
    board_id: 'board-demo-01',
    type: 'artwork',
    x_percent: 54,
    y_percent: 22,
    width_percent: 26,
    height_percent: 30,
    rotation_degrees: 2,
    z_index: 3,
    title: 'Dapper Crane with Crown',
    ref_artwork_id: 'art-seed-01',
    thumbnail_url: '/artist-reference/art-01.jpeg',
    created_at: '2026-08-20T10:05:00Z',
    updated_at: '2026-08-20T10:05:00Z',
  },
  {
    id: 'item-demo-03',
    user_id: 'demo-artist-01',
    board_id: 'board-demo-01',
    type: 'book_page',
    x_percent: 26,
    y_percent: 62,
    width_percent: 24,
    height_percent: 28,
    rotation_degrees: 1,
    z_index: 1,
    title: 'Anatomy Study (p. 8)',
    ref_book_id: 'book-seed-01',
    ref_book_page: 8,
    thumbnail_url: '/artist-reference/art-08.jpeg',
    created_at: '2026-08-20T10:10:00Z',
    updated_at: '2026-08-20T10:10:00Z',
  },
  {
    id: 'item-demo-04',
    user_id: 'demo-artist-01',
    board_id: 'board-demo-01',
    type: 'note',
    x_percent: 62,
    y_percent: 65,
    width_percent: 22,
    height_percent: 20,
    rotation_degrees: -2,
    z_index: 4,
    title: 'Studio Thought',
    note_content: 'Focus on harmonic contrast between deep plum striations and lively rust ink offsets.',
    created_at: '2026-08-20T10:15:00Z',
    updated_at: '2026-08-20T10:15:00Z',
  },
];

interface ArtRoomState {
  board: ArtRoomBoard | null;
  items: ArtRoomItem[];
  selectedItemId: string | null;
  loading: boolean;
  fetchBoardAndItems: () => Promise<void>;
  addItem: (
    item: Omit<ArtRoomItem, 'id' | 'user_id' | 'board_id' | 'created_at' | 'updated_at'>
  ) => Promise<ArtRoomItem | null>;
  updateItemPosition: (id: string, x_percent: number, y_percent: number) => Promise<void>;
  updateItemSize: (id: string, width_percent: number, height_percent: number) => Promise<void>;
  updateItemZIndex: (id: string, z_index: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearBoard: () => Promise<void>;
  setSelectedItemId: (id: string | null) => void;
}

function loadLocalBoard(): ArtRoomBoard {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOARD_KEY);
    return raw ? JSON.parse(raw) : DEMO_BOARD;
  } catch {
    return DEMO_BOARD;
  }
}

function loadLocalItems(): ArtRoomItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
    return raw ? JSON.parse(raw) : DEMO_ITEMS;
  } catch {
    return DEMO_ITEMS;
  }
}

function saveLocalItems(items: ArtRoomItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Could not save art room items to localStorage:', err);
  }
}

import { useAuthStore } from './authStore';

function isDemoArtist(): boolean {
  if (isSupabaseDemoMode) return true;
  const user = useAuthStore.getState().user;
  if (!user || user.id.startsWith('demo-')) return true;
  return false;
}

export const useArtRoomStore = create<ArtRoomState>((set, get) => ({
  board: null,
  items: [],
  selectedItemId: null,
  loading: false,

  setSelectedItemId: (id: string | null) => {
    set({ selectedItemId: id });
  },

  fetchBoardAndItems: async () => {
    set({ loading: true });

    if (isDemoArtist()) {
      set({
        board: loadLocalBoard(),
        items: loadLocalItems(),
        loading: false,
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({
          board: loadLocalBoard(),
          items: loadLocalItems(),
          loading: false,
        });
        return;
      }

      // 1. Get or create default board
      let { data: boardData, error: boardError } = await supabase
        .from('art_room_boards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!boardData) {
        const { data: newBoard, error: createError } = await supabase
          .from('art_room_boards')
          .insert({ user_id: user.id, name: 'My Art Room' })
          .select()
          .single();

        if (createError) throw createError;
        boardData = newBoard;
      }

      // 2. Fetch items for this board
      const { data: itemsData, error: itemsError } = await supabase
        .from('art_room_items')
        .select('*')
        .eq('board_id', boardData.id)
        .order('z_index', { ascending: true });

      if (itemsError) throw itemsError;

      set({
        board: boardData,
        items: itemsData ?? [],
        loading: false,
      });
      saveLocalItems(itemsData ?? []);
    } catch (err) {
      console.warn('Art room fetch fallback:', err);
      set({
        board: loadLocalBoard(),
        items: loadLocalItems(),
        loading: false,
      });
    }
  },

  addItem: async (itemData) => {
    const now = new Date().toISOString();
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'item-' + Date.now();

    const maxZ = get().items.reduce((max, i) => Math.max(max, i.z_index), 0);

    if (isDemoArtist()) {
      const newItem: ArtRoomItem = {
        ...itemData,
        id: newId,
        user_id: useAuthStore.getState().user?.id || 'demo-artist-01',
        board_id: get().board?.id || 'board-demo-01',
        z_index: maxZ + 1,
        created_at: now,
        updated_at: now,
      };
      const all = [...get().items, newItem];
      set({ items: all, selectedItemId: newItem.id });
      saveLocalItems(all);
      return newItem;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let boardId = get().board?.id;
      if (!boardId) {
        await get().fetchBoardAndItems();
        boardId = get().board?.id;
      }
      if (!boardId) return null;

      const { data, error } = await supabase
        .from('art_room_items')
        .insert({
          ...itemData,
          user_id: user.id,
          board_id: boardId,
          z_index: maxZ + 1,
        })
        .select()
        .single();

      if (error) {
        console.warn('Add art room item error:', error.message);
        return null;
      }

      const all = [...get().items, data];
      set({ items: all, selectedItemId: data.id });
      saveLocalItems(all);
      return data;
    } catch (err) {
      console.warn('Add art room item failed:', err);
      return null;
    }
  },

  updateItemPosition: async (id, x_percent, y_percent) => {
    const clampedX = Math.min(95, Math.max(0, x_percent));
    const clampedY = Math.min(95, Math.max(0, y_percent));
    const now = new Date().toISOString();

    const next = get().items.map((i) =>
      i.id === id ? { ...i, x_percent: clampedX, y_percent: clampedY, updated_at: now } : i
    );
    set({ items: next });
    saveLocalItems(next);

    if (isSupabaseDemoMode) return;

    try {
      await supabase
        .from('art_room_items')
        .update({ x_percent: clampedX, y_percent: clampedY, updated_at: now })
        .eq('id', id);
    } catch (err) {
      console.warn('Update item position error:', err);
    }
  },

  updateItemSize: async (id, width_percent, height_percent) => {
    const now = new Date().toISOString();
    const next = get().items.map((i) =>
      i.id === id ? { ...i, width_percent, height_percent, updated_at: now } : i
    );
    set({ items: next });
    saveLocalItems(next);

    if (isSupabaseDemoMode) return;

    try {
      await supabase
        .from('art_room_items')
        .update({ width_percent, height_percent, updated_at: now })
        .eq('id', id);
    } catch (err) {
      console.warn('Update item size error:', err);
    }
  },

  updateItemZIndex: async (id, z_index) => {
    const now = new Date().toISOString();
    const next = get().items.map((i) =>
      i.id === id ? { ...i, z_index, updated_at: now } : i
    );
    set({ items: next });
    saveLocalItems(next);

    if (isSupabaseDemoMode) return;

    try {
      await supabase
        .from('art_room_items')
        .update({ z_index, updated_at: now })
        .eq('id', id);
    } catch (err) {
      console.warn('Update item z-index error:', err);
    }
  },

  removeItem: async (id) => {
    const next = get().items.filter((i) => i.id !== id);
    set({ items: next, selectedItemId: get().selectedItemId === id ? null : get().selectedItemId });
    saveLocalItems(next);

    if (isSupabaseDemoMode) return;

    try {
      await supabase.from('art_room_items').delete().eq('id', id);
    } catch (err) {
      console.warn('Remove item error:', err);
    }
  },

  clearBoard: async () => {
    const boardId = get().board?.id;
    set({ items: [], selectedItemId: null });
    saveLocalItems([]);

    if (isSupabaseDemoMode || !boardId) return;

    try {
      await supabase.from('art_room_items').delete().eq('board_id', boardId);
    } catch (err) {
      console.warn('Clear board error:', err);
    }
  },
}));
