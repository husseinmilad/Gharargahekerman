import { useEffect, useState } from 'react'
import { Bell, BellRing, BellOff, CalendarClock, CheckCheck, Smartphone, Info, Send } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader } from '../components/Nav'
import { formatEventDate, formatJalali, humanizeDistance, toFa } from '../lib/jalali'
import {
  getPermissionState,
  requestNotificationPermission,
  sendTestNotification,
  syncReminders,
  pendingReminders,
  isNativeApp,
} from '../lib/notifications'
import type { PermissionState } from '../lib/notifications'
import { useToast } from '../lib/toast'

export function NotificationsPage() {
  const { state } = useStore()
  const toast = useToast()
  const [perm, setPerm] = useState<PermissionState>('prompt')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getPermissionState().then(setPerm).catch(() => setPerm('unsupported'))
  }, [])

  const reminders = pendingReminders(state)

  const ask = async () => {
    setBusy(true)
    const res = await requestNotificationPermission()
    setPerm(res)
    if (res === 'granted') {
      await syncReminders(state, true)
      toast.success('اعلان‌ها فعال شد')
    } else if (res === 'denied') {
      toast.error('اجازه اعلان داده نشد؛ از تنظیمات مرورگر یا گوشی اجازه بدهید')
    }
    setBusy(false)
  }

  return (
    <div className="page">
      <PageHeader title="اعلان‌ها" subtitle="یادآوری مراسم‌ها و خبرهای مهم" back="home" />

      <div className="glass card col" style={{ gap: 13 }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="coop-icon" style={{ width: 46, height: 46 }}>
            {perm === 'granted' ? <BellRing size={21} /> : perm === 'denied' ? <BellOff size={21} /> : <Bell size={21} />}
          </span>
          <div className="grow">
            <div className="bold" style={{ fontSize: '.94rem' }}>
              {perm === 'granted' ? 'اعلان‌ها فعال است' : perm === 'denied' ? 'اعلان‌ها مسدود شده' : 'اعلان‌ها غیرفعال است'}
            </div>
            <div className="tiny dim" style={{ lineHeight: 1.85 }}>
              {perm === 'granted'
                ? 'پیش از شروع هر مراسم (با هماهنگی خادمان) یادآوری دریافت می‌کنید.'
                : perm === 'denied'
                  ? 'برای فعال‌سازی، از تنظیمات مرورگر یا گوشی اجازه اعلان را به برنامه بدهید.'
                  : 'با فعال‌سازی اعلان، هیچ مراسمی را از دست نمی‌دهید.'}
            </div>
          </div>
        </div>

        {perm !== 'granted' && (
          <button className="btn btn-primary btn-block" onClick={ask} disabled={busy || perm === 'unsupported'}>
            <BellRing size={17} />
            {busy ? 'در حال فعال‌سازی…' : 'فعال‌سازی اعلان‌ها'}
          </button>
        )}

        {perm === 'granted' && (
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost grow btn-sm" onClick={async () => {
              await syncReminders(state, true)
              toast.success('یادآوری‌ها بازتنظیم شد')
            }}>
              <CheckCheck size={15} />
              بازتنظیم یادآوری‌ها
            </button>
            <button className="btn btn-outline grow btn-sm" onClick={async () => {
              const ok = await sendTestNotification()
              toast[ok ? 'success' : 'error'](ok ? 'اعلان آزمایشی ارسال شد' : 'ارسال اعلان آزمایشی ناموفق بود')
            }}>
              <Send size={15} />
              اعلان آزمایشی
            </button>
          </div>
        )}

        <div className="tiny dim row" style={{ gap: 6 }}>
          <Smartphone size={13} />
          {isNativeApp() ? 'نسخه اندروید — اعلان بومی' : 'نسخه وب/نصب‌شده (PWA) — اعلان مرورگر'}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          <span className="bar" />
          یادآوری‌های آینده
        </h3>
        {reminders.length === 0 ? (
          <div className="empty-state">
            <CalendarClock size={24} />
            <strong>یادآوری برنامه‌ریزی‌شده‌ای نیست</strong>
            <span className="tiny">برای مراسم پیش رو، از صفحه هر مراسم یادآوری تنظیم کنید.</span>
          </div>
        ) : (
          <div className="col" style={{ gap: 8 }}>
            {reminders.map(({ event, at, sent }) => (
              <div key={event.id} className="admin-row">
                <span className="admin-row-thumb" style={{ display: 'grid', placeItems: 'center' }}>
                  <Bell size={17} />
                </span>
                <div className="admin-row-main">
                  <div className="admin-row-title">{event.title}</div>
                  <div className="admin-row-sub">
                    {formatEventDate(event.startsAt)} · {humanizeDistance(event.startsAt)}
                  </div>
                  <div className="tiny" style={{ color: sent ? '#9ff5d5' : 'rgba(212,235,225,.56)', marginTop: 2 }}>
                    {sent ? '✓ یادآوری تنظیم شد' : 'در انتظار فعال‌سازی اعلان'}
                    {' · '}
                    {formatJalali(at, { weekday: false })} ساعت {toFa(new Date(at).getHours().toString().padStart(2, '0'))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h3 className="section-title">
          <span className="bar" />
          اعلان‌های قرارگاه
        </h3>
        {state.notificationsLog.length === 0 ? (
          <div className="empty-state">اعلانی ثبت نشده است.</div>
        ) : (
          <div className="col" style={{ gap: 8 }}>
            {state.notificationsLog.map((n) => (
              <div key={n.id} className="glass card" style={{ padding: 13 }}>
                <div className="row-between" style={{ gap: 8 }}>
                  <strong style={{ fontSize: '.86rem' }}>{n.title}</strong>
                  <span className="tiny dim">{humanizeDistance(new Date(n.createdAt).getTime())}</span>
                </div>
                <p className="tiny muted" style={{ marginTop: 4, lineHeight: 1.9 }}>
                  {n.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="warn-note">
        <Info size={16} />
        <span>
          ناموفق‌بودن اعلان در بعضی مرورگرها به تنظیمات «مزاحم نشوید» یا باتری‌کم‌کن گوشی مربوط است. در
          نسخه اندروید (APK) اعلان‌ها به‌صورت بومی و حتی در حالت بسته‌بودن برنامه ارسال می‌شوند.
        </span>
      </div>
    </div>
  )
}
