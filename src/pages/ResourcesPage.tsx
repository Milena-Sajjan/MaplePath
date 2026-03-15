import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, BookOpen, ExternalLink, Phone, MapPin, Check, Shield,
  Plus, X, ChevronDown, ChevronUp, Globe,
  Heart, Scale, Bus, GraduationCap, Landmark, Building2, Users,
  Stethoscope, Brain, Briefcase,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { demoResources } from '../lib/demoData'
import { useAuthStore } from '../store/authStore'

const resourceCategories = [
  { id: 'all', label: 'All', icon: BookOpen },
  { id: 'immigration', label: 'Immigration', icon: Globe },
  { id: 'banking', label: 'Banking', icon: Landmark },
  { id: 'health', label: 'Health', icon: Stethoscope },
  { id: 'housing', label: 'Housing', icon: Building2 },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'legal_aid', label: 'Legal Aid', icon: Scale },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'transport', label: 'Transport', icon: Bus },
  { id: 'mental_health', label: 'Mental Health', icon: Brain },
]

interface Resource {
  id: string
  category: string
  title: string
  description: string | null
  url: string | null
  phone: string | null
  address: string | null
  city: string | null
  province: string | null
  language: string[]
  status_type: string[] | null
  free: boolean
  verified: boolean
  created_at: string
}

export default function ResourcesPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [cityFilter, setCityFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestion, setSuggestion] = useState({ title: '', category: 'community', description: '', url: '', phone: '', city: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchResources = useCallback(async () => {
    if (isDemoMode) {
      let filtered = demoResources as unknown as Resource[]
      if (category !== 'all') filtered = filtered.filter((r) => r.category === category)
      if (cityFilter) filtered = filtered.filter((r) => r.city === cityFilter)
      setResources(filtered)
      setLoading(false)
      return
    }

    let query = supabase.from('resources').select('*').eq('verified', true).order('title')
    if (category !== 'all') query = query.eq('category', category)
    if (cityFilter) query = query.eq('city', cityFilter)

    const { data, error } = await query.limit(200)
    if (!error && data) setResources(data)
    setLoading(false)
  }, [category, cityFilter])

  useEffect(() => { fetchResources() }, [fetchResources])

  const filteredResources = resources.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
  })

  const handleSuggest = async () => {
    if (!user || !suggestion.title.trim()) return
    setSubmitting(true)

    if (isDemoMode) {
      setShowSuggest(false)
      setSuggestion({ title: '', category: 'community', description: '', url: '', phone: '', city: '' })
      setSubmitting(false)
      alert('Thank you! Your resource suggestion has been submitted for review.')
      return
    }

    await supabase.from('resources').insert({
      title: suggestion.title,
      category: suggestion.category,
      description: suggestion.description || null,
      url: suggestion.url || null,
      phone: suggestion.phone || null,
      city: suggestion.city || null,
      verified: false,
    })
    setShowSuggest(false)
    setSuggestion({ title: '', category: 'community', description: '', url: '', phone: '', city: '' })
    setSubmitting(false)
  }

  const getCategoryIcon = (cat: string) => {
    const found = resourceCategories.find((c) => c.id === cat)
    return found ? found.icon : BookOpen
  }

  const catColor = (cat: string) => {
    const colors: Record<string, string> = {
      immigration: 'bg-purple-100 text-purple-700',
      banking: 'bg-amber-100 text-amber-700',
      health: 'bg-green-100 text-green-700',
      housing: 'bg-pink-100 text-pink-700',
      employment: 'bg-blue-100 text-blue-700',
      education: 'bg-indigo-100 text-indigo-700',
      legal_aid: 'bg-red-100 text-red-700',
      community: 'bg-forest-pale text-forest',
      transport: 'bg-gray-100 text-gray-700',
      mental_health: 'bg-teal-100 text-teal-700',
    }
    return colors[cat] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-forest">{t('resources.title')}</h1>
          <p className="text-gray-500">{filteredResources.length} resources available</p>
        </div>
        <button
          onClick={() => setShowSuggest(true)}
          className="flex items-center gap-2 bg-maple text-white px-4 py-2.5 rounded-lg hover:bg-maple-light transition font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('resources.suggestResource')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none bg-white"
            placeholder={t('resources.search')}
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg outline-none bg-white text-sm"
        >
          <option value="">All Cities</option>
          <option value="Ottawa">Ottawa</option>
          <option value="Toronto">Toronto</option>
          <option value="Vancouver">Vancouver</option>
          <option value="Montreal">Montreal</option>
          <option value="Calgary">Calgary</option>
        </select>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {resourceCategories.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                category === cat.id ? 'bg-forest text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">{t('common.noResults')}</h3>
          <p className="text-gray-400">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const Icon = getCategoryIcon(resource.category)
            const isExpanded = expandedId === resource.id
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${catColor(resource.category)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate text-sm">{resource.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${catColor(resource.category)}`}>
                        {resource.category.replace('_', ' ')}
                      </span>
                      {resource.free && (
                        <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">{t('resources.free')}</span>
                      )}
                      {resource.verified && (
                        <span className="text-[10px] text-blue-600"><Shield className="w-3 h-3 inline" /></span>
                      )}
                    </div>
                  </div>
                </div>

                {resource.description && (
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2">{resource.description}</p>
                )}

                <button
                  onClick={() => setExpandedId(isExpanded ? null : resource.id)}
                  className="flex items-center gap-1 text-xs text-forest mt-2 hover:underline"
                >
                  {isExpanded ? 'Less' : 'More details'}
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                        {resource.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${resource.phone}`} className="hover:text-forest">{resource.phone}</a>
                          </div>
                        )}
                        {resource.address && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {resource.address}
                          </div>
                        )}
                        {resource.city && (
                          <div className="text-gray-400">{resource.city}, {resource.province || 'ON'}</div>
                        )}
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-forest hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Visit website
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showSuggest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuggest(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate">{t('resources.suggestResource')}</h2>
                <button onClick={() => setShowSuggest(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <input value={suggestion.title} onChange={(e) => setSuggestion({ ...suggestion, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-maple/20 focus:border-maple"
                  placeholder="Resource name" />
                <select value={suggestion.category} onChange={(e) => setSuggestion({ ...suggestion, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none bg-white">
                  {resourceCategories.filter((c) => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <textarea value={suggestion.description} onChange={(e) => setSuggestion({ ...suggestion, description: e.target.value })}
                  rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none resize-none"
                  placeholder="Description" />
                <input value={suggestion.url} onChange={(e) => setSuggestion({ ...suggestion, url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none" placeholder="Website URL" />
                <input value={suggestion.phone} onChange={(e) => setSuggestion({ ...suggestion, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none" placeholder="Phone number" />
                <input value={suggestion.city} onChange={(e) => setSuggestion({ ...suggestion, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none" placeholder="City" />
                <button onClick={handleSuggest} disabled={submitting || !suggestion.title.trim()}
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
