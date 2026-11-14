import type { ReactNode } from 'react'
import { useNavigate, useRoute } from '../lib/router'
import {
  Home,
  CalendarDays,
  Images,
  HandHeart,
  UserRound,
  ChevronRight,
  Bell,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TextSizeControl } from './TextSizeControl'

interface NavEntry {
  to: string
  label: string
  icon: LucideIcon
  matches: string[]
}

const NAV: NavEntry[] = [
  { to: 'home', label: 'خانه', icon: Home, matches: ['home'] },
  { to: 'events', label: 'مراسم‌ها', icon: CalendarDays, matches: ['events', 'eventDetail'] },
  { to: 'donate', label: 'نذورات', icon: HandHeart, matches: ['donate'] },
  { to: 'reports', label: 'گزارش‌ها', icon: Images, matches: ['reports', 'reportDetail'] },
  { to: 'cooperate', label: 'همکاری', icon: UserRound, matches: ['cooperate', 'contact', 'about'] },
]

export function BottomNav() {
  const route = useRoute()
  const { navigate } = useNavigate()
  return (
    <nav className="bottom-nav" aria-label="ناوبری اصلی">
      <div className="bottom-nav-inner">
        {NAV.map((item) => {
          const active = item.matches.includes(route.name)
          const Icon = item.icon
          return (
            <button
              key={item.to}
              className="nav-item"
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(item.to)}
            >
              <span className="nav-icon-wrap">
                <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function PageHeader({
  title,
  subtitle,
  back,
  right,
  action,
}: {
  title: string
  subtitle?: string
  back?: string
  right?: ReactNode
  action?: ReactNode
}) {
  const { navigate, goBack } = useNavigate()
  return (
    <header className="page-head">
      <div className="row" style={{ minWidth: 0 }}>
        {back && (
          <button className="back-btn" onClick={() => goBack(back)} aria-label="بازگشت">
            <ChevronRight size={21} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1>{title}</h1>
          {subtitle && <div className="sub">{subtitle}</div>}
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {right}
        {action}
        <TextSizeControl compact />
        <button
          className="icon-btn"
          style={{ width: 40, height: 40, borderRadius: 13 }}
          onClick={() => navigate('notifications')}
          aria-label="اعلان‌ها"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
