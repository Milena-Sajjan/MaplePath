import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface ProfileState {
  profile: Profile | null
  loading: boolean
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (userId: string, updates: Partial<Profile>) => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: true,
  fetchProfile: async (userId: string) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      set({ loading: false })
      return
    }
    set({ profile: data, loading: false })
  },
  updateProfile: async (userId: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return
    }
    set({ profile: data })
  },
}))
