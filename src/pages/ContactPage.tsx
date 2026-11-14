import { useMemo, useState } from 'react'
import {
  Phone,
  MessageSquareHeart,
  ThumbsUp,
  MessageCircleWarning,
  Lightbulb,
  Clock3,
  Send,
  CheckCheck,
  MapPin,
  Navigation,
  PhoneCall,
  Info,
  MessagesSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader } from '../components/Nav'
import { useToast } from '../lib/toast'
import { uid } from '../lib/id'
import { formatJalali, toFa } from '../lib/jalali'
import type { MessageCategory } from '../types'

const CATEGORIES: { id: MessageCategory; label: string; icon: LucideIcon; desc: string }[] = [
  { id: 'contact', label: 'ارتباط با خادمان', icon: MessagesSquare, desc: 'سؤال، هماهنگی یا پیگیری' },
  { id: 'suggestion', label: 'پیشنهاد', icon: Lightbulb, desc: 'ایده برای بهتر شدن برنامه‌ها' },
  { id: 'complaint', label: 'انتقاد', icon: MessageCircleWarning, desc: 'نقد منصفانه و دغدغه‌ها' },
  { id: 'praise', label: 'تشکر', icon: ThumbsUp, desc: 'قدردانی از خادمان' },
]

export function ContactPage() {
  const { state, update } = useStore()
  const toast = useToast()
  const [category, setCategory] = useState<MessageCategory>('contact')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState('')
  const [sentRef, setSentRef] = useState('')

  const myMessages = useMemo(
    () =>
      [...state.messages]
        .filter((m) => phone.replace(/\D/g, '').length >= 10 && m.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 4),
    [state.messages, phone],
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!anonymous && name.trim().length < 3) {
      setError('نام خود را وارد کنید یا گزینه ارسال ناشناس را بزنید.')
      return
    }
    if (body.trim().length < 10) {
      setError('متن پیام باید حداقل ۱۰ حرف باشد.')
      return
    }
    if (phone && !/^09\d{9}$/.test(phone.replace(/\D/g, ''))) {
      setError('شماره موبایل معتبر نیست (۰۹…).')
      return
    }
    setError('')
    const id = uid('msg')
    update((d) => {
      d.messages.unshift({
        id,
        category,
        name: anonymous ? 'ناشناس' : name.trim(),
        phone: phone.trim(),
        subject: subject.trim() || CATEGORIES.find((c) => c.id === category)?.label || 'پیام',
        body: body.trim(),
        createdAt: new Date().toISOString(),
        read: false,
        starred: false,
      })
      d.notificationsLog.unshift({
        id: uid('n'),
        title: `پیام جدید: ${CATEGORIES.find((c) => c.id === category)?.label}`,
        body: body.trim().slice(0, 90),
        kind: 'system',
        createdAt: new Date().toISOString(),
        sentBy: 'system',
      })
    })
    setSentRef(id.slice(-6).toUpperCase())
    setBody('')
    setSubject('')
    toast.success('پیام شما برای خادمان ثبت شد')
  }

  const address = state.settings.address
  const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`

  return (
    <div className="page">
      <PageHeader title="ارتباط با خادمان" subtitle="گفت‌وگو، انتقاد و پیشنهاد" back="cooperate" />

      <div className="glass card">
        <div className="row" style={{ gap: 11, alignItems: 'flex-start' }}>
          <span className="coop-icon">
            <MessageSquareHeart size={19} />
          </span>
          <p className="small muted" style={{ lineHeight: 2 }}>
            قرارگاه از آنِ اهالی محله است؛ هر انتقاد، پیشنهاد یا پیامی که بنویسید، در جلسه هفتگی
            خادمان خوانده و پیگیری می‌شود. برای پیگیری رسمی، شماره تماس خود را وارد کنید.
          </p>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          <span className="bar" />
          خادمان پاسخگو
        </h3>
        {state.contactChannels.length === 0 ? (
          <div className="empty-state">شماره تماسی ثبت نشده است.</div>
        ) : (
          <div className="col" style={{ gap: 9 }}>
            {state.contactChannels.map((ch) => (
              <div key={ch.id} className="glass card contact-card">
                <span className="avatar-circle">{ch.name.slice(0, 1)}</span>
                <div className="grow">
                  <div className="small bold">{ch.role}</div>
                  <div className="tiny dim">{ch.name} · {ch.hours}</div>
                </div>
                <a className="icon-btn" href={`tel:${ch.phone.replace(/[^\d+]/g, '')}`} aria-label={`تماس با ${ch.role}`}>
                  <PhoneCall size={17} />
                </a>
              </div>
            ))}
          </div>
        )}
        <div className="glass card col" style={{ gap: 9 }}>
          <div className="row" style={{ gap: 8 }}>
            <MapPin size={17} style={{ color: '#f5d78e' }} />
            <strong style={{ fontSize: '.86rem' }}>نشانی قرارگاه</strong>
          </div>
          <p className="small muted" style={{ lineHeight: 1.95 }}>
            {address}
            <br />
            <span className="tiny dim">{state.settings.locationNote}</span>
          </p>
          <div className="row" style={{ gap: 8 }}>
            <Clock3 size={15} style={{ color: '#9ff5d5' }} />
            <span className="tiny">{state.settings.workHours}</span>
          </div>
          <a className="btn btn-ghost btn-sm" href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start' }}>
            <Navigation size={14} />
            مشاهده روی نقشه
          </a>
        </div>
      </div>

      <div className="divider" />

      <form onSubmit={submit} className="col" style={{ gap: 13 }}>
        <div className="form-section">
          <div className="form-section-title">
            <MessagesSquare size={16} />
            پیام خود را بنویسید
          </div>
          <div className="field">
            <span className="label">موضوع پیام</span>
            <div className="segmented" role="tablist" style={{ flexWrap: 'wrap' }}>
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                return (
                  <button
                    type="button"
                    key={c.id}
                    role="tab"
                    aria-selected={category === c.id}
                    onClick={() => setCategory(c.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                  >
                    <Icon size={13} />
                    {c.label}
                  </button>
                )
              })}
            </div>
            <span className="hint">{CATEGORIES.find((c) => c.id === category)?.desc}</span>
          </div>

          <div className="row-between" style={{ padding: '2px 0' }}>
            <span className="label">ارسال به‌صورت ناشناس</span>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={anonymous}
              aria-label="ارسال ناشناس"
              onClick={() => setAnonymous((v) => !v)}
            />
          </div>

          {!anonymous && (
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="field">
                <label htmlFor="c-name">نام شما</label>
                <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی" />
              </div>
              <div className="field">
                <label htmlFor="c-phone">شماره تماس</label>
                <input
                  id="c-phone"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹…"
                  inputMode="tel"
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="c-subject">عنوان (اختیاری)</label>
            <input id="c-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="خلاصه‌ای از پیام شما" />
          </div>

          <div className="field">
            <label htmlFor="c-body">متن پیام *</label>
            <textarea
              id="c-body"
              className="textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="هر چه در دل دارید بنویسید؛ پیشنهاد، انتقاد یا پیام دوستانه…"
              rows={5}
              maxLength={1500}
            />
            <span className="hint">{toFa(body.length)} از ۱۵۰۰ حرف</span>
          </div>

          {error && (
            <div className="warn-note" style={{ borderColor: 'rgba(251,113,133,.4)', background: 'rgba(251,113,133,.1)', color: '#ffd9de' }}>
              <Info size={15} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block">
            <Send size={17} />
            ارسال پیام به خادمان
          </button>

          {sentRef && (
            <div className="row center" style={{ gap: 6, justifyContent: 'center', color: '#9ff5d5', fontSize: '.78rem' }}>
              <CheckCheck size={15} /> کد پیگیری پیام شما: {sentRef}
            </div>
          )}
        </div>
      </form>

      {myMessages.length > 0 && (
        <div className="section">
          <h3 className="section-title">
            <span className="bar" />
            پیام‌های اخیر شما
          </h3>
          {myMessages.map((m) => (
            <div key={m.id} className="admin-row">
              <span className="admin-row-thumb" style={{ display: 'grid', placeItems: 'center' }}>
                <MessageCircleWarning size={17} />
              </span>
              <div className="admin-row-main">
                <div className="admin-row-title">{m.subject}</div>
                <div className="admin-row-sub">{formatJalali(m.createdAt)} · {m.read ? 'خوانده شد' : 'در انتظار بررسی'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="warn-note">
        <Phone size={16} />
        <span>
          در موارد فوری (مثل نیاز به کمک فوری در محله) حتماً با شماره‌های بالا تماس بگیرید؛ پیام‌های این
          بخش در ساعات اداری بررسی می‌شوند.
        </span>
      </div>
    </div>
  )
}
