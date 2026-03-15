import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Menu,
  Bell,
  Globe,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Check,
} from 'lucide-react'
import { cn, formatTimeAgo } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { useProfileStore } from '../../store/profileStore'
import { useNotifications } from '../../hooks/useNotifications'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar'

interface TopNavProps {
  onToggleSidebar: () => void
}

interface LanguageOption {
  code: string
  label: string
  dir: 'ltr' | 'rtl'
}

const languages: LanguageOption[] = [
  { code: 'en', label: 'EN', dir: 'ltr' },
  { code: 'fr', label: 'FR', dir: 'ltr' },
  { code: 'hi', label: 'HI', dir: 'ltr' },
  { code: 'zh', label: 'ZH', dir: 'ltr' },
  { code: 'ar', label: 'AR', dir: 'rtl' },
]

const routeTitles: Record<string, string> = {
  '/': 'nav.dashboard',
  '/roadmap': 'nav.roadmap',
  '/map': 'nav.map',
  '/wizard': 'nav.wizard',
  '/forum': 'nav.forum',
  '/jobs': 'nav.jobs',
  '/housing': 'nav.housing',
  '/resources': 'nav.resources',
  '/profile': 'nav.profile',
  '/settings': 'nav.settings',
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { user, signOut } = useAuthStore()
  const { profile } = useProfileStore()
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()

  const [langOpen, setLangOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const langRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (langRef.current && !langRef.current.contains(target)) setLangOpen(false)
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = (lang: LanguageOption) => {
    i18n.changeLanguage(lang.code)
    document.documentElement.dir = lang.dir
    document.documentElement.lang = lang.code
    setLangOpen(false)
  }

  const currentLang = languages.find((l) => l.code === i18n.language) ?? languages[0]
  const pageTitle = routeTitles[location.pathname]
    ? t(routeTitles[location.pathname])
    : ''

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() ?? '?'

  const latestNotifications = notifications.slice(0, 5)

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId)
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
        aria-label={t('common.toggleMenu')}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title / breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Language selector */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => {
              setLangOpen(!langOpen)
              setNotifOpen(false)
              setUserOpen(false)
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label={t('common.changeLanguage')}
          >
            <Globe className="h-4 w-4" />
            <span>{currentLang.label}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors',
                    lang.code === i18n.language
                      ? 'bg-gray-50 text-[#C41E3A] font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span>{lang.label}</span>
                  {lang.code === i18n.language && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen)
              setLangOpen(false)
              setUserOpen(false)
            }}
            className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label={t('common.notifications')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C41E3A] px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t('common.notifications')}
                </h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      markAllRead()
                      setNotifOpen(false)
                    }}
                    className="text-xs font-medium text-[#C41E3A] hover:text-[#A01830] transition-colors"
                  >
                    {t('common.markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {latestNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    {t('common.noNotifications')}
                  </div>
                ) : (
                  latestNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification.id)}
                      className={cn(
                        'flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                        !notification.read && 'bg-blue-50/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm leading-snug',
                            notification.read
                              ? 'text-gray-600'
                              : 'text-gray-900 font-medium'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C41E3A]" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => {
              setUserOpen(!userOpen)
              setLangOpen(false)
              setNotifOpen(false)
            }}
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-gray-100 transition-colors"
            aria-label={t('common.userMenu')}
          >
            <Avatar size="sm">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ''} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2.5">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name ?? t('common.guest')}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email ?? ''}
                </p>
              </div>
              <Link
                to="/profile"
                onClick={() => setUserOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>{t('nav.profile')}</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setUserOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>{t('nav.settings')}</span>
              </Link>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen(false)
                    signOut()
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('common.signOut')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
