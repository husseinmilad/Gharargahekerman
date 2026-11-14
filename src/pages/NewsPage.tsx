import { useMemo, useState } from 'react'
import { Newspaper, Clock3, ChevronLeft, Tag, Pin, Share2, Search, Link2, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNavigate } from '../lib/router'
import { SmartImage } from '../components/SmartImage'
import { PageHeader } from '../components/Nav'
import { EmptyState } from '../components/EmptyState'
import { formatJalali, formatTime } from '../lib/jalali'
import { truncate } from '../lib/format'
import { nativeShare, copyText } from '../lib/clipboard'
import { useToast } from '../lib/toast'

export function NewsPage() {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const [tag, setTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    state.news.filter((n) => n.published).forEach((n) => n.tags.forEach((t) => set.add(t)))
    return [...set].slice(0, 8)
  }, [state.news])

  const items = useMemo(() => {
    const q = query.trim()
    return [...state.news]
      .filter((n) => n.published)
      .filter((n) => (tag ? n.tags.includes(tag) : true))
      .filter((n) => (q ? n.title.includes(q) || n.summary.includes(q) || n.body.includes(q) : true))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return +new Date(b.date) - +new Date(a.date)
      })
  }, [state.news, tag, query])

  return (
    <div className="page">
      <PageHeader title="اخبار و اطلاعیه‌ها" subtitle={`${items.length} مورد`} back="home" />

      <div style={{ position: 'relative' }}>
        <input
          className="input"
          placeholder="جست‌وجو در اخبار…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingRight: 44 }}
          inputMode="search"
        />
        <Search size={17} style={{ position: 'absolute', right: 15, top: 15, opacity: 0.5 }} />
      </div>

      {allTags.length > 0 && (
        <div className="row wrap" style={{ gap: 7 }}>
          <button className="chip chip-btn" aria-pressed={tag === null} onClick={() => setTag(null)}>
            همه
          </button>
          {allTags.map((t) => (
            <button key={t} className="chip chip-btn" aria-pressed={tag === t} onClick={() => setTag(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={26} />}
          title={query ? 'نتیجه‌ای یافت نشد' : 'خبری منتشر نشده است'}
          description={query ? 'عبارت دیگری را جست‌وجو کنید.' : 'اخبار جدید قرارگاه در این بخش منتشر می‌شود.'}
        />
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {items.map((item) => (
            <article
              key={item.id}
              className="glass card news-row"
              onClick={() => navigate(`news/${item.id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`news/${item.id}`)}
            >
              <span className="news-row-thumb" style={{ width: 86, height: 86 }}>
                <SmartImage src={item.image} alt="" />
              </span>
              <div className="grow">
                {item.pinned && (
                  <span className="pin" style={{ marginBottom: 4 }}>
                    <Pin size={10} /> مهم
                  </span>
                )}
                <div className="news-row-title">{truncate(item.title, 72)}</div>
                <div className="news-row-meta">
                  <Clock3 size={11} />
                  {formatJalali(item.date, { year: false })}
                  {item.tags[0] && (
                    <>
                      <span className="dot-sep" />
                      <Tag size={11} />
                      {item.tags[0]}
                    </>
                  )}
                </div>
              </div>
              <ChevronLeft size={17} style={{ flex: 'none', opacity: 0.5 }} />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export function NewsDetailPage({ id }: { id: string }) {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const item = state.news.find((n) => n.id === id)

  if (!item || !item.published) {
    return (
      <div className="page">
        <PageHeader title="خبر یافت نشد" back="news" />
        <EmptyState
          title="این خبر در دسترس نیست"
          action={<button className="btn btn-primary" onClick={() => navigate('news')}>بازگشت به اخبار</button>}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="خبر قرارگاه" back="news" />
      <div className="detail-cover" style={{ marginTop: -18 }}>
        <SmartImage src={item.image} alt={item.title} />
      </div>
      <div style={{ marginTop: -22, position: 'relative', zIndex: 2 }} className="col">
        <div className="row wrap" style={{ gap: 7 }}>
          <span className="badge badge-green">
            <Clock3 size={10} />
            {formatJalali(item.date)}
          </span>
          <span className="tiny dim">ساعت {formatTime(item.date)}</span>
          {item.pinned && <span className="pin">★ خبر مهم</span>}
        </div>
        <h2 style={{ fontSize: '1.3rem', lineHeight: 1.7 }}>{item.title}</h2>
        <p className="muted" style={{ fontSize: '.9rem', lineHeight: 2 }}>
          {item.summary}
        </p>
      </div>

      <div className="divider" />

      <div className="prose">{item.body}</div>

      {item.tags.length > 0 && (
        <div className="row wrap" style={{ gap: 6 }}>
          {item.tags.map((t) => (
            <span key={t} className="chip" style={{ fontSize: '.74rem' }}>
              <Tag size={11} /> {t}
            </span>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ gap: 9 }}>
        <button
          className="btn btn-ghost"
          onClick={async () => {
            const ok = await nativeShare(item.title, item.summary)
            if (!ok) {
              const link = `${window.location.origin}${window.location.pathname}#/news/${item.id}`
              const copied = await copyText(link)
              toast[copied ? 'success' : 'error'](copied ? 'لینک خبر کپی شد' : 'اشتراک‌گذاری پشتیبانی نمی‌شود')
            }
          }}
        >
          <Share2 size={16} />
          اشتراک‌گذاری خبر
        </button>
        <button
          className="btn btn-ghost"
          onClick={async () => {
            const ok = await copyText(`${item.title}\n${item.summary}\n${window.location.href}`)
            setCopied(ok)
            toast[ok ? 'success' : 'error'](ok ? 'متن خبر برای ارسال در پیام‌رسان کپی شد' : 'کپی ناموفق بود')
            window.setTimeout(() => setCopied(false), 1800)
          }}
        >
          {copied ? <Check size={16} /> : <Link2 size={16} />}
          {copied ? 'کپی شد' : 'کپی برای پیام‌رسان'}
        </button>
      </div>
    </div>
  )
}
