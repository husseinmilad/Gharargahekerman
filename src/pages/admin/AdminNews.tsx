import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Pin, Send, Search, Newspaper, Save, X } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { uid } from '../../lib/id'
import { formatJalali, toFa } from '../../lib/jalali'
import { notifyNow } from '../../lib/notifications'
import type { NewsItem } from '../../types'
import { AdminField, ImagePicker, Toggle } from './ui'
import { ConfirmDialog } from '../../components/Sheet'
import { SmartImage } from '../../components/SmartImage'

export function AdminNews() {
  const { state, update } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState<NewsItem | null>(null)

  const items = [...state.news]
    .filter((n) => (query ? n.title.includes(query) || n.summary.includes(query) : true))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const startNew = () => {
    setEditing({
      id: '',
      title: '',
      summary: '',
      body: '',
      image: undefined,
      date: new Date().toISOString(),
      tags: [],
      pinned: false,
      published: true,
    })
  }

  const save = (item: NewsItem, publishNow: boolean) => {
    if (item.title.trim().length < 4) {
      toast.error('عنوان خبر را کامل کنید')
      return
    }
    const isNew = !item.id
    const final: NewsItem = { ...item, id: item.id || uid('news'), date: item.date || new Date().toISOString() }
    update((d) => {
      if (isNew) d.news.unshift(final)
      else {
        const idx = d.news.findIndex((n) => n.id === final.id)
        if (idx >= 0) d.news[idx] = final
      }
      if (isNew && final.published) {
        d.notificationsLog.unshift({
          id: uid('n'),
          title: 'خبر جدید منتشر شد',
          body: final.title,
          kind: 'news',
          createdAt: new Date().toISOString(),
          sentBy: 'admin',
        })
      }
    })
    if (isNew && final.published && publishNow) {
      void notifyNow('خبر جدید قرارگاه', final.title, `news-${final.id}`)
      toast.success('خبر منتشر و اعلان ارسال شد')
    } else {
      toast.success(isNew ? 'خبر افزوده شد' : 'خبر به‌روزرسانی شد')
    }
    setEditing(null)
  }

  const remove = (item: NewsItem) => {
    update((d) => {
      d.news = d.news.filter((n) => n.id !== item.id)
    })
    setToDelete(null)
    toast.success('خبر حذف شد')
  }

  if (editing) {
    return <NewsForm item={editing} onCancel={() => setEditing(null)} onSave={save} />
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row-between">
        <h2 className="section-title">
          <span className="bar" />
          مدیریت اخبار ({toFa(items.length)})
        </h2>
        <button className="btn btn-primary btn-sm" onClick={startNew}>
          <Plus size={15} />
          خبر جدید
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          className="input"
          placeholder="جست‌وجوی خبر…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingRight: 42 }}
        />
        <Search size={16} style={{ position: 'absolute', right: 14, top: 15, opacity: 0.45 }} />
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Newspaper size={24} />
          <strong>خبری ثبت نشده است</strong>
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            <Plus size={14} /> افزودن اولین خبر
          </button>
        </div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {items.map((item) => (
            <div key={item.id} className="admin-row">
              <span className="admin-row-thumb">
                <SmartImage src={item.image} alt="" />
              </span>
              <div className="admin-row-main">
                <div className="admin-row-title">
                  {item.pinned && '📌 '}
                  {item.title}
                </div>
                <div className="admin-row-sub">
                  {formatJalali(item.date, { year: false })}
                  <span className={`badge ${item.published ? 'badge-green' : 'badge-gold'}`} style={{ marginRight: 6, fontSize: '.6rem' }}>
                    {item.published ? 'منتشرشده' : 'پیش‌نویس'}
                  </span>
                </div>
              </div>
              <div className="admin-actions">
                <button
                  className="mini-btn"
                  onClick={() =>
                    update((d) => {
                      const n = d.news.find((x) => x.id === item.id)
                      if (n) n.published = !n.published
                    })
                  }
                  aria-label={item.published ? 'لغو انتشار' : 'انتشار'}
                >
                  {item.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  className="mini-btn"
                  onClick={() =>
                    update((d) => {
                      const n = d.news.find((x) => x.id === item.id)
                      if (n) n.pinned = !n.pinned
                    })
                  }
                  aria-label="سنجاق"
                >
                  <Pin size={14} />
                </button>
                <button className="mini-btn" onClick={() => setEditing(item)} aria-label="ویرایش">
                  <Pencil size={14} />
                </button>
                <button className="mini-btn danger" onClick={() => setToDelete(item)} aria-label="حذف">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف خبر"
        body={`آیا از حذف «${toDelete?.title ?? ''}» مطمئن هستید؟ این کار قابل بازگشت نیست.`}
        confirmLabel="حذف کن"
        danger
        onConfirm={() => toDelete && remove(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

function NewsForm({
  item,
  onCancel,
  onSave,
}: {
  item: NewsItem
  onCancel: () => void
  onSave: (item: NewsItem, publishNow: boolean) => void
}) {
  const [draft, setDraft] = useState<NewsItem>(item)
  const [tagInput, setTagInput] = useState(item.tags.join('، '))
  const set = <K extends keyof NewsItem>(key: K, value: NewsItem[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="col" style={{ gap: 13 }}>
      <div className="row-between">
        <h2 style={{ fontSize: '1rem' }}>{item.id ? 'ویرایش خبر' : 'خبر جدید'}</h2>
        <button className="icon-btn" onClick={onCancel} aria-label="بستن">
          <X size={17} />
        </button>
      </div>

      <div className="form-section">
        <AdminField label="عنوان خبر" required>
          <input className="input" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="عنوان کوتاه و گویا" />
        </AdminField>
        <AdminField label="خلاصه خبر" hint="در فهرست اخبار نمایش داده می‌شود.">
          <textarea className="textarea" style={{ minHeight: 80 }} value={draft.summary} onChange={(e) => set('summary', e.target.value)} rows={2} />
        </AdminField>
        <AdminField label="متن کامل خبر" hint="می‌توانید از خط جدید برای پاراگراف‌بندی استفاده کنید.">
          <textarea className="textarea" value={draft.body} onChange={(e) => set('body', e.target.value)} rows={7} />
        </AdminField>
        <AdminField label="برچسب‌ها" hint="با «،» جدا کنید. مثلاً: پویش، خدمات محله">
          <input
            className="input"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value)
              set('tags', e.target.value.split(/[،,]/).map((t) => t.trim()).filter(Boolean))
            }}
          />
        </AdminField>
        <ImagePicker value={draft.image} onChange={(ref) => set('image', ref)} label="تصویر خبر" />
        <Toggle checked={draft.pinned} onChange={(v) => set('pinned', v)} label="سنجاق به بالای فهرست (خبر مهم)" />
        <Toggle checked={draft.published} onChange={(v) => set('published', v)} label="انتشار برای همه کاربران" />
      </div>

      <div className="row" style={{ gap: 9 }}>
        <button className="btn btn-ghost grow" onClick={onCancel}>انصراف</button>
        <button className="btn btn-primary grow" onClick={() => onSave(draft, false)}>
          <Save size={16} />
          ذخیره
        </button>
        <button className="btn btn-gold" onClick={() => onSave(draft, true)} style={{ flex: '0 0 auto' }}>
          <Send size={16} />
          ذخیره و اعلان
        </button>
      </div>
    </div>
  )
}
