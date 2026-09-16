import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { Book } from '../types/book';

// Demo studio account only — pre-populated so the demo has something to show.
const DEMO_STORAGE_KEY = 'kin_books_demo_cache';
// Real accounts' offline cache of their own synced books — never seeded with demo content.
const REAL_CACHE_KEY = 'kin_books_cache';

const DEMO_SEED_BOOKS: Book[] = [
  {
    id: 'book-seed-01',
    user_id: 'demo-artist-01',
    title: 'Anatomy & Dynamic Gesture Study',
    author: 'Studio Masterclass',
    description: 'Reference handbook on anatomical striation, kinetic gesture lines, and vertebrate silhouette proportions.',
    file_path: '/artist-reference/art-08.jpeg', // Fallback visual for demo preview
    file_size_bytes: 4820000,
    format: 'pdf',
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
    format: 'pdf',
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

function loadDemoBooks(): Book[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEMO_SEED_BOOKS));
      return DEMO_SEED_BOOKS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_SEED_BOOKS;
  }
}

function saveDemoBooks(books: Book[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(books));
  } catch (err) {
    console.warn('Could not save demo books to localStorage:', err);
  }
}

// Real accounts: read/write their own offline cache only — never seeded with demo content.
function loadCachedBooks(): Book[] {
  try {
    const raw = localStorage.getItem(REAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedBooks(books: Book[]) {
  try {
    localStorage.setItem(REAL_CACHE_KEY, JSON.stringify(books));
  } catch (err) {
    console.warn('Could not save books to localStorage:', err);
  }
}

import { useAuthStore } from './authStore';

function isDemoArtist(): boolean {
  if (isSupabaseDemoMode) return true;
  const user = useAuthStore.getState().user;
  if (!user || user.id.startsWith('demo-')) return true;
  return false;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  loading: false,
  error: null,

  fetchBooks: async () => {
    set({ loading: true, error: null });

    if (isDemoArtist()) {
      const items = loadDemoBooks().filter((b) => !b.deleted_at);
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
        const items = loadCachedBooks().filter((b) => !b.deleted_at);
        set({ books: items, loading: false });
        return;
      }

      set({ books: data ?? [], loading: false });
      saveCachedBooks(data ?? []);
    } catch (err) {
      const items = loadCachedBooks().filter((b) => !b.deleted_at);
      set({ books: items, loading: false });
    }
  },

  addBook: async (bookData) => {
    const now = new Date().toISOString();
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'book-' + Date.now();

    // Ensure only valid schema columns are included
    const sanitizedBook = {
      title: bookData.title,
      author: bookData.author || '',
      description: bookData.description || '',
      file_path: bookData.file_path,
      file_size_bytes: bookData.file_size_bytes,
      format: bookData.format || 'pdf',
      page_count: bookData.page_count ?? null,
      cover_thumbnail_path: bookData.cover_thumbnail_path ?? null,
      tags: bookData.tags || [],
    };

    if (isDemoArtist()) {
      const newBook: Book = {
        ...sanitizedBook,
        id: newId,
        user_id: useAuthStore.getState().user?.id || 'demo-artist-01',
        upload_date: now,
        updated_at: now,
        deleted_at: null,
      };
      const all = [newBook, ...loadDemoBooks()];
      saveDemoBooks(all);
      set({ books: [newBook, ...get().books] });
      return newBook;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to local books
        const newBook: Book = {
          ...sanitizedBook,
          id: newId,
          user_id: 'demo-artist-01',
          upload_date: now,
          updated_at: now,
          deleted_at: null,
        };
        const all = [newBook, ...loadCachedBooks()];
        saveCachedBooks(all);
        set({ books: [newBook, ...get().books] });
        return newBook;
      }

      const { data, error } = await supabase
        .from('books')
        .insert({
          ...sanitizedBook,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase book insert error, saving to local cache:', error.message);
        const newBook: Book = {
          ...sanitizedBook,
          id: newId,
          user_id: user.id,
          upload_date: now,
          updated_at: now,
          deleted_at: null,
        };
        const all = [newBook, ...loadCachedBooks()];
        saveCachedBooks(all);
        set({ books: [newBook, ...get().books] });
        return newBook;
      }

      set({ books: [data, ...get().books] });
      return data;
    } catch (err) {
      console.warn('Book upload exception, saving locally:', err);
      const newBook: Book = {
        ...sanitizedBook,
        id: newId,
        user_id: 'demo-artist-01',
        upload_date: now,
        updated_at: now,
        deleted_at: null,
      };
      const all = [newBook, ...loadCachedBooks()];
      saveCachedBooks(all);
      set({ books: [newBook, ...get().books] });
      return newBook;
    }
  },

  updateBook: async (id, updates) => {
    const now = new Date().toISOString();

    if (isDemoArtist()) {
      const all = loadDemoBooks().map((b) =>
        b.id === id ? { ...b, ...updates, updated_at: now } : b
      );
      saveDemoBooks(all);
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
        console.warn('Supabase update book failed, saving locally:', error.message);
        const all = loadCachedBooks().map((b) =>
          b.id === id ? { ...b, ...updates, updated_at: now } : b
        );
        saveCachedBooks(all);
      }

      set({
        books: get().books.map((b) =>
          b.id === id ? { ...b, ...updates, updated_at: now } : b
        ),
      });
    } catch (err) {
      console.warn('Update book error:', err);
      const all = loadCachedBooks().map((b) =>
        b.id === id ? { ...b, ...updates, updated_at: now } : b
      );
      saveCachedBooks(all);
      set({
        books: get().books.map((b) =>
          b.id === id ? { ...b, ...updates, updated_at: now } : b
        ),
      });
    }
  },

  softDeleteBook: async (id) => {
    const now = new Date().toISOString();

    if (isDemoArtist()) {
      const all = loadDemoBooks().map((b) =>
        b.id === id ? { ...b, deleted_at: now } : b
      );
      saveDemoBooks(all);
      set({ books: get().books.filter((b) => b.id !== id) });
      return;
    }

    try {
      const { error } = await supabase
        .from('books')
        .update({ deleted_at: now })
        .eq('id', id);

      if (error) {
        console.warn('Delete book failed on Supabase, updating locally:', error.message);
      }

      const all = loadCachedBooks().map((b) =>
        b.id === id ? { ...b, deleted_at: now } : b
      );
      saveCachedBooks(all);
      set({ books: get().books.filter((b) => b.id !== id) });
    } catch (err) {
      console.warn('Delete book error:', err);
      const all = loadCachedBooks().map((b) =>
        b.id === id ? { ...b, deleted_at: now } : b
      );
      saveCachedBooks(all);
      set({ books: get().books.filter((b) => b.id !== id) });
    }
  },

  restoreBook: async (id) => {
    if (isDemoArtist()) {
      const all = loadDemoBooks().map((b) =>
        b.id === id ? { ...b, deleted_at: null } : b
      );
      saveDemoBooks(all);
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
      const all = loadCachedBooks().map((b) =>
        b.id === id ? { ...b, deleted_at: null } : b
      );
      saveCachedBooks(all);
      set({ books: all.filter((b) => !b.deleted_at) });
    }
  },

  getBookById: (id: string) => {
    return get().books.find((b) => b.id === id);
  },
}));
