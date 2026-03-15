import { create } from 'zustand'
import { supabase, isDemoMode } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@maplepath.ca',
  app_metadata: {},
  user_metadata: { full_name: 'Priya Sharma' },
  aud: 'authenticated',
  created_at: '2025-09-15T12:00:00Z',
} as User

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  signOut: async () => {
    if (!isDemoMode) {
      await supabase.auth.signOut()
    }
    set({ user: null })
  },
  initialize: async () => {
    if (isDemoMode) {
      // In demo mode, auto-login with a fake user
      set({ user: DEMO_USER, loading: false })
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, loading: false })
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null })
      })
    } catch (err) {
      console.error('Auth initialization error:', err)
      set({ user: null, loading: false })
    }
  },
}))
