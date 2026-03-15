import { useCallback } from 'react'
import { useProfileStore } from '../store/profileStore'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile() {
  const { profile, loading, fetchProfile, updateProfile } = useProfileStore()
  const { user } = useAuthStore()

  const update = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return
      await updateProfile(user.id, updates)
    },
    [user, updateProfile]
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) return null
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      await updateProfile(user.id, { avatar_url: data.publicUrl })
      return data.publicUrl
    },
    [user, updateProfile]
  )

  return {
    profile,
    loading,
    update,
    uploadAvatar,
    refetch: () => user && fetchProfile(user.id),
  }
}
