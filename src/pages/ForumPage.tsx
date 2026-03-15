import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, ThumbsUp, Plus, X, Filter, Clock, TrendingUp, MessageSquare,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { formatTimeAgo } from '../lib/utils'

const categories = ['all', 'housing', 'jobs', 'immigration', 'banking', 'health', 'community', 'education', 'general']
const sortOptions = [
  { value: 'latest', label: 'Latest', icon: Clock },
  { value: 'upvotes', label: 'Most Upvoted', icon: TrendingUp },
  { value: 'replies', label: 'Most Replies', icon: MessageSquare },
]

interface ForumPost {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  city: string | null
  upvotes: number
  reply_count: number
  created_at: string
  user_id: string
  profiles?: { full_name: string | null; avatar_url: string | null; country_of_origin: string | null } | null
}

export default function ForumPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('latest')
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general', tags: '', city: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchPosts = useCallback(async () => {
    let query = supabase
      .from('forum_posts')
      .select('*, profiles(full_name, avatar_url, country_of_origin)')

    if (category !== 'all') {
      query = query.eq('category', category as any)
    }

    if (sort === 'latest') query = query.order('created_at', { ascending: false })
    else if (sort === 'upvotes') query = query.order('upvotes', { ascending: false })
    else if (sort === 'replies') query = query.order('reply_count', { ascending: false })

    const { data, error } = await query.limit(50)
    if (!error && data) setPosts(data as unknown as ForumPost[])
    setLoading(false)
  }, [category, sort])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    const channel = supabase
      .channel('forum-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_posts' }, (payload) => {
        setPosts((prev) => [payload.new as ForumPost, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSubmitPost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('forum_posts').insert({
      user_id: user.id,
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      tags: newPost.tags.split(',').map((t) => t.trim()).filter(Boolean),
      city: newPost.city || null,
    })
    if (!error) {
      setShowNewPost(false)
      setNewPost({ title: '', content: '', category: 'general', tags: '', city: '' })
      fetchPosts()
    }
    setSubmitting(false)
  }

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      housing: 'bg-pink-100 text-pink-700',
      jobs: 'bg-blue-100 text-blue-700',
      immigration: 'bg-purple-100 text-purple-700',
      banking: 'bg-amber-100 text-amber-700',
      health: 'bg-green-100 text-green-700',
      community: 'bg-forest-pale text-forest',
      education: 'bg-indigo-100 text-indigo-700',
      general: 'bg-gray-100 text-gray-700',
    }
    return colors[cat] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-forest">{t('forum.title')}</h1>
          <p className="text-gray-500">{t('forum.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-2 bg-maple text-white px-4 py-2.5 rounded-lg hover:bg-maple-light transition font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('forum.newPost')}
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              category === cat
                ? 'bg-forest text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat === 'all' ? t('forum.allCategories') : t(`forum.${cat}`, cat.charAt(0).toUpperCase() + cat.slice(1))}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${
              sort === opt.value ? 'bg-forest/10 text-forest font-medium' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <opt.icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="flex gap-4 mt-3">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No posts yet</h3>
          <p className="text-gray-400">Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition cursor-pointer"
              >
                <Link to={`/forum/${post.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(post.category)}`}>
                          {post.category}
                        </span>
                        {post.city && (
                          <span className="text-xs text-gray-400">{post.city}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-slate mb-1">{post.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-forest/20 flex items-center justify-center text-[10px] font-medium text-forest">
                        {post.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                      <span>{post.profiles?.full_name || 'Anonymous'}</span>
                    </div>
                    <span>{formatTimeAgo(post.created_at)}</span>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {post.upvotes}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {post.reply_count}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showNewPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewPost(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate">{t('forum.newPost')}</h2>
                <button onClick={() => setShowNewPost(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate mb-1">{t('forum.postTitle')}</label>
                  <input
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none"
                    placeholder="What's on your mind?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate mb-1">{t('forum.postCategory')}</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none bg-white"
                  >
                    {categories.filter((c) => c !== 'all').map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate mb-1">{t('forum.postContent')}</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none resize-none"
                    placeholder="Share your experience, ask a question..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate mb-1">{t('forum.postTags')}</label>
                  <input
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none"
                    placeholder="Comma-separated tags"
                  />
                </div>
                <button
                  onClick={handleSubmitPost}
                  disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                  className="w-full bg-maple text-white py-2.5 rounded-lg hover:bg-maple-light transition font-medium disabled:opacity-50"
                >
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
