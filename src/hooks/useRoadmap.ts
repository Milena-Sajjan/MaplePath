import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import { roadmapSteps } from '../data/roadmapSteps'
import type { Database } from '../lib/database.types'

type RoadmapProgress = Database['public']['Tables']['roadmap_progress']['Row']

export function useRoadmap() {
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const [progress, setProgress] = useState<RoadmapProgress[]>([])
  const [loading, setLoading] = useState(true)

  const filteredSteps = roadmapSteps.filter(
    (step) =>
      step.statusTypes.includes('all') ||
      (profile?.status_type && step.statusTypes.includes(profile.status_type))
  )

  const fetchProgress = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching roadmap progress:', error)
      setLoading(false)
      return
    }
    setProgress(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  const toggleStep = useCallback(
    async (stepId: string, phase: number) => {
      if (!user) return
      const existing = progress.find((p) => p.step_id === stepId)

      if (existing) {
        const completed = !existing.completed
        const { error } = await supabase
          .from('roadmap_progress')
          .update({
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq('id', existing.id)

        if (!error) {
          setProgress((prev) =>
            prev.map((p) =>
              p.id === existing.id
                ? { ...p, completed, completed_at: completed ? new Date().toISOString() : null }
                : p
            )
          )
        }
      } else {
        const { data, error } = await supabase
          .from('roadmap_progress')
          .insert({
            user_id: user.id,
            step_id: stepId,
            phase,
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (!error && data) {
          setProgress((prev) => [...prev, data])
        }
      }
    },
    [user, progress]
  )

  const completedCount = progress.filter((p) => p.completed).length
  const totalCount = filteredSteps.length
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const isStepCompleted = (stepId: string) =>
    progress.some((p) => p.step_id === stepId && p.completed)

  const getPhaseProgress = (phase: number) => {
    const phaseSteps = filteredSteps.filter((s) => s.phase === phase)
    const phaseCompleted = phaseSteps.filter((s) => isStepCompleted(s.id)).length
    return { total: phaseSteps.length, completed: phaseCompleted }
  }

  const incompleteSteps = filteredSteps.filter((s) => !isStepCompleted(s.id))

  return {
    steps: filteredSteps,
    progress,
    loading,
    toggleStep,
    isStepCompleted,
    getPhaseProgress,
    completedCount,
    totalCount,
    percentComplete,
    incompleteSteps,
  }
}
