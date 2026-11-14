import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Images, Headphones, Video, CalendarDays } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { uid } from '../../lib/id'
import { formatJalali, toFa } from '../../lib/jalali'
import type { MediaAsset, ReportItem } from '../../types'
import { AdminField, ImagePicker, MediaUploader, Toggle } from './ui'
import { ConfirmDialog } from '../../components/Sheet'
import { SmartImage } from '../../components/SmartImage'

export function AdminReports() {
  const { state, update } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<ReportItem | null>(null)
  const [toDelete, setToDelete] = useState<ReportItem | null>(null)

  const items = [...state.reports].sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const startNew = () => {
    setEditing({
      id: '',
      title: '',
      description: '',
      type: 'photo',
      cover: undefined,
      media: [],
      date: new Date().toISOString(),
      published: true,
    })
  }

  const save = (item: ReportItem, media: MediaAsset[]) => {
    if (item.title.trim().length < 4) {
      toast.error('عنوان گزارش را کامل کنید')
      return
    }
    const isNew = !item.id
    const final: ReportItem = { ...item, id: item.id || uid('report'), media }
    update((d) => {
      if (isNew) d.reports.unshift(final)
      else {
        const idx = d.reports.findIndex((r) => r.id === final.id)
        if (idx >= 0) d.reports[idx] = final
      }
      if (isNew && final.published) {
        d.notificationsLog.unshift({
          id: uid('n'),
          title: 'گزارش جدید منتشر شد',
          body: final.title,
          kind: 'report',
          createdAt: new Date().toISOString(),
          sentBy: 'admin',
        })
      }
    })
    toast.success(isNew ? 'گزارش افزوده شد' : 'گزارش به‌روزرسانی شد')
    setEditing(null)
  }

  if (editing) {
    return <ReportForm item={editing} onCancel={() => setEditing(null)} onSave={save} />
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row-between">
        <h2 className="section-title">
          <span className="bar" />
          گزارش‌های تصویری ({toFa(items.length)})
        </h2>
        <button className="btn btn-primary btn-sm" onClick={startNew}>
          <Plus size={15} />
          گزارش جدید
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Images size={24} />
          <strong>گزارشی ثبت نشده است</strong>
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            <Plus size={14} /> افزودن گزارش
          </button>
        </div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {items.map((r) => (
            <div key={r.id} className="admin-row">
              <span className="admin-row-thumb">
                <SmartImage src={r.cover ?? r.media.find((m) => m.kind === 'image')?.url} alt="" />
              </span>
              <div className="admin-row-main">
                <div className="admin-row-title">{r.title}</div>
                <div className="admin-row-sub row" style={{ gap: 5 }}>
                  {r.type === 'audio' ? <Headphones size={11} /> : r.type === 'video' ? <Video size={11} /> : <Images size={11} />}
                  {r.type === 'audio' ? 'صوتی' : r.type === 'video' ? 'ویدیو' : 'عکس'}
                  <span className="dot-sep" />
                  <CalendarDays size={10} />
                  {formatJalali(r.date, { year: false, weekday: false })}
                  <span className={`badge ${r.published ? 'badge-green' : 'badge-gold'}`} style={{ fontSize: '.58rem' }}>
                    {r.published ? 'منتشرشده' : 'پیش‌نویس'}
                  </span>
                </div>
              </div>
              <div className="admin-actions">
                <button
                  className="mini-btn"
                  onClick={() =>
                    update((d) => {
                      const n = d.reports.find((x) => x.id === r.id)
                      if (n) n.published = !n.published
                    })
                  }
                  aria-label="انتشار"
                >
                  {r.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button className="mini-btn" onClick={() => setEditing(r)} aria-label="ویرایش">
                  <Pencil size={14} />
                </button>
                <button className="mini-btn danger" onClick={() => setToDelete(r)} aria-label="حذف">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف گزارش"
        body={`آیا «${toDelete?.title ?? ''}» و رسانه‌های آن حذف شود؟`}
        confirmLabel="حذف کن"
        danger
        onConfirm={() => {
          if (!toDelete) return
          update((d) => {
            d.reports = d.reports.filter((r) => r.id !== toDelete.id)
          })
          toast.success('گزارش حذف شد')
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

function ReportForm({
  item,
  onCancel,
  onSave,
}: {
  item: ReportItem
  onCancel: () => void
  onSave: (item: ReportItem, media: MediaAsset[]) => void
}) {
  const [draft, setDraft] = useState<ReportItem>(item)
  const [media, setMedia] = useState<MediaAsset[]>(item.media)
  const set = <K extends keyof ReportItem>(key: K, value: ReportItem[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const types = [
    { id: 'photo' as const, label: 'عکس', icon: Images },
    { id: 'audio' as const, label: 'صوتی', icon: Headphones },
    { id: 'video' as const, label: 'ویدیو', icon: Video },
  ]

  return (
    <div className="col" style={{ gap: 13 }}>
      <div className="row-between">
        <h2 style={{ fontSize: '1rem' }}>{item.id ? 'ویرایش گزارش' : 'گزارش جدید'}</h2>
        <button className="icon-btn" onClick={onCancel} aria-label="بستن">
          <X size={17} />
        </button>
      </div>

      <div className="form-section">
        <AdminField label="عنوان گزارش" required>
          <input className="input" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلاً گزارش تصویری مراسم هفتگی" />
        </AdminField>
        <div className="field">
          <span className="label">نوع گزارش</span>
          <div className="row" style={{ gap: 7 }}>
            {types.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  className="chip chip-btn"
                  aria-pressed={draft.type === t.id}
                  onClick={() => set('type', t.id)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Icon size={13} /> {t.label}
                </button>
              )
            })}
          </div>
        </div>
        <AdminField label="توضیح گزارش">
          <textarea className="textarea" value={draft.description} onChange={(e) => set('description', e.target.value)} rows={3} />
        </AdminField>
        <AdminField label="تاریخ مراسم (متن نمایشی)" hint="مثلاً «هفته گذشته» یا «۲۳ آبان ۱۴۰۴»">
          <input className="input" value={draft.eventDateText ?? ''} onChange={(e) => set('eventDateText', e.target.value)} />
        </AdminField>
        <ImagePicker value={draft.cover} onChange={(ref) => set('cover', ref)} label="تصویر کاور گزارش" />
        <Toggle checked={draft.published} onChange={(v) => set('published', v)} label="انتشار برای همه کاربران" />
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <Images size={16} />
          رسانه‌های گزارش
        </div>
        <p className="tiny dim" style={{ marginTop: -6, lineHeight: 1.9 }}>
          برای گزارش عکسی چند تصویر، برای گزارش صوتی فایل mp3/m4a و برای ویدیو فایل mp4 یا لینک یوتیوب/آپارات
          اضافه کنید. فایل‌ها روی دستگاه ذخیره می‌شوند و آفلاین هم قابل مشاهده‌اند.
        </p>
        <MediaUploader
          media={media}
          onChange={setMedia}
          allow={
            draft.type === 'audio' ? ['audio', 'external'] : draft.type === 'video' ? ['video', 'external'] : ['image', 'video']
          }
        />
      </div>

      <div className="row" style={{ gap: 9 }}>
        <button className="btn btn-ghost grow" onClick={onCancel}>انصراف</button>
        <button className="btn btn-primary grow" onClick={() => onSave(draft, media)}>
          <Save size={16} />
          ذخیره گزارش
        </button>
      </div>
    </div>
  )
}
