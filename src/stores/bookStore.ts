import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { Book } from '../types/book';

const LOCAL_STORAGE_KEY = 'kin_books_cache';

const DEMO_SEED_BOOKS: Book[] = [
  {
    id: 'book-seed-01',
    user_id: 'demo-artist-01',
    title: 'Anatomy & Dynamic Gesture Study',
    author: 'Studio Masterclass',
    description: 'Reference handbook on anatomical striation, kinetic gesture lines, and vertebrate silhouette proportions.',
    file_path: '/artist-reference/art-08.jpeg', // Fallback visual for demo preview
    file_size_bytes: 4820000,
    page_count: 24,
    cover_thumbnail_path: '/artist-reference/art-08.jpeg',
    tags: ['anatomy', 'gestures', 'reference'],
    upload_date: '2026-08-22T10:00:00Z',
    updated_at: '2026-08-22T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'book-seed-02',
    user_id: 'demo-artist-01',
    title: 'Clockwork Beetles & Mechanical Flora',
    author: 'Field Notes',
    description: 'Working sketchbook examining mechanical linkages, insect wings, and organic botanical convergence.',
    file_path: '/artist-reference/art-17.jpeg',
    file_size_bytes: 8190000,
    page_count: 48,
    cover_thumbnail_path: '/artist-reference/art-17.jpeg',
    tags: ['clockwork', 'biomechanical', 'sketchbook'],
    upload_date: '2026-08-28T14:15:00Z',
    updated_at: '2026-08-28T14:15:00Z',
    deleted_at: null,
  },
];

interface BookState {
  books: Book[];
  loading: boolean;
  error: string | null;
  fetchBooks: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'user_id' | 'upload_date' | 'updated_at' | 'deleted_at'>) => Promise<Book | null>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  softDeleteBook: (id: string) => Promise<void>;
  restoreBook: (id: string) => Promise<void>;
  getBookById: (id: string) => Book | undefined;
}

function loadLocalBooks(): Book[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEMO_SEED_BOOKS));
      return DEMO_SEED_BOOKS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_SEED_BOOKS;
  }
}

function saveLocalBooks(books: Book[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(books));
  } catch (err) {
    console.warn('Could not save books to localStorage:', err);
  }
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  loading: false,
  error: null,

  fetchBooks: async () => {
    set({ loading: true, error: null });

    if (isSupabaseDemoMode) {
      const items = loadLocalBooks().filter((b) => !b.deleted_at);
      set({ books: items, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .is('deleted_at', null)
        .order('upload_date', { ascending: false });

      if (error) {
        console.warn('Supabase fetch books failed, using local cache:', error.message);
        const items = loadLocalBooks().filter((b) => !b.deleted_at);
        set({ books: items, loading: false });
        return;
      }

      set({ books: data ?? [], loading: false });
      saveLocalBooks(data ?? []);
    } catch (err) {
      const items = loadLocalBooks().filter((b) => !b.deleted_at);
      set({ books: items, loading: false });
    }
  },

  addBook: async (bookData) => {
    const now = new Date().toISOString();
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'book-' + Date.now();

    if (isSupabaseDemoMode) {
      const newBook: Book = {
        ...bookData,
        id: newId,
        user_id: 'demo-artist-01',
        upload_date: now,
        updated_at: now,
        deleted_at: null,
      };
      const all = [newBook, ...loadLocalBooks()];
      saveLocalBooks(all);
      set({ books: [newBook, ...get().books] });
      return newBook;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ error: 'Not authenticated' });
        return null;
      }

      const { data, error } = await supabase
        .from('books')
        .insert({
          ...bookData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        set({ error: error.message });
        return null;
      }

      set({ books: [data, ...get().books] });
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      set({ error: msg });
      return null;
    }
  },

  updateBook: async (id, updates) => {
    const now = new Date().toISOString();

    if (isSupabaseDemoMode) {
      const all = loadLocalBooks().map((b) =>
        b.id === id ? { ...b, ...updates, updated_at: now } : b
      );
      saveLocalBooks(all);
      set({
        books: get().books.map((b) =>
          b.id === id ? { ...b, ...updates, updated_at: now } : b
        ),
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('books')
        .update({ ...updates, updated_at: now })
        .eq('id', id);

      if (error) {
        set({ error: error.message });
        return;
      }

      set({
        books: get().books.map((b) =>
          b.id === id ? { ...b, ...updates, updated_at: now } : b
        ),
      });
    } catch (err) {
      console.warn('Update book error:', err);
    }
  },

  softDeleteBook: async (id) => {
    const now = new Date().toISOString();

    if (isSupabaseDemoMode) {
      const all = loadLocalBooks().map((b) =>
        b.id === id ? { ...b, deleted_at: now } : b
      );
      saveLocalBooks(all);
      set({ books: get().books.filter((b) => b.id !== id) });
      return;
    }

    try {
      const { error } = await supabase
        .from('books')
        .update({ deleted_at: now })
        .eq('id', id);

      if (error) {
        set({ error: error.message });
        return;
      }

      set({ books: get().books.filter((b) => b.id !== id) });
    } catch (err) {
      console.warn('Delete book error:', err);
    }
  },

  restoreBook: async (id) => {
    if (isSupabaseDemoMode) {
      const all = loadLocalBooks().map((b) =>
        b.id === id ? { ...b, deleted_at: null } : b
      );
      saveLocalBooks(all);
      set({ books: all.filter((b) => !b.deleted_at) });
      return;
    }

    try {
      await supabase
        .from('books')
        .update({ deleted_at: null })
        .eq('id', id);
      await get().fetchBooks();
    } catch (err) {
      console.warn('Restore book error:', err);
    }
  },

  getBookById: (id: string) => {
    return get().books.find((b) => b.id === id);
  },
}));
