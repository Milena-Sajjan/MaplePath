import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
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

    if (isDemoMode) {
      // In demo mode, show a few steps as completed
      const demoProgress: RoadmapProgress[] = [
        {
          id: 'dp-1', user_id: 'demo-user-001', step_id: 'sin',
          phase: 1, completed: true, completed_at: '2025-09-20T10:00:00Z', notes: null,
        },
        {
          id: 'dp-2', user_id: 'demo-user-001', step_id: 'bank',
          phase: 1, completed: true, completed_at: '2025-09-21T14:00:00Z', notes: null,
        },
        {
          id: 'dp-3', user_id: 'demo-user-001', step_id: 'sim',
          phase: 1, completed: true, completed_at: '2025-09-18T09:00:00Z', notes: null,
        },
      ] as unknown as RoadmapProgress[]
      setProgress(demoProgress)
      setLoading(false)
      return
    }

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

      if (isDemoMode) {
        // In demo mode, just toggle locally
        if (existing) {
          const completed = !existing.completed
          setProgress((prev) =>
            prev.map((p) =>
              p.id === existing.id
                ? { ...p, completed, completed_at: completed ? new Date().toISOString() : null }
                : p
            )
          )
        } else {
          const newEntry = {
            id: `dp-${Date.now()}`,
            user_id: user.id,
            step_id: stepId,
            phase,
            completed: true,
            completed_at: new Date().toISOString(),
            notes: null,
          } as unknown as RoadmapProgress
          setProgress((prev) => [...prev, newEntry])
        }
        return
      }

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
