import { create } from 'zustand';
import { supabase, isSupabaseDemoMode } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      if (isSupabaseDemoMode) {
        // In demo mode, check if there is a cached demo user
        const storedDemoUser = localStorage.getItem('kin_demo_user');
        if (storedDemoUser) {
          const parsed = JSON.parse(storedDemoUser);
          set({ user: parsed, session: { user: parsed } as unknown as Session, loading: false });
          return;
        }
        set({ session: null, user: null, loading: false });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, loading: false });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (err) {
      console.warn('Supabase auth initialization fallback:', err);
      set({ session: null, user: null, loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    if (isSupabaseDemoMode) {
      const demoUser = {
        id: 'demo-artist-' + Date.now(),
        email,
        app_metadata: {},
        user_metadata: { name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      localStorage.setItem('kin_demo_user', JSON.stringify(demoUser));
      set({ user: demoUser, session: { user: demoUser } as unknown as Session, loading: false });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      set({ loading: false, error: error?.message ?? null });
      return { error: error?.message ?? null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      set({ loading: false, error: msg });
      return { error: msg };
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    if (isSupabaseDemoMode) {
      const demoUser = {
        id: 'demo-artist-01',
        email,
        app_metadata: {},
        user_metadata: { name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      localStorage.setItem('kin_demo_user', JSON.stringify(demoUser));
      set({ user: demoUser, session: { user: demoUser } as unknown as Session, loading: false });
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      set({ loading: false, error: error?.message ?? null });
      return { error: error?.message ?? null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      set({ loading: false, error: msg });
      return { error: msg };
    }
  },

  signOut: async () => {
    if (isSupabaseDemoMode) {
      localStorage.removeItem('kin_demo_user');
      set({ user: null, session: null });
      return;
    }
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  clearError: () => set({ error: null }),
}));
