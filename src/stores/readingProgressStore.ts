import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { ReadingProgress } from '../types/book';

const LOCAL_STORAGE_KEY = 'kin_reading_progress_cache';

interface ReadingProgressState {
  progressByBookId: Record<string, ReadingProgress>;
  loading: boolean;
  getProgress: (bookId: string) => ReadingProgress | undefined;
  fetchProgress: (bookId: string) => Promise<ReadingProgress | null>;
  saveProgress: (
    bookId: string,
    currentPage: number,
    totalPages?: number | null,
    scrollPosition?: number,
    zoomLevel?: number,
    readingMode?: 'continuous' | 'paginated'
  ) => Promise<void>;
}

function loadLocalProgress(): Record<string, ReadingProgress> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProgress(map: Record<string, ReadingProgress>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Could not save reading progress to localStorage:', err);
  }
}

export const useReadingProgressStore = create<ReadingProgressState>((set, get) => ({
  progressByBookId: loadLocalProgress(),
  loading: false,

  getProgress: (bookId: string) => {
    return get().progressByBookId[bookId];
  },

  fetchProgress: async (bookId: string) => {
    if (isSupabaseDemoMode) {
      const local = get().progressByBookId[bookId] ?? null;
      return local;
    }

    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('book_id', bookId)
        .maybeSingle();

      if (error) {
        console.warn('Failed to fetch reading progress from Supabase:', error.message);
        return get().progressByBookId[bookId] ?? null;
      }

      if (data) {
        set((state) => ({
          progressByBookId: {
            ...state.progressByBookId,
            [bookId]: data,
          },
        }));
        saveLocalProgress(get().progressByBookId);
        return data;
      }

      return null;
    } catch {
      return get().progressByBookId[bookId] ?? null;
    }
  },

  saveProgress: async (bookId, currentPage, totalPages, scrollPosition = 0, zoomLevel = 1.0, readingMode = 'continuous') => {
    const now = new Date().toISOString();
    const existing = get().progressByBookId[bookId];
    const progressRecord: ReadingProgress = {
      id: existing?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'prog-' + Date.now()),
      user_id: existing?.user_id || 'demo-artist-01',
      book_id: bookId,
      current_page: currentPage,
      total_pages: totalPages ?? existing?.total_pages ?? null,
      scroll_position: scrollPosition,
      zoom_level: zoomLevel,
      reading_mode: readingMode,
      started_at: existing?.started_at || now,
      last_read_at: now,
    };

    const nextMap = {
      ...get().progressByBookId,
      [bookId]: progressRecord,
    };
    set({ progressByBookId: nextMap });
    saveLocalProgress(nextMap);

    if (isSupabaseDemoMode) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('reading_progress')
        .upsert(
          {
            user_id: user.id,
            book_id: bookId,
            current_page: currentPage,
            total_pages: totalPages ?? undefined,
            scroll_position: scrollPosition,
            zoom_level: zoomLevel,
            reading_mode: readingMode,
            last_read_at: now,
          },
          { onConflict: 'user_id,book_id' }
        );
    } catch (err) {
      console.warn('Failed to upsert reading progress in Supabase:', err);
    }
  },
}));
