import { useMemo, useState } from 'react'
import {
  MessageSquareHeart,
  Trash2,
  Star,
  Phone,
  Circle,
  CheckCheck,
  Download,
  Search,
  MessagesSquare,
  Lightbulb,
  MessageCircleWarning,
  ThumbsUp,
} from 'lucide-react'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { formatJalali, formatTime, toFa } from '../../lib/jalali'
import type { MessageCategory } from '../../types'

const CATS: { id: MessageCategory | 'all'; label: string; icon: typeof MessagesSquare }[] = [
  { id: 'all', label: 'همه', icon: MessagesSquare },
  { id: 'contact', label: 'ارتباط', icon: MessagesSquare },
  { id: 'suggestion', label: 'پیشنهاد', icon: Lightbulb },
  { id: 'complaint', label: 'انتقاد', icon: MessageCircleWarning },
  { id: 'praise', label: 'تشکر', icon: ThumbsUp },
]

export function AdminMessages() {
  const { state, update } = useStore()
  const toast = useToast()
  const [cat, setCat] = useState<MessageCategory | 'all'>('all')
  const [query, setQuery] = useState('')

  const items = useMemo(
    () =>
      [...state.messages]
        .filter((m) => (cat === 'all' ? true : m.category === cat))
        .filter((m) => (query ? m.name.includes(query) || m.subject.includes(query) || m.body.includes(query) : true))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [state.messages, cat, query],
  )

  const unread = state.messages.filter((m) => !m.read).length

  const exportCsv = () => {
    const header = 'نوع,نام,موبایل,موضوع,پیام,تاریخ,وضعیت'
    const rows = state.messages.map((m) =>
      [m.category, m.name, m.phone, m.subject, m.body, formatJalali(m.createdAt), m.read ? 'خوانده‌شده' : 'جدید']
        .map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([`\uFEFF${header}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `messages-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('خروجی پیام‌ها دانلود شد')
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row-between">
        <h2 className="section-title">
          <span className="bar" />
          انتقادات و پیشنهادات ({toFa(state.messages.length)})
          {unread > 0 && <span className="badge badge-gold" style={{ fontSize: '.6rem' }}>{toFa(unread)} جدید</span>}
        </h2>
        <div className="row" style={{ gap: 5 }}>
          {unread > 0 && (
            <button
              className="mini-btn"
              onClick={() =>
                update((d) => {
                  d.messages.forEach((m) => {
                    m.read = true
                  })
                })
              }
              aria-label="همه خوانده شد"
              title="همه خوانده شد"
            >
              <CheckCheck size={14} />
            </button>
          )}
          {state.messages.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={exportCsv}>
              <Download size={14} />
              خروجی
            </button>
          )}
        </div>
      </div>

      <div className="row wrap" style={{ gap: 6 }}>
        {CATS.map((c) => {
          const Icon = c.icon
          return (
            <button key={c.id} className="chip chip-btn" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              <Icon size={12} />
              {c.label}
            </button>
          )
        })}
      </div>

      <div style={{ position: 'relative' }}>
        <input className="input" placeholder="جست‌وجو در پیام‌ها…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingRight: 42 }} />
        <Search size={16} style={{ position: 'absolute', right: 14, top: 15, opacity: 0.45 }} />
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <MessageSquareHeart size={24} />
          <strong>{state.messages.length === 0 ? 'پیامی دریافت نشده' : 'نتیجه‌ای یافت نشد'}</strong>
          <span className="tiny">پیام‌های ارسالی از بخش «ارتباط با خادمان» اینجا نمایش داده می‌شوند.</span>
        </div>
      ) : (
        <div className="col" style={{ gap: 9 }}>
          {items.map((m) => (
            <div
              key={m.id}
              className="glass card col"
              style={{ gap: 8, padding: 13, borderColor: m.read ? undefined : 'rgba(52,211,153,.4)' }}
            >
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div className="row" style={{ gap: 7, alignItems: 'flex-start' }}>
                  {!m.read && <Circle size={8} fill="#34d399" color="#34d399" style={{ marginTop: 7 }} />}
                  <div>
                    <div className="row" style={{ gap: 6 }}>
                      <strong style={{ fontSize: '.86rem' }}>{m.name}</strong>
                      <span className="badge badge-green" style={{ fontSize: '.58rem' }}>
                        {CATS.find((c) => c.id === m.category)?.label ?? 'پیام'}
                      </span>
                      {m.starred && <Star size={12} fill="#f5d78e" color="#f5d78e" />}
                    </div>
                    <div className="tiny dim">
                      {formatJalali(m.createdAt)} · ساعت {formatTime(m.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  {m.phone && (
                    <a className="mini-btn" href={`tel:${m.phone.replace(/[^\d+]/g, '')}`} aria-label="تماس">
                      <Phone size={13} />
                    </a>
                  )}
                  <button
                    className="mini-btn"
                    onClick={() =>
                      update((d) => {
                        const t = d.messages.find((x) => x.id === m.id)
                        if (t) t.starred = !t.starred
                      })
                    }
                    aria-label="ستاره"
                  >
                    <Star size={13} />
                  </button>
                  <button
                    className="mini-btn danger"
                    onClick={() =>
                      update((d) => {
                        d.messages = d.messages.filter((x) => x.id !== m.id)
                      })
                    }
                    aria-label="حذف"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div>
                <div className="small bold" style={{ marginBottom: 3 }}>{m.subject}</div>
                <p className="small muted" style={{ lineHeight: 1.95, whiteSpace: 'pre-line' }}>{m.body}</p>
              </div>
              <div className="row-between">
                {m.phone && <span className="tiny dim" dir="ltr">{toFa(m.phone)}</span>}
                <button
                  className="link-more"
                  onClick={() =>
                    update((d) => {
                      const t = d.messages.find((x) => x.id === m.id)
                      if (t) t.read = !t.read
                    })
                  }
                >
                  <CheckCheck size={12} />
                  {m.read ? 'علامت‌زدن به‌عنوان خوانده‌نشده' : 'خوانده شد'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
