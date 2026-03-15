import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  Map,
  MapPin,
  Bot,
  MessageCircle,
  Briefcase,
  Building,
  BookOpen,
  User,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import { useProfileStore } from '../../store/profileStore'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/Avatar'
import { Badge } from '../ui/Badge'

interface NavItem {
  to: string
  icon: React.ElementType
  labelKey: string
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, labelKey: 'nav.dashboard' },
  { to: '/roadmap', icon: Map, labelKey: 'nav.roadmap' },
  { to: '/map', icon: MapPin, labelKey: 'nav.map' },
  { to: '/wizard', icon: Bot, labelKey: 'nav.wizard' },
  { to: '/forum', icon: MessageCircle, labelKey: 'nav.forum' },
  { to: '/jobs', icon: Briefcase, labelKey: 'nav.jobs' },
  { to: '/housing', icon: Building, labelKey: 'nav.housing' },
  { to: '/resources', icon: BookOpen, labelKey: 'nav.resources' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
]

const statusLabels: Record<string, string> = {
  international_student: 'common.internationalStudent',
  permanent_resident: 'common.permanentResident',
  visitor: 'common.visitor',
  refugee: 'common.refugee',
}

export default function Sidebar() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { profile } = useProfileStore()

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-[#1A3A2A] text-white z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M16 2C16 2 12 6 8 10C4 14 4 18 6 22C8 26 12 28 16 30C20 28 24 26 26 22C28 18 28 14 24 10C20 6 16 2 16 2Z"
            fill="#C41E3A"
          />
          <path
            d="M16 8V24M10 14H22M12 10L16 16L20 10M12 22L16 16L20 22"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-lg font-bold tracking-tight">MaplePath</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white border-l-[3px] border-[#C41E3A] pl-[9px]'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ''} />
            ) : null}
            <AvatarFallback className="bg-white/20 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.full_name ?? user?.email ?? t('common.guest')}
            </p>
            {profile?.status_type && (
              <Badge
                variant="outline"
                className="mt-0.5 text-[10px] border-white/30 text-white/70 px-1.5 py-0"
              >
                {t(statusLabels[profile.status_type] ?? profile.status_type)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
