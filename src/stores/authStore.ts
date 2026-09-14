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
      if (!isSupabaseDemoMode) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          localStorage.removeItem('kin_demo_user');
          set({ session, user: session.user, loading: false });

          supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession?.user) {
              localStorage.removeItem('kin_demo_user');
              set({ session: newSession, user: newSession.user });
            } else if (!localStorage.getItem('kin_demo_user')) {
              set({ session: null, user: null });
            }
          });
          return;
        }
      }

      // Check if there is a cached demo studio user
      const storedDemoUser = localStorage.getItem('kin_demo_user');
      if (storedDemoUser) {
        const parsed = JSON.parse(storedDemoUser);
        set({ user: parsed, session: { user: parsed } as unknown as Session, loading: false });
        return;
      }

      set({ session: null, user: null, loading: false });
    } catch (err) {
      console.warn('Supabase auth initialization fallback:', err);
      set({ session: null, user: null, loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    if (isSupabaseDemoMode || email.endsWith('@kin-studio.local')) {
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
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        set({ loading: false, error: error.message });
        return { error: error.message };
      }
      if (data?.user) {
        set({ user: data.user, session: data.session, loading: false });
      } else {
        set({ loading: false });
      }
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      set({ loading: false, error: msg });
      return { error: msg };
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    // Support instant demo login for the demo studio account regardless of supabase mode
    if (email === 'artist@kin-studio.local' || email.endsWith('@kin-studio.local') || isSupabaseDemoMode) {
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        set({ loading: false, error: error.message });
        return { error: error.message };
      }
      localStorage.removeItem('kin_demo_user');
      set({ user: data.user, session: data.session, loading: false });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      set({ loading: false, error: msg });
      return { error: msg };
    }
  },

  signOut: async () => {
    localStorage.removeItem('kin_demo_user');
    if (!isSupabaseDemoMode) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    set({ user: null, session: null });
  },

  clearError: () => set({ error: null }),
}));
