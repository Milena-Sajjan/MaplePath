import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Printer,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRoadmap } from '../hooks/useRoadmap'
import { phaseNames } from '../data/roadmapSteps'

const phaseIcons: Record<number, string> = {
  1: '\u{1F3E0}',
  2: '\u{1FA7A}',
  3: '\u{1F4B0}',
  4: '\u{1F30D}',
}

function ConfettiCelebration() {
  const particles = useMemo(() => {
    const colors = ['#C8102E', '#D4A017', '#22c55e', '#3b82f6', '#a855f7', '#f97316']
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: 0, x: `${p.x}%`, rotate: 0, scale: 1 }}
          animate={{
            opacity: [1, 1, 0],
            y: [0, -80, -160],
            rotate: [0, p.rotation, p.rotation * 2],
            scale: [1, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: 3,
          }}
          className="absolute bottom-0 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: `${p.x}%`,
          }}
        />
      ))}
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 animate-pulse">
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="h-4 w-full rounded-full bg-gray-200" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="h-5 w-48 rounded bg-gray-200" />
              <div className="ml-auto h-5 w-20 rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const { t } = useTranslation()
  const {
    steps,
    loading,
    toggleStep,
    isStepCompleted,
    getPhaseProgress,
    percentComplete,
    completedCount,
    totalCount,
  } = useRoadmap()

  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
  })

  const phases = [1, 2, 3, 4]

  const togglePhase = (phase: number) => {
    setExpandedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }))
  }

  if (loading) {
    return <SkeletonLoader />
  }

  if (steps.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-4 text-6xl">{'\u{1F4CB}'}</div>
        <h2 className="mb-2 text-xl font-semibold text-gray-800">
          {t('roadmap.emptyTitle', 'No steps found')}
        </h2>
        <p className="text-gray-500">
          {t(
            'roadmap.emptyDesc',
            'There are no roadmap steps matching your immigration status. Please update your profile to see your personalized roadmap.'
          )}
        </p>
        <Link
          to="/profile"
          className="mt-6 rounded-lg bg-[#C8102E] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#a00d25]"
        >
          {t('roadmap.updateProfile', 'Update Profile')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:px-0 print:py-4">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('roadmap.title', 'Settlement Roadmap')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('roadmap.subtitle', 'Your step-by-step guide to settling in Canada')}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 print:hidden"
          aria-label={t('roadmap.export', 'Export my roadmap')}
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t('roadmap.export', 'Export my roadmap')}
          </span>
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {t('roadmap.overallProgress', 'Overall progress')}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {t('roadmap.percentComplete', '{{percent}}% complete', {
              percent: percentComplete,
            })}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #C8102E 0%, #D4A017 100%)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentComplete}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {t('roadmap.stepsCompleted', '{{completed}} of {{total}} steps completed', {
            completed: completedCount,
            total: totalCount,
          })}
        </p>
      </div>

      {/* Phase cards */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const { total, completed } = getPhaseProgress(phase)
          const isExpanded = expandedPhases[phase]
          const phaseSteps = steps.filter((s) => s.phase === phase)
          const isPhaseComplete = total > 0 && completed === total

          if (phaseSteps.length === 0) return null

          return (
            <div
              key={phase}
              className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md print:shadow-none"
            >
              {isPhaseComplete && <ConfettiCelebration />}

              {/* Phase header */}
              <button
                onClick={() => togglePhase(phase)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
                aria-expanded={isExpanded}
                aria-controls={`phase-${phase}-content`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">
                  {phaseIcons[phase]}
                </span>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-gray-900">
                    {t(`roadmap.phase${phase}`, phaseNames[phase])}
                  </h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isPhaseComplete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t('roadmap.phaseProgress', '{{completed}}/{{total}} completed', {
                    completed,
                    total,
                  })}
                </span>
                <span className="ml-1 text-gray-400 print:hidden">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </span>
              </button>

              {/* Phase content */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    id={`phase-${phase}-content`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 px-5 py-3">
                      <ul className="divide-y divide-gray-100">
                        {phaseSteps.map((step) => {
                          const completed = isStepCompleted(step.id)
                          return (
                            <li
                              key={step.id}
                              className="flex items-start gap-3 py-3"
                            >
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleStep(step.id, step.phase)}
                                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                                  completed
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                }`}
                                aria-label={
                                  completed
                                    ? t('roadmap.markIncomplete', 'Mark as incomplete')
                                    : t('roadmap.markComplete', 'Mark as complete')
                                }
                              >
                                {completed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                              </button>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-sm font-bold ${
                                    completed
                                      ? 'text-gray-400 line-through'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {t(`roadmap.step.${step.id}.title`, step.title)}
                                </p>
                                <p
                                  className={`mt-0.5 text-xs ${
                                    completed ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {t(`roadmap.step.${step.id}.desc`, step.desc)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-shrink-0 items-center gap-2">
                                {/* Estimated time badge */}
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                                  <Clock className="h-3 w-3" />
                                  {t('roadmap.estimatedDays', '~{{count}} day(s)', {
                                    count: step.estimatedDays,
                                  })}
                                </span>

                                {/* External link */}
                                {step.link && (
                                  <a
                                    href={step.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 print:hidden"
                                    aria-label={t(
                                      'roadmap.openLink',
                                      'Open external link for {{title}}',
                                      { title: step.title }
                                    )}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
