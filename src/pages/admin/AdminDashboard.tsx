import { useMemo } from 'react'
import {
  Newspaper,
  CalendarDays,
  Images,
  Users,
  MessageSquareHeart,
  HandHeart,
  ArrowLeft,
  BellRing,
  AlertTriangle,
  TrendingUp,
  Clock3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../../lib/store'
import { toFa, formatEventDate, humanizeDistance } from '../../lib/jalali'
import type { AdminTab } from './AdminPage'

export function AdminDashboard({ onGo }: { onGo: (tab: AdminTab) => void }) {
  const { state } = useStore()

  const stats = useMemo(() => {
    const now = Date.now()
    const upcoming = state.events.filter((e) => e.startsAt > now).length
    return {
      news: state.news.filter((n) => n.published).length,
      newsDraft: state.news.filter((n) => !n.published).length,
      events: upcoming,
      reports: state.reports.filter((r) => r.published).length,
      newRequests: state.requests.filter((r) => r.status === 'new').length,
      totalRequests: state.requests.length,
      unreadMessages: state.messages.filter((m) => !m.read).length,
      totalMessages: state.messages.length,
    }
  }, [state])

  const nextEvents = useMemo(
    () => [...state.events].filter((e) => e.startsAt > Date.now()).sort((a, b) => a.startsAt - b.startsAt).slice(0, 3),
    [state.events],
  )

  const accountIssues = state.donation.accounts.filter(
    (a) => a.cardNumber.replace(/\D/g, '').replace(/0/g, '').length === 0,
  ).length

  const cards: { label: string; value: number; icon: LucideIcon; tab: AdminTab; tone: string }[] = [
    { label: 'اخبار منتشرشده', value: stats.news, icon: Newspaper, tab: 'news', tone: '#6ee7b7' },
    { label: 'مراسم پیش رو', value: stats.events, icon: CalendarDays, tab: 'events', tone: '#f5d78e' },
    { label: 'گزارش‌های منتشرشده', value: stats.reports, icon: Images, tab: 'reports', tone: '#9fd8ff' },
    { label: 'درخواست همکاری جدید', value: stats.newRequests, icon: Users, tab: 'requests', tone: '#c4b5fd' },
    { label: 'پیام خوانده‌نشده', value: stats.unreadMessages, icon: MessageSquareHeart, tab: 'messages', tone: '#fda4af' },
    { label: 'کمک‌های ثبت‌شده', value: state.notificationsLog.filter((n) => n.kind === 'event').length, icon: HandHeart, tab: 'donation', tone: '#6ee7b7' },
  ]

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="glass card" style={{ background: 'linear-gradient(140deg, rgba(52,211,153,.18), rgba(8,30,22,.55))' }}>
        <div className="row-between">
          <div>
            <h2 style={{ fontSize: '1rem' }}>خوش آمدید، خادم گرامی</h2>
            <p className="tiny dim" style={{ marginTop: 3, lineHeight: 1.85 }}>
              از این بخش می‌توانید همه محتوای نرم‌افزار را بدون نیاز به دانش فنی به‌روزرسانی کنید.
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <button key={c.label} className="stat-card" style={{ textAlign: 'right' }} onClick={() => onGo(c.tab)}>
              <span className="row-between">
                <Icon size={17} color={c.tone} />
                <ArrowLeft size={13} style={{ opacity: 0.4 }} />
              </span>
              <span className="stat-value">{toFa(c.value)}</span>
              <span className="stat-label">{c.label}</span>
            </button>
          )
        })}
      </div>

      {(stats.newsDraft > 0 || accountIssues > 0 || stats.totalRequests > 0) && (
        <div className="glass card col" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 8 }}>
            <AlertTriangle size={17} color="#f5d78e" />
            <strong style={{ fontSize: '.88rem' }}>نیازمند توجه</strong>
          </div>
          {stats.newsDraft > 0 && (
            <div className="row-between tiny" style={{ lineHeight: 1.9 }}>
              <span className="muted">{toFa(stats.newsDraft)} خبر پیش‌نویس منتشر نشده است.</span>
              <button className="link-more" onClick={() => onGo('news')}>مشاهده</button>
            </div>
          )}
          {accountIssues > 0 && (
            <div className="row-between tiny" style={{ lineHeight: 1.9 }}>
              <span className="muted">{toFa(accountIssues)} شماره کارت/شبا هنوز تکمیل نشده است.</span>
              <button className="link-more" onClick={() => onGo('donation')}>تکمیل</button>
            </div>
          )}
          {stats.totalRequests > 0 && (
            <div className="row-between tiny" style={{ lineHeight: 1.9 }}>
              <span className="muted">{toFa(stats.totalRequests)} درخواست همکاری ثبت شده است.</span>
              <button className="link-more" onClick={() => onGo('requests')}>بررسی</button>
            </div>
          )}
        </div>
      )}

      <div className="section">
        <div className="row-between">
          <h3 className="section-title">
            <span className="bar" />
            مراسم‌های نزدیک
          </h3>
          <button className="link-more" onClick={() => onGo('events')}>
            مدیریت <ArrowLeft size={12} />
          </button>
        </div>
        {nextEvents.length === 0 ? (
          <div className="empty-state tiny">مراسم پیش رو ثبت نشده است.</div>
        ) : (
          <div className="col" style={{ gap: 7 }}>
            {nextEvents.map((e) => (
              <div key={e.id} className="admin-row">
                <span className="admin-row-thumb" style={{ width: 42, height: 42, display: 'grid', placeItems: 'center' }}>
                  <BellRing size={16} color={e.notify ? '#9ff5d5' : 'rgba(212,235,225,.4)'} />
                </span>
                <div className="admin-row-main">
                  <div className="admin-row-title">{e.title}</div>
                  <div className="admin-row-sub">
                    <Clock3 size={10} style={{ verticalAlign: -1, marginLeft: 3 }} />
                    {formatEventDate(e.startsAt)} · {humanizeDistance(e.startsAt)}
                  </div>
                </div>
                <span className={`badge ${e.notify ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '.62rem' }}>
                  {e.notify ? 'اعلان فعال' : 'بدون اعلان'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass card col" style={{ gap: 9 }}>
        <div className="row" style={{ gap: 8 }}>
          <TrendingUp size={17} color="#9ff5d5" />
          <strong style={{ fontSize: '.88rem' }}>راهنمای سریع</strong>
        </div>
        <ul className="tiny muted" style={{ lineHeight: 2.1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>• برای انتشار خبر: بخش «اخبار» ← افزودن خبر ← دکمه «انتشار» را روشن کنید.</li>
          <li>• برای یادآوری مراسم: در «مراسم‌ها» گزینه «اعلان» را فعال و زمان یادآوری را انتخاب کنید.</li>
          <li>• گزارش‌های عکسی، صوتی و ویدیویی را از بخش «گزارش‌ها» اضافه کنید.</li>
          <li>• شماره کارت و شبای قرارگاه را در «نذورات» کامل کنید تا برای مردم نمایش داده شود.</li>
          <li>• تصویر بالای صفحه اول را از «تنظیمات» ← «تصویر هدر» تغییر دهید.</li>
        </ul>
      </div>
    </div>
  )
}
