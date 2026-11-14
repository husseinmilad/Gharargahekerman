import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  MapPin,
  Bell,
  BellOff,
  Navigation,
  UserRound,
  Sparkles,
  ChevronLeft,
  Hourglass,
} from 'lucide-react'
import { useStore, useNow } from '../lib/store'
import { useNavigate } from '../lib/router'
import { SmartImage } from '../components/SmartImage'
import { PageHeader } from '../components/Nav'
import { EmptyState } from '../components/EmptyState'
import { formatEventDate, formatJalali, humanizeDistance, toFa } from '../lib/jalali'
import { useToast } from '../lib/toast'
import { requestNotificationPermission, syncReminders } from '../lib/notifications'
import type { AppState, EventItem } from '../types'

type Filter = 'upcoming' | 'live' | 'past'

export function EventLength(toFaValue: number, minutes: number): string {
  if (minutes >= 1440) return `${toFaValue} روز قبل`
  if (minutes >= 60) return `${toFaValue} ساعت قبل`
  return `${toFaValue} دقیقه قبل`
}

export function remindLabel(minutes: number): string {
  const value = minutes >= 1440 ? minutes / 1440 : minutes >= 60 ? minutes / 60 : minutes
  const unit = minutes >= 1440 ? 'روز' : minutes >= 60 ? 'ساعت' : 'دقیقه'
  return `${toFa(value)} ${unit} قبل`
}

export function EventsPage() {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const now = useNow(30_000)
  const [filter, setFilter] = useState<Filter>('upcoming')

  const buckets = useMemo(() => {
    const live: EventItem[] = []
    const upcoming: EventItem[] = []
    const past: EventItem[] = []
    for (const e of [...state.events].sort((a, b) => a.startsAt - b.startsAt)) {
      const end = e.endsAt ?? e.startsAt + 2 * 3600_000
      if (end <= now) past.push(e)
      else if (e.startsAt <= now) live.push(e)
      else upcoming.push(e)
    }
    return { live, upcoming, past: past.reverse() }
  }, [state.events, now])

  const list = filter === 'live' ? buckets.live : filter === 'past' ? buckets.past : buckets.upcoming

  return (
    <div className="page">
      <PageHeader
        title="مراسم‌ها و برنامه‌ها"
        subtitle={
          buckets.live.length > 0
            ? `${toFa(buckets.live.length)} مراسم هم‌اکنون در حال برگزاری است`
            : `${toFa(buckets.upcoming.length)} برنامه پیش رو`
        }
        back="home"
      />

      <div className="segmented" role="tablist" aria-label="فیلتر مراسم">
        <button role="tab" aria-selected={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>
          پیش رو ({toFa(buckets.upcoming.length)})
        </button>
        <button role="tab" aria-selected={filter === 'live'} onClick={() => setFilter('live')}>
          در حال برگزاری ({toFa(buckets.live.length)})
        </button>
        <button role="tab" aria-selected={filter === 'past'} onClick={() => setFilter('past')}>
          گذشته ({toFa(buckets.past.length)})
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title={filter === 'past' ? 'مراسم گذشته‌ای ثبت نشده' : 'برنامه‌ای برای نمایش نیست'}
          description="خادمان قرارگاه به‌زودی برنامه‌های جدید را در این بخش اعلام می‌کنند."
        />
      ) : (
        <div className="col" style={{ gap: 12 }}>
          {list.map((event) => (
            <EventListCard key={event.id} event={event} now={now} onOpen={() => navigate(`events/${event.id}`)} />
          ))}
        </div>
      )}

      <div className="warn-note">
        <Bell size={16} />
        <span>با فعال‌کردن اعلان‌ها، پیش از شروع هر مراسم (بر اساس تنظیم خادمان) یادآوری دریافت می‌کنید.</span>
      </div>
    </div>
  )
}

