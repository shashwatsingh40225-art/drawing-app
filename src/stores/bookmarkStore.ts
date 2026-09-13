import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { Bookmark, BookmarkColor } from '../types/book';

const LOCAL_STORAGE_KEY = 'kin_bookmarks_cache';

interface BookmarkState {
  bookmarks: Bookmark[];
  loading: boolean;
  fetchBookmarks: (bookId: string) => Promise<void>;
  getBookmarks: (bookId: string) => Bookmark[];
  isPageBookmarked: (bookId: string, pageNumber: number) => boolean;
  addBookmark: (
    bookId: string,
    pageNumber: number,
    label?: string,
    color?: BookmarkColor | string
  ) => Promise<Bookmark | null>;
  removeBookmark: (id: string) => Promise<void>;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => Promise<void>;
}

function loadLocalBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBookmarks(bookmarks: Bookmark[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (err) {
    console.warn('Could not save bookmarks to localStorage:', err);
  }
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: loadLocalBookmarks(),
  loading: false,

  fetchBookmarks: async (bookId: string) => {
    set({ loading: true });

    if (isSupabaseDemoMode) {
      set({ loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (error) {
        console.warn('Fetch bookmarks error:', error.message);
        set({ loading: false });
        return;
      }

      // Merge fetched bookmarks with others in state
      const currentOthers = get().bookmarks.filter((b) => b.book_id !== bookId);
      const merged = [...currentOthers, ...(data ?? [])];
      set({ bookmarks: merged, loading: false });
      saveLocalBookmarks(merged);
    } catch {
      set({ loading: false });
    }
  },

  getBookmarks: (bookId: string) => {
    return get()
      .bookmarks.filter((b) => b.book_id === bookId)
      .sort((a, b) => a.page_number - b.page_number);
  },

  isPageBookmarked: (bookId: string, pageNumber: number) => {
    return get().bookmarks.some(
      (b) => b.book_id === bookId && b.page_number === pageNumber
    );
  },

  addBookmark: async (bookId, pageNumber, label = '', color = 'accent') => {
    const now = new Date().toISOString();
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'bm-' + Date.now();

    const displayLabel = label.trim() ? label.trim() : `Page ${pageNumber}`;

    if (isSupabaseDemoMode) {
      const newBm: Bookmark = {
        id: newId,
        user_id: 'demo-artist-01',
        book_id: bookId,
        page_number: pageNumber,
        label: displayLabel,
        color: color as BookmarkColor,
        created_at: now,
      };
      const all = [...get().bookmarks, newBm];
      set({ bookmarks: all });
      saveLocalBookmarks(all);
      return newBm;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          book_id: bookId,
          page_number: pageNumber,
          label: displayLabel,
          color,
        })
        .select()
        .single();

      if (error) {
        console.warn('Insert bookmark error:', error.message);
        return null;
      }

      const all = [...get().bookmarks, data];
      set({ bookmarks: all });
      saveLocalBookmarks(all);
      return data;
    } catch (err) {
      console.warn('Bookmark add error:', err);
      return null;
    }
  },

  removeBookmark: async (id: string) => {
    const next = get().bookmarks.filter((b) => b.id !== id);
    set({ bookmarks: next });
    saveLocalBookmarks(next);

    if (isSupabaseDemoMode) return;

    try {
      await supabase.from('bookmarks').delete().eq('id', id);
    } catch (err) {
      console.warn('Bookmark delete error:', err);
    }
  },

  updateBookmark: async (id: string, updates: Partial<Bookmark>) => {
    const next = get().bookmarks.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    set({ bookmarks: next });
    saveLocalBookmarks(next);

    if (isSupabaseDemoMode) return;

    try {
      await supabase.from('bookmarks').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Bookmark update error:', err);
    }
  },
}));
