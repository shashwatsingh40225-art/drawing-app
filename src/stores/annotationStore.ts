import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import { PageAnnotation } from '../types/book';

const LOCAL_STORAGE_KEY = 'kin_annotations_cache';

interface AnnotationState {
  annotations: PageAnnotation[];
  loading: boolean;
  fetchAnnotations: (bookId: string) => Promise<void>;
  getAnnotationsForPage: (bookId: string, pageNumber: number) => PageAnnotation[];
  addAnnotation: (
    annotation: Omit<PageAnnotation, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => Promise<PageAnnotation | null>;
  updateAnnotation: (id: string, updates: Partial<PageAnnotation>) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
}

function loadLocalAnnotations(): PageAnnotation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAnnotations(items: PageAnnotation[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Could not save annotations to localStorage:', err);
  }
}

import { useAuthStore } from './authStore';

function isDemoArtist(): boolean {
  if (isSupabaseDemoMode) return true;
  const user = useAuthStore.getState().user;
  if (!user || user.id.startsWith('demo-')) return true;
  return false;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  annotations: loadLocalAnnotations(),
  loading: false,

  fetchAnnotations: async (bookId: string) => {
    set({ loading: true });

    if (isDemoArtist()) {
      set({ loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Fetch annotations error:', error.message);
        set({ loading: false });
        return;
      }

      // Merge fetched annotations with others in state
      const currentOthers = get().annotations.filter((a) => a.book_id !== bookId);
      const merged = [...currentOthers, ...(data ?? [])];
      set({ annotations: merged, loading: false });
      saveLocalAnnotations(merged);
    } catch {
      set({ loading: false });
    }
  },

  getAnnotationsForPage: (bookId: string, pageNumber: number) => {
    return get().annotations.filter(
      (a) => a.book_id === bookId && a.page_number === pageNumber
    );
  },

  addAnnotation: async (annotationData) => {
    const now = new Date().toISOString();
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'ann-' + Date.now();

    if (isDemoArtist()) {
      const newAnn: PageAnnotation = {
        ...annotationData,
        id: newId,
        user_id: useAuthStore.getState().user?.id || 'demo-artist-01',
        created_at: now,
        updated_at: now,
      };
      const all = [...get().annotations, newAnn];
      set({ annotations: all });
      saveLocalAnnotations(all);
      return newAnn;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const newAnn: PageAnnotation = {
          ...annotationData,
          id: newId,
          user_id: 'demo-artist-01',
          created_at: now,
          updated_at: now,
        };
        const all = [...get().annotations, newAnn];
        set({ annotations: all });
        saveLocalAnnotations(all);
        return newAnn;
      }

      const { data, error } = await supabase
        .from('annotations')
        .insert({
          ...annotationData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.warn('Insert annotation error, saving locally:', error.message);
        const newAnn: PageAnnotation = {
          ...annotationData,
          id: newId,
          user_id: user.id,
          created_at: now,
          updated_at: now,
        };
        const all = [...get().annotations, newAnn];
        set({ annotations: all });
        saveLocalAnnotations(all);
        return newAnn;
      }

      const all = [...get().annotations, data];
      set({ annotations: all });
      saveLocalAnnotations(all);
      return data;
    } catch (err) {
      console.warn('Add annotation error, saving locally:', err);
      const newAnn: PageAnnotation = {
        ...annotationData,
        id: newId,
        user_id: 'demo-artist-01',
        created_at: now,
        updated_at: now,
      };
      const all = [...get().annotations, newAnn];
      set({ annotations: all });
      saveLocalAnnotations(all);
      return newAnn;
    }
  },

  updateAnnotation: async (id: string, updates: Partial<PageAnnotation>) => {
    const now = new Date().toISOString();
    const next = get().annotations.map((a) =>
      a.id === id ? { ...a, ...updates, updated_at: now } : a
    );
    set({ annotations: next });
    saveLocalAnnotations(next);

    if (isDemoArtist()) return;

    try {
      await supabase
        .from('annotations')
        .update({ ...updates, updated_at: now })
        .eq('id', id);
    } catch (err) {
      console.warn('Update annotation error:', err);
    }
  },

  deleteAnnotation: async (id: string) => {
    const next = get().annotations.filter((a) => a.id !== id);
    set({ annotations: next });
    saveLocalAnnotations(next);

    if (isDemoArtist()) return;

    try {
      await supabase.from('annotations').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete annotation error:', err);
    }
  },
}));
