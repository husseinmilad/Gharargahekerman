import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  Images,
  HandHeart,
  Users,
  MessageSquareHeart,
  Inbox,
  Settings,
  ShieldCheck,
  Lock,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Home,
  KeyRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useNavigate } from '../../lib/router'
import { sha256, uid } from '../../lib/id'
import { LogoMark } from '../../components/Logo'
import { useToast } from '../../lib/toast'
import { toFa } from '../../lib/jalali'
import { AdminDashboard } from './AdminDashboard'
import { AdminNews } from './AdminNews'
import { AdminEvents } from './AdminEvents'
import { AdminReports } from './AdminReports'
import { AdminDonation } from './AdminDonation'
import { AdminRequests } from './AdminRequests'
import { AdminMessages } from './AdminMessages'
import { AdminInbox } from './AdminInbox'
import { AdminSettings } from './AdminSettings'

export type AdminTab =
  | 'dashboard'
  | 'news'
  | 'events'
  | 'reports'
  | 'donation'
  | 'requests'
  | 'messages'
  | 'inbox'
  | 'settings'

export const ADMIN_TABS: { id: AdminTab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'news', label: 'اخبار', icon: Newspaper },
  { id: 'events', label: 'مراسم‌ها', icon: CalendarDays },
  { id: 'reports', label: 'گزارش‌ها', icon: Images },
  { id: 'donation', label: 'نذورات', icon: HandHeart },
  { id: 'requests', label: 'همکاری‌ها', icon: Users },
  { id: 'messages', label: 'پیام‌ها', icon: MessageSquareHeart },
  { id: 'inbox', label: 'اعلان‌ها', icon: Inbox },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
]

const AUTH_KEY = 'gharargah-admin-session-v1'
const DEFAULT_PIN_HINT = 'یک رمز فقط مختص خودتان انتخاب کنید'

function isSessionValid(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return false
    const { exp } = JSON.parse(raw) as { exp: number }
    return Date.now() < exp
  } catch {
    return false
  }
}

