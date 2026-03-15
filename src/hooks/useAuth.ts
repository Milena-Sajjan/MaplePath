import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const { user, loading, initialize, signOut } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    })
    if (error) throw error
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }
}
