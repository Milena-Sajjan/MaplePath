import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Map,
  MapPin,
  Bot,
  MoreHorizontal,
  MessageCircle,
  Briefcase,
  Building,
  BookOpen,
  X,
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface MobileNavItem {
  to: string
  icon: React.ElementType
  labelKey: string
}

const primaryItems: MobileNavItem[] = [
  { to: '/', icon: Home, labelKey: 'nav.dashboard' },
  { to: '/roadmap', icon: Map, labelKey: 'nav.roadmap' },
  { to: '/map', icon: MapPin, labelKey: 'nav.map' },
  { to: '/wizard', icon: Bot, labelKey: 'nav.wizard' },
]

const moreItems: MobileNavItem[] = [
  { to: '/forum', icon: MessageCircle, labelKey: 'nav.forum' },
  { to: '/jobs', icon: Briefcase, labelKey: 'nav.jobs' },
  { to: '/housing', icon: Building, labelKey: 'nav.housing' },
  { to: '/resources', icon: BookOpen, labelKey: 'nav.resources' },
]

export default function MobileNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = moreItems.some((item) => location.pathname === item.to)

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More menu dropdown (slides up from bottom) */}
      {moreOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden">
          <div className="mx-3 mb-2 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">
                {t('nav.more')}
              </span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 p-2">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1.5 rounded-lg px-3 py-3 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-[#C41E3A]/10 text-[#C41E3A]'
                        : 'text-gray-600 hover:bg-gray-50'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{t(item.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200 bg-white md:hidden">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-[#C41E3A]' : 'text-gray-500 hover:text-gray-700'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}

        {/* More button */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn(
            'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px] font-medium transition-colors',
            isMoreActive || moreOpen
              ? 'text-[#C41E3A]'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>{t('nav.more')}</span>
        </button>
      </nav>
    </>
  )
}