function EventListCard({ event, now, onOpen }: { event: EventItem; now: number; onOpen: () => void }) {
  const { state, update } = useStore()
  const toast = useToast()
  const isLive = event.startsAt <= now
  const isPast = (event.endsAt ?? event.startsAt + 2 * 3600_000) <= now

  const toggleReminder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const perm = await requestNotificationPermission()
    const nextNotify = !event.notify
    update((d: AppState) => {
      const target = d.events.find((x) => x.id === event.id)
      if (target) target.notify = nextNotify
    })
    if (perm === 'granted') {
      await syncReminders(
        { ...state, events: state.events.map((x) => (x.id === event.id ? { ...x, notify: nextNotify } : x)) },
        true,
      )
      toast.success(nextNotify ? 'یادآوری این مراسم روشن شد' : 'یادآوری این مراسم خاموش شد')
    } else {
      toast.error('اجازه اعلان داده نشد؛ از تنظیمات مرورگر اجازه بدهید')
    }
  }

  return (
    <article
      className="glass card"
      style={{ padding: 0, opacity: isPast ? 0.72 : 1 }}
      onClick={onOpen}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div style={{ position: 'relative', aspectRatio: '16/7.6', overflow: 'hidden' }}>
        {event.image ? (
          <SmartImage src={event.image} alt={event.title} />
        ) : (
          <div className="report-placeholder" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <CalendarDays size={34} />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,18,13,.05) 40%, rgba(6,26,19,.92) 100%)' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
          {isLive ? (
            <span className="badge badge-live">در حال برگزاری</span>
          ) : isPast ? (
            <span className="badge badge-green">برگزار شد</span>
          ) : (
            <span className="badge badge-gold">
              <Hourglass size={10} />
              {humanizeDistance(event.startsAt, now)}
            </span>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 14, left: 14 }}>
          <h3 style={{ fontSize: '1rem', lineHeight: 1.7, textShadow: '0 2px 12px rgba(0,0,0,.6)' }}>{event.title}</h3>
        </div>
      </div>

      <div style={{ padding: '11px 14px 13px' }} className="col">
        <div className="event-meta" style={{ fontSize: '.79rem' }}>
          <CalendarDays size={13} />
          {formatEventDate(event.startsAt)}
          <span className="dot-sep" />
          <MapPin size={13} />
          {event.location}
        </div>
        {event.speaker && (
          <div className="event-meta" style={{ fontSize: '.76rem' }}>
            <UserRound size={13} />
            {event.speaker}
          </div>
        )}
        <p className="small muted" style={{ lineHeight: 1.9 }}>
          {event.description.length > 150 ? `${event.description.slice(0, 150)}…` : event.description}
        </p>
        <div className="row-between">
          <span className="row tiny dim" style={{ gap: 5 }}>
            {event.notify ? <Bell size={13} /> : <BellOff size={13} />}
            {event.notify ? `یادآوری ${remindLabel(event.reminderMinutes)}` : 'یادآوری خاموش است'}
          </span>
          <div className="row" style={{ gap: 6 }}>
            {!isPast && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={toggleReminder}
                style={{ padding: '7px 11px', minHeight: 34 }}
                aria-label="تغییر وضعیت یادآوری"
              >
                {event.notify ? <BellOff size={14} /> : <Bell size={14} />}
              </button>
            )}
            <span className="link-more">
              جزئیات <ChevronLeft size={13} />
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

