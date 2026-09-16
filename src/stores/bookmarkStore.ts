import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { Bookmark, BookmarkColor } from '../types/book';
import { useAuthStore } from './authStore';

const LOCAL_STORAGE_KEY = 'kin_bookmarks_cache';

interface BookmarkState {
  bookmarks: Bookmark[];
  loading: boolean;
  fetchBookmarks: (bookId: string) => Promise<void>;
  getBookmarks: (bookId: string) => Bookmark[];
  /** EPUB: pass the current CFI to match a specific in-chapter position rather than the whole
   *  chapter — omitting it (PDF) matches by page number alone, as before. */
  isPageBookmarked: (bookId: string, pageNumber: number, epubCfi?: string | null) => boolean;
  addBookmark: (
    bookId: string,
    pageNumber: number,
    label?: string,
    color?: BookmarkColor | string,
    epubCfi?: string | null
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

function isDemoArtist(): boolean {
  if (isSupabaseDemoMode) return true;
  const user = useAuthStore.getState().user;
  if (!user || user.id.startsWith('demo-')) return true;
  return false;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: loadLocalBookmarks(),
  loading: false,

  fetchBookmarks: async (bookId: string) => {
    set({ loading: true });

    if (isDemoArtist()) {
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

  isPageBookmarked: (bookId: string, pageNumber: number, epubCfi?: string | null) => {
    return get().bookmarks.some(
      (b) =>
        b.book_id === bookId &&
        b.page_number === pageNumber &&
        (epubCfi ? b.epub_cfi === epubCfi : !b.epub_cfi)
    );
  },

  addBookmark: async (bookId, pageNumber, label = '', color = 'accent', epubCfi = null) => {
    const now = new Date().toISOString();
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'bm-' + Date.now();

    const displayLabel = label.trim() ? label.trim() : `Page ${pageNumber}`;

    if (isDemoArtist()) {
      const newBm: Bookmark = {
        id: newId,
        user_id: useAuthStore.getState().user?.id || 'demo-artist-01',
        book_id: bookId,
        page_number: pageNumber,
        label: displayLabel,
        color: color as BookmarkColor,
        created_at: now,
        epub_cfi: epubCfi,
      };
      const all = [...get().bookmarks, newBm];
      set({ bookmarks: all });
      saveLocalBookmarks(all);
      return newBm;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const newBm: Bookmark = {
          id: newId,
          user_id: 'demo-artist-01',
          book_id: bookId,
          page_number: pageNumber,
          label: displayLabel,
          color: color as BookmarkColor,
          created_at: now,
          epub_cfi: epubCfi,
        };
        const all = [...get().bookmarks, newBm];
        set({ bookmarks: all });
        saveLocalBookmarks(all);
        return newBm;
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          book_id: bookId,
          page_number: pageNumber,
          label: displayLabel,
          color,
          epub_cfi: epubCfi,
        })
        .select()
        .single();

      if (error) {
        console.warn('Insert bookmark error, saving locally:', error.message);
        const newBm: Bookmark = {
          id: newId,
          user_id: user.id,
          book_id: bookId,
          page_number: pageNumber,
          label: displayLabel,
          color: color as BookmarkColor,
          created_at: now,
          epub_cfi: epubCfi,
        };
        const all = [...get().bookmarks, newBm];
        set({ bookmarks: all });
        saveLocalBookmarks(all);
        return newBm;
      }

      const all = [...get().bookmarks, data];
      set({ bookmarks: all });
      saveLocalBookmarks(all);
      return data;
    } catch (err) {
      console.warn('Add bookmark error, saving locally:', err);
      const newBm: Bookmark = {
        id: newId,
        user_id: 'demo-artist-01',
        book_id: bookId,
        page_number: pageNumber,
        label: displayLabel,
        color: color as BookmarkColor,
        created_at: now,
        epub_cfi: epubCfi,
      };
      const all = [...get().bookmarks, newBm];
      set({ bookmarks: all });
      saveLocalBookmarks(all);
      return newBm;
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