export function AdminPage() {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const [authed, setAuthed] = useState(isSessionValid)
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.title = 'پنل مدیریت — قرارگاه کرمان'
    return () => {
      document.title = 'قرارگاه مردمی مدافعان وطن — محله کرمان'
    }
  }, [])

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    setAuthed(false)
    navigate('home')
  }

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />

  const TabBody = () => {
    switch (tab) {
      case 'dashboard':
        return <AdminDashboard onGo={(t) => setTab(t)} />
      case 'news':
        return <AdminNews />
      case 'events':
        return <AdminEvents />
      case 'reports':
        return <AdminReports />
      case 'donation':
        return <AdminDonation />
      case 'requests':
        return <AdminRequests />
      case 'messages':
        return <AdminMessages />
      case 'inbox':
        return <AdminInbox />
      case 'settings':
        return <AdminSettings />
      default:
        return null
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="row" style={{ gap: 9 }}>
          <button className="icon-btn" style={{ width: 40, height: 40, borderRadius: 12 }} onClick={() => setMenuOpen(true)} aria-label="منو">
            <Menu size={18} />
          </button>
          <span className="brand-logo" style={{ width: 36, height: 36, borderRadius: 11 }}>
            <LogoMark />
          </span>
          <div>
            <div className="admin-title">پنل مدیریت قرارگاه</div>
            <div className="tiny dim" style={{ marginTop: -2 }}>{state.settings.orgSubtitle}</div>
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="icon-btn" style={{ width: 40, height: 40, borderRadius: 12 }} onClick={() => navigate('home')} aria-label="نمایش برنامه">
            <Home size={17} />
          </button>
          <button className="icon-btn" style={{ width: 40, height: 40, borderRadius: 12 }} onClick={logout} aria-label="خروج">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="admin-tabs" role="tablist" aria-label="بخش‌های مدیریت">
        {ADMIN_TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              role="tab"
              className="admin-tab"
              aria-current={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              <Icon size={14} />
              {t.label}
              {t.id === 'requests' && state.requests.some((r) => r.status === 'new') && (
                <span className="nav-badge" style={{ position: 'static', minWidth: 17, height: 17 }}>
                  {toFa(state.requests.filter((r) => r.status === 'new').length)}
                </span>
              )}
              {t.id === 'messages' && state.messages.some((m) => !m.read) && (
                <span className="nav-badge" style={{ position: 'static', minWidth: 17, height: 17 }}>
                  {toFa(state.messages.filter((m) => !m.read).length)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <main className="admin-body">
        <TabBody />
      </main>

      {menuOpen && (
        <div className="sheet-backdrop" onClick={() => setMenuOpen(false)} role="presentation">
          <div className="sheet" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="row-between" style={{ marginBottom: 12 }}>
              <strong>منوی مدیریت</strong>
              <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setMenuOpen(false)} aria-label="بستن">
                <X size={17} />
              </button>
            </div>
            <div className="col" style={{ gap: 4 }}>
              {ADMIN_TABS.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    className="admin-row"
                    style={{ textAlign: 'right', background: tab === t.id ? 'rgba(52,211,153,.14)' : undefined }}
                    onClick={() => {
                      setTab(t.id)
                      setMenuOpen(false)
                    }}
                  >
                    <span className="admin-row-thumb" style={{ width: 36, height: 36, display: 'grid', placeItems: 'center' }}>
                      <Icon size={16} />
                    </span>
                    <span className="admin-row-main">
                      <span className="admin-row-title" style={{ fontSize: '.84rem' }}>{t.label}</span>
                    </span>
                    <ChevronLeft size={15} style={{ opacity: 0.4 }} />
                  </button>
                )
              })}
            </div>
            <div className="divider" style={{ margin: '14px 0' }} />
            <button className="btn btn-danger btn-block" onClick={logout}>
              <LogOut size={16} />
              خروج از پنل مدیریت
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

import { asyncHandler } from '../../lib/async-handler'

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const { state, update } = useStore()
  const { navigate } = useNavigate()
  const toast = useToast()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const hasPin = useMemo(() => Boolean(state.settings.adminPinHash), [state.settings.adminPinHash])
  const [confirmPin, setConfirmPin] = useState('')

  const finish = () => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ exp: Date.now() + 45 * 60 * 1000 }))
    onSuccess()
  }

  const submit = asyncHandler(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^\d{4,8}$/.test(pin)) {
      setError('رمز باید ۴ تا ۸ رقم باشد.')
      return
    }
    setBusy(true)
    try {
      if (pin !== confirmPin && !hasPin) {
        setError('تکرار رمز مطابقت ندارد.')
        return
      }
      if (!hasPin) {
        const hash = await sha256(pin)
        update((d) => {
          d.settings.adminPinHash = hash
        })
        toast.success('رمز مدیریت تنظیم شد؛ آن را نزد خود محفوظ نگه دارید.')
        finish()
      } else {
        const hash = await sha256(pin)
        if (hash !== state.settings.adminPinHash) {
          setError('رمز واردشده درست نیست.')
          return
        }
        finish()
      }
    } catch (err) {
      console.error('خطای ورود ادمین:', err)
      setError('خطا در پردازش رمز؛ دوباره تلاش کنید.')
    } finally {
      setBusy(false)
    }
  })

  return (
    <div className="page" style={{ minHeight: '100dvh', justifyContent: 'center', padding: '20px 0 40px' }}>
      <div className="glass card col" style={{ gap: 15, padding: '26px 22px', marginTop: 'auto', marginBottom: 'auto' }}>
        <div className="center col" style={{ alignItems: 'center', gap: 11 }}>
          <span className="brand-logo" style={{ width: 66, height: 66, borderRadius: 20 }}>
            <LogoMark />
          </span>
          <div>
            <h1 style={{ fontSize: '1.15rem' }}>بخش ویژه مدیریت</h1>
            <p className="tiny dim" style={{ marginTop: 4 }}>
              {hasPin ? 'برای ورود، رمز مدیریت را وارد کنید' : 'اولین ورود — یک رمز مدیریت ۴ تا ۸ رقمی تعیین کنید'}
            </p>
          </div>
          <span className="badge badge-gold">
            <ShieldCheck size={11} /> دسترسی محافظت‌شده
          </span>
        </div>

        <form onSubmit={submit} className="col" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="pin">{hasPin ? 'رمز مدیریت' : 'رمز جدید'}</label>
            <input
              id="pin"
              className="input"
              type="password"
              inputMode="numeric"
              autoComplete={hasPin ? 'current-password' : 'new-password'}
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              dir="ltr"
              style={{ textAlign: 'center', letterSpacing: 10, fontSize: '1.2rem' }}
            />
          </div>
          {!hasPin && (
            <div className="field">
              <label htmlFor="pin2">تکرار رمز جدید</label>
              <input
                id="pin2"
                className="input"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                dir="ltr"
                style={{ textAlign: 'center', letterSpacing: 10, fontSize: '1.2rem' }}
              />
            </div>
          )}
          {error && (
            <div className="warn-note" style={{ borderColor: 'rgba(251,113,133,.4)', background: 'rgba(251,113,133,.1)', color: '#ffd9de' }}>
              <Lock size={15} />
              <span>{error}</span>
            </div>
          )}
          {!hasPin && (
            <div className="warn-note">
              <KeyRound size={15} />
              <span>
                رمزهای فراموش‌شده قابل بازیابی نیستند؛ برای بازنشانی، از تنظیمات دستگاه داده‌های برنامه را
                پاک کنید. {DEFAULT_PIN_HINT}
              </span>
            </div>
          )}
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            <ShieldCheck size={18} />
            {busy ? 'در حال بررسی…' : hasPin ? 'ورود به پنل مدیریت' : 'تنظیم رمز و ورود'}
          </button>
        </form>
      </div>
      <div className="row center" style={{ justifyContent: 'center' }}>
        <button className="link-more" onClick={() => navigate('home')}>
          <ChevronLeft size={14} />
          بازگشت به برنامه
        </button>
      </div>
    </div>
  )
}

export function makeId(prefix: string) {
  return uid(prefix)
}
