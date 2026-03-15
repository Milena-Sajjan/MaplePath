import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ThumbsUp, MessageCircle, ArrowLeft, Share2, Bot, Check, Send,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { demoForumPosts } from '../lib/demoData'
import { useAuthStore } from '../store/authStore'
import { formatTimeAgo } from '../lib/utils'

interface Post {
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
  profiles?: { full_name: string | null; avatar_url: string | null } | null
}

interface Reply {
  id: string
  content: string
  upvotes: number
  is_answer: boolean
  created_at: string
  user_id: string
  profiles?: { full_name: string | null; avatar_url: string | null } | null
}

export default function ForumPostPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [hasUpvoted, setHasUpvoted] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return

    if (isDemoMode) {
      const demoPost = demoForumPosts.find((p) => p.id === id)
      if (demoPost) setPost(demoPost as unknown as Post)
      setReplies([])
      setLoading(false)
      return
    }

    const [postRes, repliesRes] = await Promise.all([
      supabase.from('forum_posts').select('*, profiles(full_name, avatar_url)').eq('id', id).single(),
      supabase.from('forum_replies').select('*, profiles(full_name, avatar_url)').eq('post_id', id).order('created_at', { ascending: true }),
    ])
    if (postRes.data) setPost(postRes.data as unknown as Post)
    if (repliesRes.data) setReplies(repliesRes.data as unknown as Reply[])
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpvote = async () => {
    if (!post || hasUpvoted) return
    const newUpvotes = post.upvotes + 1
    if (!isDemoMode) {
      await supabase.from('forum_posts').update({ upvotes: newUpvotes }).eq('id', post.id)
    }
    setPost({ ...post, upvotes: newUpvotes })
    setHasUpvoted(true)
  }

  const handleReplyUpvote = async (replyId: string, currentUpvotes: number) => {
    const newUpvotes = currentUpvotes + 1
    if (!isDemoMode) {
      await supabase.from('forum_replies').update({ upvotes: newUpvotes }).eq('id', replyId)
    }
    setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, upvotes: newUpvotes } : r))
  }

  const handleSubmitReply = async () => {
    if (!user || !post || !replyContent.trim()) return
    setSubmitting(true)

    if (isDemoMode) {
      const demoReply: Reply = {
        id: `demo-reply-${Date.now()}`,
        content: replyContent,
        upvotes: 0,
        is_answer: false,
        created_at: new Date().toISOString(),
        user_id: user.id,
        profiles: { full_name: 'Demo User', avatar_url: null },
      }
      setReplies((prev) => [...prev, demoReply])
      setPost({ ...post, reply_count: post.reply_count + 1 })
      setReplyContent('')
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from('forum_replies').insert({
      post_id: post.id,
      user_id: user.id,
      content: replyContent,
    })
    if (!error) {
      await supabase.from('forum_posts').update({ reply_count: post.reply_count + 1 }).eq('id', post.id)
      setPost({ ...post, reply_count: post.reply_count + 1 })
      setReplyContent('')
      fetchData()
    }
    setSubmitting(false)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
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

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto text-center py-16">
        <h2 className="text-xl font-medium text-gray-600">Post not found</h2>
        <Link to="/forum" className="text-maple hover:underline mt-2 inline-block">Back to Forum</Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/forum')} className="flex items-center gap-1 text-gray-500 hover:text-slate mb-4 transition">
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColor(post.category)}`}>
            {post.category}
          </span>
          {post.city && <span className="text-xs text-gray-400">{post.city}</span>}
          <span className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</span>
        </div>

        <h1 className="text-2xl font-serif text-slate mb-4">{post.title}</h1>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-forest/20 flex items-center justify-center text-sm font-medium text-forest">
            {post.profiles?.full_name?.charAt(0) || '?'}
          </div>
          <span className="text-sm font-medium text-slate">{post.profiles?.full_name || 'Anonymous'}</span>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 mb-6 whitespace-pre-wrap">
          {post.content}
        </div>

        {post.tags.length > 0 && (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {post.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
              hasUpvoted ? 'bg-forest/10 text-forest' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            {post.upvotes}
          </button>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <MessageCircle className="w-4 h-4" />
            {post.reply_count} {t('forum.replies', { count: post.reply_count })}
          </div>
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition">
            <Share2 className="w-4 h-4" />
            {t('forum.share')}
          </button>
          <Link
            to={`/wizard?q=${encodeURIComponent(post.title)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-forest hover:bg-forest/10 transition ml-auto"
          >
            <Bot className="w-4 h-4" />
            {t('forum.askWizard')}
          </Link>
        </div>
      </motion.div>

      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-medium text-slate">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h3>

        {replies.map((reply) => (
          <motion.div
            key={reply.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl p-4 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-forest/20 flex items-center justify-center text-[10px] font-medium text-forest">
                {reply.profiles?.full_name?.charAt(0) || '?'}
              </div>
              <span className="text-sm font-medium text-slate">{reply.profiles?.full_name || 'Anonymous'}</span>
              <span className="text-xs text-gray-400">{formatTimeAgo(reply.created_at)}</span>
              {reply.is_answer && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Helpful
                </span>
              )}
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
            <div className="mt-2">
              <button
                onClick={() => handleReplyUpvote(reply.id, reply.upvotes)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-forest transition"
              >
                <ThumbsUp className="w-3 h-3" />
                {reply.upvotes}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl p-4 border border-gray-100">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple/20 focus:border-maple outline-none resize-none"
          placeholder={t('forum.replyPlaceholder')}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmitReply}
            disabled={submitting || !replyContent.trim()}
            className="flex items-center gap-2 bg-maple text-white px-4 py-2 rounded-lg hover:bg-maple-light transition font-medium disabled:opacity-50 text-sm"
          >
            <Send className="w-4 h-4" />
            {submitting ? t('common.loading') : t('common.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
