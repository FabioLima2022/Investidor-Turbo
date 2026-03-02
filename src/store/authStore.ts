import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  backendAvailable: boolean;
  backendError: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  checkBackend: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  backendAvailable: true,
  backendError: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
  checkBackend: async () => {
    try {
      const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
      const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
      if (!url || !key) {
        set({ backendAvailable: false, backendError: 'Variáveis do Supabase ausentes' });
        return;
      }
      const res = await fetch(`${url}/auth/v1/health`, {
        method: 'GET',
        headers: { apikey: key },
      });
      if (res.ok || res.status === 200 || res.status === 404) {
        set({ backendAvailable: true, backendError: null });
      } else {
        set({ backendAvailable: false, backendError: `Status ${res.status}` });
      }
    } catch (e: any) {
      set({ backendAvailable: false, backendError: e?.message || 'Failed to fetch' });
    }
  },
  initialize: async () => {
    try {
      set({ isLoading: true });
      await useAuthStore.getState().checkBackend();
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
