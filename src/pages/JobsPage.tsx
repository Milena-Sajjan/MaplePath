import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Briefcase, MapPin, Clock, DollarSign, ExternalLink,
  Bookmark, BookmarkCheck, Plus, X, Globe, Filter,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { demoJobs } from '../lib/demoData'
import { useAuthStore } from '../store/authStore'
import { useProfileStore } from '../store/profileStore'
import { formatTimeAgo } from '../lib/utils'

const jobTypes = ['all', 'on_campus', 'off_campus', 'co_op', 'internship', 'part_time', 'full_time', 'volunteer']

interface JobListing {
  id: string
  title: string
  company: string
  description: string
  requirements: string | null
  job_type: string
  salary_range: string | null
  location: string | null
  city: string | null
  remote: boolean
  status_types: string[] | null
  languages_needed: string[] | null
  application_url: string | null
  contact_email: string | null
  deadline: string | null
  is_active: boolean
  views: number
  created_at: string
}

export default function JobsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { profile } = useProfileStore()
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [eligibleOnly, setEligibleOnly] = useState(false)
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  const [savedJobs, setSavedJobs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('savedJobs') || '[]') } catch { return [] }
  })
  const [showPostJob, setShowPostJob] = useState(false)
  const [newJob, setNewJob] = useState({
    title: '', company: '', description: '', requirements: '',
    job_type: 'part_time', salary_range: '', location: '', city: 'Ottawa',
    remote: false, application_url: '', deadline: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchJobs = useCallback(async () => {
    if (isDemoMode) {
      setJobs(demoJobs as JobListing[])
      setLoading(false)
      return
    }

    let query = supabase
      .from('job_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (typeFilter !== 'all') query = query.eq('job_type', typeFilter as any)
    if (remoteOnly) query = query.eq('remote', true)

    const { data, error } = await query.limit(50)
    if (!error && data) setJobs(data)
    setLoading(false)
  }, [typeFilter, remoteOnly])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const toggleSaveJob = (jobId: string) => {
    const updated = savedJobs.includes(jobId)
      ? savedJobs.filter((id) => id !== jobId)
      : [...savedJobs, jobId]
    setSavedJobs(updated)
    localStorage.setItem('savedJobs', JSON.stringify(updated))
  }

  const filteredJobs = jobs.filter((job) => {
    if (search) {
      const q = search.toLowerCase()
      if (!job.title.toLowerCase().includes(q) && !job.company.toLowerCase().includes(q)) return false
    }
    if (eligibleOnly && profile?.status_type && job.status_types) {
      if (!job.status_types.includes(profile.status_type)) return false
    }
    return true
  })

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      on_campus: 'On Campus', off_campus: 'Off Campus', co_op: 'Co-op',
      internship: 'Internship', part_time: 'Part Time', full_time: 'Full Time',
      volunteer: 'Volunteer',
    }
    return labels[type] || type
  }

  const typeColor = (type: string) => {
    const colors: Record<string, string> = {
      on_campus: 'bg-green-100 text-green-700', off_campus: 'bg-blue-100 text-blue-700',
      co_op: 'bg-purple-100 text-purple-700', internship: 'bg-amber-100 text-amber-700',
      part_time: 'bg-gray-100 text-gray-700', full_time: 'bg-forest-pale text-forest',
      volunteer: 'bg-pink-100 text-pink-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const handlePostJob = async () => {
    if (!newJob.title.trim()) return
    setSubmitting(true)

    if (isDemoMode) {
      const demoJob: JobListing = {
        id: `demo-${Date.now()}`,
        title: newJob.title,
        company: newJob.company,
        description: newJob.description,
        requirements: newJob.requirements || null,
        job_type: newJob.job_type,
        salary_range: newJob.salary_range || null,
        location: newJob.location || null,
        city: newJob.city || null,
        remote: newJob.remote,
        status_types: null,
        languages_needed: null,
        application_url: newJob.application_url || null,
        contact_email: null,
        deadline: newJob.deadline || null,
        is_active: true,
        views: 0,
        created_at: new Date().toISOString(),
      }
      setJobs((prev) => [demoJob, ...prev])
      setShowPostJob(false)
      setSubmitting(false)
      return
    }

    if (!user) return
    const { error } = await supabase.from('job_listings').insert({
      posted_by: user.id,
      title: newJob.title,
      company: newJob.company,
      description: newJob.description,
      requirements: newJob.requirements || null,
      job_type: newJob.job_type,
      salary_range: newJob.salary_range || null,
      location: newJob.location || null,
      city: newJob.city || null,
      remote: newJob.remote,
      application_url: newJob.application_url || null,
      deadline: newJob.deadline || null,
    })
    if (!error) {
      setShowPostJob(false)
      fetchJobs()
    }
    setSubmitting(false)
  }

  const daysUntilDeadline = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime()
    return Math.ceil(diff / 86400000)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-forest">{t('jobs.title')}</h1>
          <p className="text-gray-500">{filteredJobs.length} jobs available</p>
        </div>
        <button
          onClick={() => setShowPostJob(true)}
          className="flex items-center gap-2 bg-maple text-white px-4 py-2.5 rounded-lg hover:bg-maple-light transition font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('jobs.postJob')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none bg-white"
            placeholder={t('jobs.search')}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {jobTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                typeFilter === type ? 'bg-forest text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {type === 'all' ? t('jobs.allTypes') : typeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} className="accent-maple" />
          {t('jobs.eligibleJobs')}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="accent-maple" />
          {t('jobs.remote')}
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">{t('common.noResults')}</h3>
          <p className="text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor(job.job_type)}`}>
                      {typeLabel(job.job_type)}
                    </span>
                    {job.remote && (
                      <span className="flex items-center gap-1 text-xs text-blue-600">
                        <Globe className="w-3 h-3" /> Remote
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-slate mb-1">{job.title}</h3>
                  <p className="text-gray-500 text-sm">{job.company}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSaveJob(job.id) }}
                  className="text-gray-400 hover:text-maple transition"
                >
                  {savedJobs.includes(job.id)
                    ? <BookmarkCheck className="w-5 h-5 text-maple" />
                    : <Bookmark className="w-5 h-5" />
                  }
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3 text-sm text-gray-400">
                {job.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                )}
                {job.salary_range && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salary_range}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTimeAgo(job.created_at)}</span>
              </div>
              {job.deadline && daysUntilDeadline(job.deadline) <= 7 && daysUntilDeadline(job.deadline) > 0 && (
                <p className="mt-2 text-xs text-amber-600 font-medium">
                  Deadline in {daysUntilDeadline(job.deadline)} days
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor(selectedJob.job_type)}`}>
                      {typeLabel(selectedJob.job_type)}
                    </span>
                    {selectedJob.remote && <span className="text-xs text-blue-600">Remote</span>}
                  </div>
                  <h2 className="text-xl font-serif text-slate">{selectedJob.title}</h2>
                  <p className="text-gray-500">{selectedJob.company}</p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
                {selectedJob.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selectedJob.location}</span>}
                {selectedJob.salary_range && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{selectedJob.salary_range}</span>}
              </div>

              <div className="prose prose-sm max-w-none text-gray-700 mb-4 whitespace-pre-wrap">
                {selectedJob.description}
              </div>

              {selectedJob.requirements && (
                <div className="mb-4">
                  <h4 className="font-medium text-slate mb-1">Requirements</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}

              {selectedJob.deadline && (
                <p className="text-sm text-gray-500 mb-4">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Deadline: {new Date(selectedJob.deadline).toLocaleDateString()}
                  {daysUntilDeadline(selectedJob.deadline) > 0 && ` (${daysUntilDeadline(selectedJob.deadline)} days left)`}
                </p>
              )}

              <div className="flex gap-2">
                {selectedJob.application_url && (
                  <a
                    href={selectedJob.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-maple text-white px-4 py-2.5 rounded-lg hover:bg-maple-light transition font-medium flex-1 justify-center"
                  >
                    {t('jobs.apply')}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => toggleSaveJob(selectedJob.id)}
                  className="flex items-center gap-2 border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition"
                >
                  {savedJobs.includes(selectedJob.id)
                    ? <><BookmarkCheck className="w-4 h-4 text-maple" /> Saved</>
                    : <><Bookmark className="w-4 h-4" /> {t('jobs.saveJob')}</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPostJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPostJob(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate">{t('jobs.postJob')}</h2>
                <button onClick={() => setShowPostJob(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <input value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none"
                  placeholder="Job title" />
                <input value={newJob.company} onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none"
                  placeholder="Company name" />
                <select value={newJob.job_type} onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none bg-white">
                  {jobTypes.filter((t) => t !== 'all').map((type) => (
                    <option key={type} value={type}>{typeLabel(type)}</option>
                  ))}
                </select>
                <textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none resize-none"
                  placeholder="Job description" />
                <input value={newJob.salary_range} onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none"
                  placeholder="Salary range (e.g. $18-22/hr)" />
                <input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none"
                  placeholder="Location" />
                <input value={newJob.application_url} onChange={(e) => setNewJob({ ...newJob, application_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none"
                  placeholder="Application URL" />
                <input type="date" value={newJob.deadline} onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none" />
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={newJob.remote} onChange={(e) => setNewJob({ ...newJob, remote: e.target.checked })} className="accent-maple" />
                  Remote position
                </label>
                <button onClick={handlePostJob} disabled={submitting || !newJob.title.trim() || !newJob.description.trim()}
                  className="w-full bg-maple text-white py-2.5 rounded-lg hover:bg-maple-light transition font-medium disabled:opacity-50">
                  {submitting ? t('common.loading') : t('common.submit')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
