import { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  CalendarDays,
  ChevronLeft,
  Clock3,
  MapPin,
  Radio,
  Images,
  PlayCircle,
  Headphones,
  Video,
  HandHeart,
  Users,
  Newspaper,
  ArrowUpLeft,
  Share2,
  Bell,
  Megaphone,
} from 'lucide-react'
import { useStore, useNow, resolveAsset } from '../lib/store'
import { useNavigate } from '../lib/router'
import { SmartImage } from '../components/SmartImage'
import { WeatherCard } from '../components/WeatherCard'
import { LogoMark } from '../components/Logo'
import { TextSizeControl } from '../components/TextSizeControl'
import { EmptyState } from '../components/EmptyState'
import { humanizeDistance, formatEventDate, formatJalali, toFa } from '../lib/jalali'
import { truncate } from '../lib/format'
import { nativeShare } from '../lib/clipboard'
import { useToast } from '../lib/toast'
import type { EventItem } from '../types'

export function HomePage() {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const now = useNow(30_000)
  const toast = useToast()
  const [heroFailed, setHeroFailed] = useState(false)

  const sortedEvents = useMemo(
    () =>
      [...state.events]
        .filter((e) => (e.endsAt ?? e.startsAt + 2 * 3600_000) > now)
        .sort((a, b) => a.startsAt - b.startsAt),
    [state.events, now],
  )
  const liveEvents = sortedEvents.filter((e) => e.startsAt <= now)
  const upcoming = sortedEvents.filter((e) => e.startsAt > now)
  const eventsToShow = [...liveEvents, ...upcoming].slice(0, 3)

  const publishedNews = useMemo(
    () =>
      [...state.news]
        .filter((n) => n.published)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }),
    [state.news],
  )
  const topNews = publishedNews[0]
  const restNews = publishedNews.slice(1, 3)

  const reports = useMemo(
    () => [...state.reports].filter((r) => r.published).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [state.reports],
  )
  const latestReports = reports.slice(0, 4)

  const heroImage = state.settings.heroImage
  const nextEvent = upcoming[0]

  return (
    <div className="page" style={{ gap: 22 }}>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          {heroImage && !heroFailed ? (
            <HeroImage src={heroImage} onFail={() => setHeroFailed(true)} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background:
                  'radial-gradient(circle at 70% 20%, rgba(16,185,129,.4), transparent 60%), linear-gradient(160deg,#0b3a2a,#04120d)',
              }}
            />
          )}
        </div>
        <div className="hero-topline">
          <div className="brand">
            <span className="brand-logo">
              <LogoMark />
            </span>
            <div>
              <div className="brand-name">{state.settings.orgName}</div>
              <div className="brand-sub">
                {state.settings.orgSubtitle} · {state.settings.motto}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 6, flex: 'none' }}>
            <TextSizeControl />
            <button
              className="icon-btn"
              style={{ width: 42, height: 42, flex: 'none' }}
              onClick={() => navigate('notifications')}
              aria-label="اعلان‌ها"
            >
              <Bell size={19} />
            </button>
          </div>
        </div>

        <div className="hero-body">
          <span className="hero-kicker">
            <Megaphone size={13} />
            پایگاه اطلاع‌رسانی اهالی محله
          </span>
          <h2 className="hero-title">
            {state.settings.heroTitle.split(' ').map((word, i, arr) =>
              i === arr.length - 1 ? (
                <span key={i} className="gold">
                  {word}
                </span>
              ) : (
                <span key={i}>{word} </span>
              ),
            )}
          </h2>
          <p className="hero-sub">{state.settings.heroSubtitle}</p>

          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => navigate('donate')}>
              <HandHeart size={18} />
              پرداخت نذورات
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('events')}>
              <CalendarDays size={18} />
              مراسم پیش رو
            </button>
          </div>
        </div>
      </section>

      {/* ---------- Weather (admin can set city; default Tehran) ---------- */}
      <WeatherCard />

      {/* ---------- Live / next event ribbon ---------- */}
      {liveEvents.length > 0 && (
        <button
          className="glass card row-between"
          style={{
            borderColor: 'rgba(251,113,133,.4)',
            background: 'linear-gradient(140deg, rgba(120,30,45,.45), rgba(20,10,14,.6))',
            textAlign: 'right',
          }}
          onClick={() => navigate(`events/${liveEvents[0].id}`)}
        >
          <span className="row" style={{ gap: 10, minWidth: 0 }}>
            <span className="badge badge-live">در حال برگزاری</span>
            <span
              className="grow"
              style={{ fontSize: '.88rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {liveEvents[0].title}
            </span>
          </span>
          <ChevronLeft size={18} />
        </button>
      )}

      {/* ---------- Upcoming events ---------- */}
      <section className="section">
        <div className="section-head">
          <h3 className="section-title">
            <span className="bar" />
            مراسم پیش رو
          </h3>
          <button className="link-more" onClick={() => navigate('events')}>
            همه مراسم‌ها <ChevronLeft size={14} />
          </button>
        </div>
        {eventsToShow.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="مراسمی ثبت نشده است"
            description="به‌زودی برنامه‌های جدید از سوی خادمان قرارگاه در این بخش اعلام می‌شود."
          />
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {eventsToShow.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isLive={event.startsAt <= now}
                onClick={() => navigate(`events/${event.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- News ---------- */}
      <section className="section">
        <div className="section-head">
          <h3 className="section-title">
            <span className="bar" />
            اخبار قرارگاه
          </h3>
          <button className="link-more" onClick={() => navigate('news')}>
            همه اخبار <ChevronLeft size={14} />
          </button>
        </div>
        {publishedNews.length === 0 ? (
          <EmptyState icon={<Newspaper size={24} />} title="هنوز خبری منتشر نشده است" />
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {topNews && (
              <article
                className="news-hero-card"
                onClick={() => navigate(`news/${topNews.id}`)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`news/${topNews.id}`)}
              >
                <SmartImage src={topNews.image} alt={topNews.title} />
                <div className="news-hero-content">
                  <div className="row wrap" style={{ gap: 6 }}>
                    {topNews.pinned && <span className="pin">★ خبر مهم</span>}
                    <span className="badge badge-green">
                      <Radio size={10} />
                      تازه‌ترین
                    </span>
                    <span className="dot-sep" />
                    <span className="tiny dim">{formatJalali(topNews.date, { year: false, weekday: false })}</span>
                  </div>
                  <h4 className="news-hero-title">{topNews.title}</h4>
                </div>
              </article>
            )}
            {restNews.map((item) => (
              <article
                key={item.id}
                className="glass card news-row"
                onClick={() => navigate(`news/${item.id}`)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`news/${item.id}`)}
              >
                <span className="news-row-thumb">
                  <SmartImage src={item.image} alt="" />
                </span>
                <div className="grow">
                  <div className="news-row-title">{item.title}</div>
                  <div className="news-row-meta">
                    <Clock3 size={11} />
                    {formatJalali(item.date, { weekday: false })}
                  </div>
                </div>
                <ChevronLeft size={17} style={{ flex: 'none', opacity: 0.5 }} />
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Reports ---------- */}
      <section className="section">
        <div className="section-head">
          <h3 className="section-title">
            <span className="bar" />
            گزارش‌های تصویری و صوتی
          </h3>
          <button className="link-more" onClick={() => navigate('reports')}>
            آرشیو گزارش‌ها <ChevronLeft size={14} />
          </button>
        </div>
        {latestReports.length === 0 ? (
          <EmptyState icon={<Images size={24} />} title="گزارشی منتشر نشده است" />
        ) : (
          <div className="report-grid">
            {latestReports.map((report) => (
              <button
                key={report.id}
                className="report-tile"
                onClick={() => navigate(`reports/${report.id}`)}
              >
                <SmartImage src={report.cover} alt="" />
                {!report.cover && (
                  <span className="report-placeholder">
                    {report.type === 'audio' ? <Headphones size={30} /> : report.type === 'video' ? <Video size={30} /> : <Images size={30} />}
                  </span>
                )}
                <span className="report-type-badge">
                  {report.type === 'audio' ? (
                    <>
                      <Headphones size={11} /> صوتی
                    </>
                  ) : report.type === 'video' ? (
                    <>
                      <Video size={11} /> ویدیو
                    </>
                  ) : (
                    <>
                      <Images size={11} /> عکس
                    </>
                  )}
                </span>
                <div className="report-tile-body">
                  <div className="report-tile-title">{report.title}</div>
                  <span className="tiny dim">{toFa(report.media.length)} رسانه</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Quick actions ---------- */}
      <section className="section">
        <h3 className="section-title">
          <span className="bar" />
          دسترسی سریع
        </h3>
        <div className="grid-2" style={{ gap: 10 }}>
          <QuickTile
            icon={<Users size={20} />}
            title="فرم همکاری"
            subtitle="خادم قرارگاه شوید"
            onClick={() => navigate('cooperate')}
          />
          <QuickTile
            icon={<HandHeart size={20} />}
            title="نذورات و کمک"
            subtitle="کارت، شبا یا پرداخت آنلاین"
            onClick={() => navigate('donate')}
          />
          <QuickTile
            icon={<PlayCircle size={20} />}
            title="گزارش‌ها"
            subtitle="عکس، صدا و ویدیو"
            onClick={() => navigate('reports')}
          />
          <QuickTile
            icon={<Share2 size={20} />}
            title="معرفی به دوستان"
            subtitle="دعوت از اهالی محله"
            onClick={async () => {
              const ok = await nativeShare(
                'قرارگاه مردمی مدافعان وطن — محله کرمان',
                'نرم‌افزار جامع قرارگاه؛ نذورات، مراسم و گزارش‌ها',
              )
              if (!ok) toast.show('برای اشتراک‌گذاری، آدرس برنامه را کپی کنید', 'info')
            }}
          />
        </div>
      </section>

      {nextEvent && (
        <div className="warn-note" style={{ alignItems: 'center' }}>
          <CalendarDays size={17} />
          <span>
            برنامه بعدی: <strong>{nextEvent.title}</strong> — {formatEventDate(nextEvent.startsAt)} در{' '}
            {nextEvent.location}
          </span>
        </div>
      )}

      <footer className="center tiny dim" style={{ padding: '10px 0 6px', lineHeight: 2.1 }}>
        {state.settings.orgName} — {state.settings.orgSubtitle}
        <br />
        ساخته‌شده با عشق برای اهالی محله · نسخه {toFa('1.0.0')}
        <br />
        <div className="row center" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="link-more"
            style={{ fontSize: '.74rem', padding: '6px 0' }}
            onClick={() => navigate('about')}
          >
            درباره قرارگاه و ارتباط با خادمان
            <ArrowUpLeft size={12} />
          </button>
          <span className="dot-sep" />
          <button
            className="link-more"
            style={{ fontSize: '.74rem', padding: '6px 0' }}
            onClick={() => navigate('admin')}
          >
            <ShieldCheck size={12} />
            بخش مدیریت
          </button>
        </div>
      </footer>
    </div>
  )
}

function HeroImage({ src, onFail }: { src: string; onFail: () => void }) {
  const [url, setUrl] = useState<string | undefined>()
  useEffect(() => {
    let alive = true
    resolveAsset(src)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && onFail())
    return () => {
      alive = false
    }
  }, [src, onFail])
  if (!url) return <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#0b3a2a,#04120d)' }} />
  return <img src={url} alt="" loading="eager" decoding="async" onError={onFail} />
}

function EventCard({ event, isLive, onClick }: { event: EventItem; isLive: boolean; onClick: () => void }) {
  return (
    <button className="glass card event-card" onClick={onClick} style={{ textAlign: 'right' }}>
      <span className="event-thumb">
        <SmartImage src={event.image} alt="" />
        {!event.image && (
          <span
            className="event-thumb placeholder"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', minHeight: 0 }}
          >
            <CalendarDays size={26} />
          </span>
        )}
      </span>
      <span className="event-info">
        <span className="row" style={{ gap: 6 }}>
          {isLive ? (
            <span className="badge badge-live">هم‌اکنون</span>
          ) : (
            <span className="countdown-pill">
              <Clock3 size={11} />
              {humanizeDistance(event.startsAt)}
            </span>
          )}
        </span>
        <span className="event-title">{truncate(event.title, 60)}</span>
        <span className="event-meta">
          <CalendarDays size={12} />
          {formatEventDate(event.startsAt)}
          <span className="dot-sep" />
          <MapPin size={12} />
          {truncate(event.location, 26)}
        </span>
      </span>
    </button>
  )
}

function QuickTile({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button className="glass card row" style={{ textAlign: 'right', gap: 11, padding: 13 }} onClick={onClick}>
      <span className="coop-icon" style={{ width: 38, height: 38, borderRadius: 12 }}>
        {icon}
      </span>
      <span className="col" style={{ gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: '.84rem', fontWeight: 700 }}>{title}</span>
        <span className="tiny dim">{subtitle}</span>
      </span>
    </button>
  )
}
