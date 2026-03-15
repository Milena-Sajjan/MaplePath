import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  User, Camera, Calendar, Shield, Bell, Globe, Trash2, Save,
  AlertTriangle, Clock, CheckCircle2, Edit3, X,
} from 'lucide-react'
import { differenceInDays, format, addDays } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useRoadmap } from '../hooks/useRoadmap'
import { supabase, isDemoMode } from '../lib/supabase'
import { demoProfile } from '../lib/demoData'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'

const statusLabels: Record<string, string> = {
  international_student: 'International Student',
  permanent_resident: 'Permanent Resident',
  visitor: 'Visitor',
  refugee: 'Refugee',
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { profile: liveProfile, update, uploadAvatar } = useProfile()
  const { getPhaseProgress, completedCount, totalCount } = useRoadmap()
  const { signOut } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [demoToast, setDemoToast] = useState<string | null>(null)
  const [demoProfileState, setDemoProfileState] = useState(demoProfile)

  const profile = isDemoMode ? demoProfileState : liveProfile

  const showDemoToast = (msg: string) => {
    setDemoToast(msg)
    setTimeout(() => setDemoToast(null), 3000)
  }

  useEffect(() => {
    if (profile) {
      setEditData({
        full_name: profile.full_name || '',
        country_of_origin: profile.country_of_origin || '',
        university: profile.university || '',
        program: profile.program || '',
        city: profile.city,
        province: profile.province,
        languages: profile.languages || [],
        arrival_date: profile.arrival_date || '',
        study_permit_expiry: profile.study_permit_expiry || '',
        email_notifications: profile.email_notifications,
        preferred_language: profile.preferred_language,
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    if (isDemoMode) {
      setDemoProfileState((prev) => ({ ...prev, ...editData }))
      setEditing(false)
      setSaving(false)
      return
    }
    await update(editData)
    setEditing(false)
    setSaving(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (isDemoMode) {
        showDemoToast('Avatar upload requires Supabase')
        return
      }
      await uploadAvatar(file)
    }
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
    }
    update({ preferred_language: lang })
  }

  const handleDeleteAccount = async () => {
    if (isDemoMode) {
      showDemoToast('Account deletion not available in demo mode')
      setShowDeleteConfirm(false)
      return
    }
    await signOut()
  }

  const getImportantDates = () => {
    if (!profile) return []
    const dates: { label: string; date: Date; status: 'ok' | 'warning' | 'danger' }[] = []

    if (profile.arrival_date) {
      const ohipDate = addDays(new Date(profile.arrival_date), 90)
      const daysUntil = differenceInDays(ohipDate, new Date())
      dates.push({
        label: t('profile.ohipEligibility'),
        date: ohipDate,
        status: daysUntil < 0 ? 'ok' : daysUntil < 30 ? 'warning' : 'ok',
      })
    }

    if (profile.study_permit_expiry) {
      const renewDate = addDays(new Date(profile.study_permit_expiry), -90)
      const daysUntil = differenceInDays(renewDate, new Date())
      dates.push({
        label: t('profile.permitRenewal'),
        date: renewDate,
        status: daysUntil < 0 ? 'danger' : daysUntil < 30 ? 'warning' : 'ok',
      })
    }

    const taxDeadline = new Date(new Date().getFullYear(), 3, 30)
    if (taxDeadline < new Date()) taxDeadline.setFullYear(taxDeadline.getFullYear() + 1)
    const taxDays = differenceInDays(taxDeadline, new Date())
    dates.push({
      label: t('profile.taxDeadline'),
      date: taxDeadline,
      status: taxDays < 30 ? 'warning' : 'ok',
    })

    return dates
  }

  const phaseData = [1, 2, 3, 4].map((phase) => {
    const { completed, total } = getPhaseProgress(phase)
    return { name: `Phase ${phase}`, completed, remaining: total - completed }
  })

  const pieData = [
    { name: 'Completed', value: completedCount, color: '#2D5A3D' },
    { name: 'Remaining', value: totalCount - completedCount, color: '#E5E7EB' },
  ]

  if (!profile) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div>
              <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {demoToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 right-4 z-50 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg shadow-lg text-sm"
        >
          {demoToast}
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-forest/20 flex items-center justify-center text-2xl font-medium text-forest overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile.full_name?.charAt(0) || '?'
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-maple text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-maple-light transition">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate">{profile.full_name}</h2>
              <span className="inline-block px-2.5 py-0.5 bg-forest/10 text-forest text-xs font-medium rounded-full mt-1">
                {statusLabels[profile.status_type || ''] || profile.status_type}
              </span>
              {profile.university && (
                <p className="text-sm text-gray-500 mt-1">{profile.university}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 text-sm text-forest hover:underline"
          >
            {editing ? <><X className="w-4 h-4" /> {t('common.cancel')}</> : <><Edit3 className="w-4 h-4" /> {t('profile.editProfile')}</>}
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-medium text-slate mb-4">{t('profile.personalInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editing ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input value={editData.full_name} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-maple" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Country of Origin</label>
                <input value={editData.country_of_origin} onChange={(e) => setEditData({ ...editData, country_of_origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-maple" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">University</label>
                <input value={editData.university} onChange={(e) => setEditData({ ...editData, university: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-maple" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Program</label>
                <input value={editData.program} onChange={(e) => setEditData({ ...editData, program: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-maple" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                <input value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-maple" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Arrival Date</label>
                <input type="date" value={editData.arrival_date} onChange={(e) => setEditData({ ...editData, arrival_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-maple" />
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Name" value={profile.full_name} />
              <InfoRow label="Email" value={user?.email} />
              <InfoRow label="Country" value={profile.country_of_origin} />
              <InfoRow label="University" value={profile.university} />
              <InfoRow label="Program" value={profile.program} />
              <InfoRow label="City" value={`${profile.city}, ${profile.province}`} />
              <InfoRow label="Languages" value={profile.languages?.join(', ')} />
              <InfoRow label="Arrival Date" value={profile.arrival_date ? format(new Date(profile.arrival_date), 'MMM d, yyyy') : null} />
            </>
          )}
        </div>
        {editing && (
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-forest text-white px-4 py-2 rounded-lg hover:bg-forest-mid transition font-medium text-sm disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? t('common.loading') : t('profile.save')}
            </button>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-medium text-slate mb-4">{t('profile.importantDates')}</h3>
        <div className="space-y-3">
          {getImportantDates().map((item, i) => (
            <div key={i} className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              item.status === 'danger' ? 'bg-red-50' : item.status === 'warning' ? 'bg-amber-50' : 'bg-gray-50'
            )}>
              <div className="flex items-center gap-2">
                {item.status === 'danger' ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                  item.status === 'warning' ? <Clock className="w-4 h-4 text-amber-500" /> :
                  <CheckCircle2 className="w-4 h-4 text-green-500" />}
                <span className="text-sm font-medium text-slate">{item.label}</span>
              </div>
              <span className={cn('text-sm', item.status === 'danger' ? 'text-red-600 font-medium' : item.status === 'warning' ? 'text-amber-600' : 'text-gray-500')}>
                {format(item.date, 'MMM d, yyyy')}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-medium text-slate mb-4">{t('profile.settlementStats')}</h3>
        <div className="flex items-center justify-center">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} startAngle={90} endAngle={-270}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="ml-4">
            <p className="text-3xl font-semibold text-forest">{completedCount}/{totalCount}</p>
            <p className="text-sm text-gray-500">steps completed</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-medium text-slate mb-4">{t('profile.notificationPrefs')}</h3>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-700">Email notifications</span>
          <input
            type="checkbox"
            checked={editData.email_notifications ?? profile.email_notifications}
            onChange={(e) => {
              setEditData({ ...editData, email_notifications: e.target.checked })
              update({ email_notifications: e.target.checked })
            }}
            className="accent-maple w-4 h-4"
          />
        </label>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-medium text-slate mb-4">{t('profile.languagePref')}</h3>
        <div className="flex gap-2 flex-wrap">
          {[
            { code: 'en', label: 'English' },
            { code: 'fr', label: 'Fran\u00e7ais' },
            { code: 'hi', label: '\u0939\u093f\u0928\u094d\u0926\u0940' },
            { code: 'zh', label: '\u4e2d\u6587' },
            { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition',
                (profile.preferred_language || 'en') === lang.code
                  ? 'bg-forest text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
        <h3 className="text-lg font-medium text-red-600 mb-4">{t('profile.dangerZone')}</h3>
        {showDeleteConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{t('profile.deleteConfirm')}</p>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition">
                {t('common.confirm')} {t('profile.deleteAccount')}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium">
            <Trash2 className="w-4 h-4" />
            {t('profile.deleteAccount')}
          </button>
        )}
      </motion.div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-400 uppercase">{label}</span>
      <p className="text-sm text-slate mt-0.5">{value || '—'}</p>
    </div>
  )
}
