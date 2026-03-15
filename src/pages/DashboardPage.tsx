import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  MapPin,
  Briefcase,
  Home,
  MessageSquare,
  Calendar,
  Send,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Building2,
  DollarSign,
} from 'lucide-react'
import { format, differenceInDays, parseISO, startOfWeek } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { useRoadmap } from '../hooks/useRoadmap'
import { useNotifications } from '../hooks/useNotifications'
import { supabase, isDemoMode } from '../lib/supabase'
import { demoForumPosts, demoJobs, demoHousing } from '../lib/demoData'
import { getGreeting, getDaysSince, formatTimeAgo } from '../lib/utils'
import type { Database } from '../lib/database.types'

type ForumPost = Database['public']['Tables']['forum_posts']['Row'] & {
  profiles: { full_name: string | null; avatar_url: string | null } | null
}
type JobListing = Database['public']['Tables']['job_listings']['Row']
type HousingListing = Database['public']['Tables']['housing_listings']['Row']

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <SkeletonBlock className="mb-3 h-4 w-24" />
      <SkeletonBlock className="mb-2 h-8 w-16" />
      <SkeletonBlock className="h-3 w-32" />
    </div>
  )
}

const categoryColors: Record<string, string> = {
  housing: 'bg-blue-100 text-blue-700',
  jobs: 'bg-green-100 text-green-700',
  immigration: 'bg-purple-100 text-purple-700',
  banking: 'bg-yellow-100 text-yellow-700',
  health: 'bg-red-100 text-red-700',
  community: 'bg-pink-100 text-pink-700',
  education: 'bg-indigo-100 text-indigo-700',
  general: 'bg-gray-100 text-gray-700',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const {
    completedCount,
    totalCount,
    percentComplete,
    incompleteSteps,
    toggleStep,
    loading: roadmapLoading,
  } = useRoadmap()
  useNotifications()

  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [jobCount, setJobCount] = useState(0)
  const [latestJobs, setLatestJobs] = useState<JobListing[]>([])
  const [latestHousing, setLatestHousing] = useState<HousingListing[]>([])
  const [weeklyPostCount, setWeeklyPostCount] = useState(0)
  const [dataLoading, setDataLoading] = useState(true)
  const [wizardMessage, setWizardMessage] = useState('')

  useEffect(() => {
    async function fetchDashboardData() {
      if (isDemoMode) {
        setForumPosts(demoForumPosts as unknown as ForumPost[])
        setJobCount(demoJobs.length)
        setLatestJobs(demoJobs.slice(0, 2) as unknown as JobListing[])
        setLatestHousing(demoHousing as unknown as HousingListing[])
        setWeeklyPostCount(demoForumPosts.length)
        setDataLoading(false)
        return
      }

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

      const [
        forumResult,
        jobCountResult,
        latestJobsResult,
        latestHousingResult,
        weeklyPostsResult,
      ] = await Promise.all([
        supabase
          .from('forum_posts')
          .select('*, profiles:user_id(full_name, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('job_listings')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('job_listings')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('housing_listings')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('forum_posts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', weekStart),
      ])

      setForumPosts((forumResult.data as unknown as ForumPost[]) ?? [])
      setJobCount(jobCountResult.count ?? 0)
      setLatestJobs(latestJobsResult.data ?? [])
      setLatestHousing(latestHousingResult.data ?? [])
      setWeeklyPostCount(weeklyPostsResult.count ?? 0)
      setDataLoading(false)
    }

    fetchDashboardData()
  }, [])

  const handleWizardSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!wizardMessage.trim()) return
    navigate(`/wizard?q=${encodeURIComponent(wizardMessage.trim())}`)
  }

  const daysSinceArrival = profile?.arrival_date
    ? getDaysSince(profile.arrival_date)
    : null

  const studyPermitDaysLeft = profile?.study_permit_expiry
    ? differenceInDays(parseISO(profile.study_permit_expiry), new Date())
    : null

  const showPermitAlert =
    studyPermitDaysLeft !== null && studyPermitDaysLeft >= 0 && studyPermitDaysLeft <= 90

  const isLoading = roadmapLoading || dataLoading
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <motion.div
      className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Permit expiry alert */}
      {showPermitAlert && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {t('dashboard.permitAlert', 'Study permit expires in {{days}} days', {
                days: studyPermitDaysLeft,
              })}
            </p>
            <p className="mt-0.5 text-xs text-amber-600">
              {t(
                'dashboard.permitAlertDesc',
                'Check your renewal options or apply for a post-graduation work permit.'
              )}
            </p>
          </div>
          <Link
            to="/roadmap"
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700"
          >
            {t('dashboard.viewSteps', 'View Steps')}
          </Link>
        </motion.div>
      )}

      {/* Greeting header */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div>
            <SkeletonBlock className="mb-2 h-8 w-72" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {getGreeting()}
              {firstName ? `, ${firstName}` : ''} 🍁
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
              {daysSinceArrival !== null && (
                <span className="ml-2">
                  &middot;{' '}
                  {t('dashboard.daysSince', '{{count}} days since you arrived in Canada', {
                    count: daysSinceArrival,
                  })}
                </span>
              )}
            </p>
          </div>
        )}
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <Link
              to="/roadmap"
              className="group rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {t('dashboard.stepsCompleted', 'Steps Completed')}
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {completedCount}
                <span className="text-base font-normal text-gray-400">
                  /{totalCount}
                </span>
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                {percentComplete}% {t('dashboard.complete', 'complete')}
              </p>
            </Link>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Calendar className="h-4 w-4 text-blue-500" />
                {t('dashboard.daysInCanada', 'Days in Canada')}
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {daysSinceArrival ?? '--'}
              </p>
              <p className="mt-1 text-xs text-blue-600">
                {profile?.city ? `${profile.city}, ${profile.province}` : ''}
              </p>
            </div>

            <Link
              to="/jobs"
              className="group rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Briefcase className="h-4 w-4 text-violet-500" />
                {t('dashboard.jobsAvailable', 'Jobs Available')}
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{jobCount}</p>
              <p className="mt-1 flex items-center text-xs text-violet-600">
                {t('dashboard.viewAll', 'View all')}
                <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-0.5" />
              </p>
            </Link>

            <Link
              to="/forum"
              className="group rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <MessageSquare className="h-4 w-4 text-rose-500" />
                {t('dashboard.forumThisWeek', 'Forum Posts This Week')}
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{weeklyPostCount}</p>
              <p className="mt-1 flex items-center text-xs text-rose-600">
                {t('dashboard.joinConvo', 'Join the conversation')}
                <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          </>
        )}
      </motion.div>

      {/* Progress bar */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl bg-white p-6 shadow-sm"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">
              {t('dashboard.settlementProgress', 'Settlement Progress')}
            </h2>
          </div>
          <span className="text-sm font-bold text-gray-900">{percentComplete}%</span>
        </div>
        {isLoading ? (
          <SkeletonBlock className="h-3 w-full rounded-full" />
        ) : (
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #c41e3a, #d4a843)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          {t('dashboard.progressDesc', '{{completed}} of {{total}} settlement steps completed', {
            completed: completedCount,
            total: totalCount,
          })}
        </p>
      </motion.div>

      {/* Two-column layout: Next Steps + SettlerWiz */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Your Next Steps */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {t('dashboard.nextSteps', 'Your Next Steps')}
            </h2>
            <Link
              to="/roadmap"
              className="text-xs font-medium text-red-600 transition hover:text-red-700"
            >
              {t('dashboard.seeAll', 'See all')} &rarr;
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          ) : incompleteSteps.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-400" />
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard.allDone', 'All steps completed! Great work.')}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {incompleteSteps.slice(0, 3).map((step) => (
                <li key={step.id}>
                  <button
                    onClick={() => toggleStep(step.id, step.phase)}
                    className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition hover:bg-gray-50"
                  >
                    <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">{step.title}</p>
                      <p className="truncate text-xs text-gray-400">{step.desc}</p>
                    </div>
                    <span className="mt-0.5 flex items-center text-xs text-gray-400">
                      <Clock className="mr-1 h-3 w-3" />
                      ~{step.estimatedDays}d
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* Mini SettlerWiz widget */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col rounded-xl bg-gradient-to-br from-red-50 to-amber-50 p-6 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              {t('dashboard.settlerWiz', 'SettlerWiz')}
            </h2>
          </div>
          <p className="mb-4 flex-1 text-xs text-gray-500">
            {t(
              'dashboard.settlerWizDesc',
              'Ask anything about settling in Canada -- immigration, housing, banking, health care, and more.'
            )}
          </p>
          <form onSubmit={handleWizardSubmit} className="flex gap-2">
            <input
              type="text"
              value={wizardMessage}
              onChange={(e) => setWizardMessage(e.target.value)}
              placeholder={t(
                'dashboard.settlerWizPlaceholder',
                'How do I apply for OHIP?'
              )}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 shadow-sm transition focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">
                {t('dashboard.ask', 'Ask')}
              </span>
            </button>
          </form>
        </motion.div>
      </div>

      {/* Latest from the Community */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            {t('dashboard.latestCommunity', 'Latest from the Community')}
          </h2>
          <Link
            to="/forum"
            className="text-xs font-medium text-red-600 transition hover:text-red-700"
          >
            {t('dashboard.viewForum', 'View forum')} &rarr;
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-gray-100 p-4">
                <SkeletonBlock className="mb-3 h-4 w-3/4" />
                <SkeletonBlock className="mb-2 h-3 w-full" />
                <SkeletonBlock className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : forumPosts.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            {t('dashboard.noPosts', 'No posts yet. Be the first to share!')}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {forumPosts.map((post) => (
              <Link
                key={post.id}
                to={`/forum/${post.id}`}
                className="group rounded-lg border border-gray-100 p-4 transition hover:border-gray-200 hover:shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      categoryColors[post.category] ?? categoryColors.general
                    }`}
                  >
                    {post.category}
                  </span>
                  {post.reply_count > 0 && (
                    <span className="text-[10px] text-gray-400">
                      {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </div>
                <h3 className="mb-1 line-clamp-2 text-sm font-medium text-gray-800 transition group-hover:text-red-600">
                  {post.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>{post.profiles?.full_name ?? t('dashboard.anonymous', 'Anonymous')}</span>
                  <span>&middot;</span>
                  <span>{formatTimeAgo(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* New Opportunities -- Jobs + Housing side by side */}
      <motion.div variants={itemVariants}>
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          {t('dashboard.newOpportunities', 'New Opportunities')}
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Jobs */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('dashboard.latestJobs', 'Latest Jobs')}
                </h3>
              </div>
              <Link
                to="/jobs"
                className="text-xs font-medium text-red-600 transition hover:text-red-700"
              >
                {t('dashboard.viewAll', 'View all')} &rarr;
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-20 w-full" />
              </div>
            ) : latestJobs.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                {t('dashboard.noJobs', 'No job listings yet.')}
              </p>
            ) : (
              <div className="space-y-3">
                {latestJobs.map((job) => (
                  <Link
                    key={job.id}
                    to={`/jobs/${job.id}`}
                    className="group block rounded-lg border border-gray-100 p-4 transition hover:border-gray-200 hover:shadow-sm"
                  >
                    <h4 className="text-sm font-medium text-gray-800 transition group-hover:text-red-600">
                      {job.title}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {job.company}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      )}
                      {job.salary_range && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {job.salary_range}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                        {job.job_type.replace(/_/g, ' ')}
                      </span>
                      {job.remote && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                          {t('dashboard.remote', 'Remote')}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Housing */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('dashboard.latestHousing', 'Latest Housing')}
                </h3>
              </div>
              <Link
                to="/housing"
                className="text-xs font-medium text-red-600 transition hover:text-red-700"
              >
                {t('dashboard.viewAll', 'View all')} &rarr;
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-20 w-full" />
              </div>
            ) : latestHousing.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                {t('dashboard.noHousing', 'No housing listings yet.')}
              </p>
            ) : (
              <div className="space-y-3">
                {latestHousing.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/housing/${listing.id}`}
                    className="group block rounded-lg border border-gray-100 p-4 transition hover:border-gray-200 hover:shadow-sm"
                  >
                    <h4 className="text-sm font-medium text-gray-800 transition group-hover:text-red-600">
                      {listing.title}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.city}
                      </span>
                      <span className="font-semibold text-gray-700">
                        ${listing.price_monthly}
                        <span className="font-normal text-gray-400">/mo</span>
                      </span>
                      {listing.bedrooms !== null && (
                        <span>
                          {listing.bedrooms} {listing.bedrooms === 1 ? 'bed' : 'beds'}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                        {listing.listing_type.replace(/_/g, ' ')}
                      </span>
                      {listing.furnished && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                          {t('dashboard.furnished', 'Furnished')}
                        </span>
                      )}
                      {listing.utilities && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          {t('dashboard.utilitiesIncl', 'Utilities incl.')}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