export function EventDetailPage({ id }: { id: string }) {
  const { state, update } = useStore()
  const { navigate } = useNavigate()
  const now = useNow(30_000)
  const toast = useToast()
  const event = state.events.find((e) => e.id === id)

  if (!event) {
    return (
      <div className="page">
        <PageHeader title="مراسم یافت نشد" back="events" />
        <EmptyState
          title="این مراسم حذف شده یا در دسترس نیست"
          action={
            <button className="btn btn-primary" onClick={() => navigate('events')}>
              بازگشت به مراسم‌ها
            </button>
          }
        />
      </div>
    )
  }

  const isUpcoming = event.startsAt > now
  const isLive = event.startsAt <= now && (event.endsAt ?? event.startsAt + 7200000) > now

  const setReminder = async (minutes: number) => {
    const perm = await requestNotificationPermission()
    const next = { ...event, notify: true, reminderMinutes: minutes }
    update((d: AppState) => {
      const target = d.events.find((x) => x.id === event.id)
      if (target) {
        target.notify = true
        target.reminderMinutes = minutes
      }
    })
    if (perm === 'granted') {
      await syncReminders({ ...state, events: state.events.map((x) => (x.id === event.id ? next : x)) }, true)
      toast.success('یادآوری این مراسم تنظیم شد')
    } else {
      toast.error('برای دریافت اعلان، اجازه دسترسی لازم است')
    }
  }

  const toggleNotify = async () => {
    const nextNotify = !event.notify
    update((d: AppState) => {
      const target = d.events.find((x) => x.id === event.id)
      if (target) target.notify = nextNotify
    })
    if (nextNotify) {
      const perm = await requestNotificationPermission()
      if (perm !== 'granted') toast.error('برای دریافت اعلان، اجازه دسترسی لازم است')
      else await syncReminders({ ...state, events: state.events.map((x) => (x.id === event.id ? { ...x, notify: true } : x)) }, true)
    } else {
      toast.success('یادآوری خاموش شد')
    }
  }

  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(event.location)}`
  const gcalDate = (ts: number) => new Date(ts).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const calendarUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${gcalDate(event.startsAt)}/${gcalDate(event.endsAt ?? event.startsAt + 7200000)}` +
    `&details=${encodeURIComponent(event.description)}` +
    `&location=${encodeURIComponent(event.location)}`

  return (
    <div className="page">
      <PageHeader title="جزئیات مراسم" back="events" />
      <div className="detail-cover" style={{ marginTop: -18 }}>
        <SmartImage src={event.image} alt={event.title} />
      </div>
      <div style={{ marginTop: -22, position: 'relative', zIndex: 2 }} className="col">
        <div className="row wrap" style={{ gap: 7 }}>
          {isLive ? (
            <span className="badge badge-live">در حال برگزاری</span>
          ) : isUpcoming ? (
            <span className="badge badge-gold">{humanizeDistance(event.startsAt, now)}</span>
          ) : (
            <span className="badge badge-green">برگزار شده</span>
          )}
          <span className="badge badge-green">{formatJalali(event.startsAt)}</span>
        </div>
        <h2 style={{ fontSize: '1.25rem', lineHeight: 1.65 }}>{event.title}</h2>
        <p className="prose">{event.description}</p>
      </div>

      <div className="glass card col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 11 }}>
          <span className="coop-icon">
            <Clock3 size={18} />
          </span>
          <div>
            <div className="tiny dim">زمان شروع</div>
            <div className="bold" style={{ fontSize: '.9rem' }}>
              {formatEventDate(event.startsAt)}
            </div>
          </div>
        </div>
        {event.endsAt && (
          <div className="row" style={{ gap: 11 }}>
            <span className="coop-icon">
              <Hourglass size={18} />
            </span>
            <div>
              <div className="tiny dim">زمان پایان تقریبی</div>
              <div className="bold" style={{ fontSize: '.9rem' }}>
                {formatEventDate(event.endsAt)}
              </div>
            </div>
          </div>
        )}
        <div className="divider" />
        <div className="row" style={{ gap: 11 }}>
          <span className="coop-icon">
            <MapPin size={18} />
          </span>
          <div className="grow">
            <div className="tiny dim">محل برگزاری</div>
            <div className="bold" style={{ fontSize: '.9rem' }}>
              {event.location}
            </div>
          </div>
          <a className="btn btn-ghost btn-sm" href={mapUrl} target="_blank" rel="noopener noreferrer">
            <Navigation size={14} />
            مسیر
          </a>
        </div>
        {event.speaker && (
          <>
            <div className="divider" />
            <div className="row" style={{ gap: 11 }}>
              <span className="coop-icon">
                <UserRound size={18} />
              </span>
              <div>
                <div className="tiny dim">سخنران / مجری</div>
                <div className="bold" style={{ fontSize: '.9rem' }}>
                  {event.speaker}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {isUpcoming && (
        <div className="form-section">
          <div className="form-section-title">
            <Bell size={16} />
            یادآوری پیش از مراسم
          </div>
          <p className="tiny dim" style={{ marginTop: -6 }}>
            زمان دلخواه خود را انتخاب کنید؛ اعلان در همان لحظه برای شما ارسال می‌شود.
          </p>
          <div className="row wrap" style={{ gap: 7 }}>
            {state.settings.notifications.leadOptions.map((m) => (
              <button
                key={m}
                className="chip chip-btn"
                aria-pressed={event.notify && event.reminderMinutes === m}
                onClick={() => setReminder(m)}
              >
                {remindLabel(m)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={toggleNotify} style={{ alignSelf: 'flex-start' }}>
            {event.notify ? <BellOff size={15} /> : <Bell size={15} />}
            {event.notify ? 'خاموش کردن یادآوری' : 'روشن کردن یادآوری'}
          </button>
        </div>
      )}

      <a className="btn btn-ghost" href={calendarUrl} target="_blank" rel="noopener noreferrer">
        <Sparkles size={16} />
        افزودن به تقویم گوگل
      </a>
    </div>
  )
}
