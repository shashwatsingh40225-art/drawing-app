import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { ReadingProgress } from '../types/book';

const LOCAL_STORAGE_KEY = 'kin_reading_progress_cache';
/** Page turns are saved locally at once; the server write waits for the reader to settle. */
const REMOTE_SAVE_DELAY_MS = 1500;

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
  /** Send any pending server writes now (app backgrounded, reader closed). */
  flushProgress: () => void;
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

const pendingRemoteWrites = new Map<string, { timer: ReturnType<typeof setTimeout>; run: () => void }>();

async function upsertRemoteProgress(record: ReadingProgress) {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;

    const { error } = await supabase.from('reading_progress').upsert(
      {
        user_id: user.id,
        book_id: record.book_id,
        current_page: record.current_page,
        total_pages: record.total_pages ?? undefined,
        scroll_position: record.scroll_position,
        zoom_level: record.zoom_level,
        reading_mode: record.reading_mode,
        last_read_at: record.last_read_at,
      },
      { onConflict: 'user_id,book_id' }
    );
    if (error) console.warn('Failed to upsert reading progress in Supabase:', error.message);
  } catch (err) {
    console.warn('Failed to upsert reading progress in Supabase:', err);
  }
}

export const useReadingProgressStore = create<ReadingProgressState>((set, get) => ({
  progressByBookId: loadLocalProgress(),
  loading: false,

  getProgress: (bookId: string) => {
    return get().progressByBookId[bookId];
  },

  fetchProgress: async (bookId: string) => {
    const local = get().progressByBookId[bookId] ?? null;
    if (isSupabaseDemoMode) {
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
        return local;
      }

      if (data) {
        // Reading done offline (or not yet flushed) is newer than the server copy: keep it.
        if (local && Date.parse(local.last_read_at) > Date.parse(data.last_read_at)) {
          void upsertRemoteProgress(local);
          return local;
        }
        set((state) => ({
          progressByBookId: {
            ...state.progressByBookId,
            [bookId]: data,
          },
        }));
        saveLocalProgress(get().progressByBookId);
        return data;
      }

      return local;
    } catch {
      return local;
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

    const pending = pendingRemoteWrites.get(bookId);
    if (pending) clearTimeout(pending.timer);
    const run = () => {
      pendingRemoteWrites.delete(bookId);
      const latest = get().progressByBookId[bookId];
      if (latest) void upsertRemoteProgress(latest);
    };
    pendingRemoteWrites.set(bookId, { timer: setTimeout(run, REMOTE_SAVE_DELAY_MS), run });
  },

  flushProgress: () => {
    for (const { timer, run } of Array.from(pendingRemoteWrites.values())) {
      clearTimeout(timer);
      run();
    }
  },
}));
