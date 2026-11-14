import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Bell,
  BellOff,
  Save,
  X,
  CalendarClock,
  MapPin,
  Send,
  CalendarDays,
} from 'lucide-react'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { uid } from '../../lib/id'
import { formatEventDate, formatTime, toDateInputValue, toFa, toTimeInputValue } from '../../lib/jalali'
import { humanizeDistance } from '../../lib/jalali'
import { remindLabel } from '../EventsPage'
import { syncReminders, notifyNow, requestNotificationPermission } from '../../lib/notifications'
import type { EventItem } from '../../types'
import { AdminField, ImagePicker, Toggle } from './ui'
import { ConfirmDialog } from '../../components/Sheet'

export function AdminEvents() {
  const { state, update } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [toDelete, setToDelete] = useState<EventItem | null>(null)

  const events = [...state.events].sort((a, b) => a.startsAt - b.startsAt)

  const startNew = () => {
    const now = new Date()
    now.setHours(now.getHours() + 24, 0, 0, 0)
    setEditing({
      id: '',
      title: '',
      description: '',
      image: undefined,
      startsAt: now.getTime(),
      endsAt: now.getTime() + 2 * 3600_000,
      location: state.settings.address,
      notify: true,
      reminderMinutes: state.settings.notifications.defaultLeadMinutes,
    })
  }

  const save = async (item: EventItem) => {
    if (item.title.trim().length < 3) {
      toast.error('عنوان مراسم را وارد کنید')
      return
    }
    const isNew = !item.id
    const final: EventItem = { ...item, id: item.id || uid('event') }
    update((d) => {
      if (isNew) d.events.push(final)
      else {
        const idx = d.events.findIndex((e) => e.id === final.id)
        if (idx >= 0) d.events[idx] = final
      }
      if (isNew) {
        d.notificationsLog.unshift({
          id: uid('n'),
          title: 'مراسم جدید اعلام شد',
          body: `${final.title} — ${formatEventDate(final.startsAt)}`,
          kind: 'event',
          createdAt: new Date().toISOString(),
          sentBy: 'admin',
        })
      }
    })
    if (final.notify) {
      const perm = await requestNotificationPermission()
      if (perm === 'granted') {
        await syncReminders({ ...state, events: [...state.events.filter((e) => e.id !== final.id), final] }, true)
      }
    }
    toast.success(isNew ? 'مراسم افزوده شد' : 'مراسم به‌روزرسانی شد')
    setEditing(null)
  }

  if (editing) {
    return <EventForm item={editing} onCancel={() => setEditing(null)} onSave={save} />
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row-between">
        <h2 className="section-title">
          <span className="bar" />
          مدیریت مراسم‌ها ({toFa(events.length)})
        </h2>
        <button className="btn btn-primary btn-sm" onClick={startNew}>
          <Plus size={15} />
          مراسم جدید
        </button>
      </div>

      <div className="warn-note">
        <Bell size={16} />
        <span>
          با فعال‌کردن «اعلان» برای هر مراسم، در زمان تعیین‌شده (مثلاً ۲ ساعت قبل از شروع) به کاربران
          یادآوری ارسال می‌شود. این زمان را با هماهنگی خادمان انتخاب کنید.
        </span>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={24} />
          <strong>مراسمی ثبت نشده است</strong>
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            <Plus size={14} /> افزودن مراسم
          </button>
        </div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {events.map((e) => {
            const past = (e.endsAt ?? e.startsAt + 7200000) < Date.now()
            return (
              <div key={e.id} className="admin-row" style={{ opacity: past ? 0.66 : 1 }}>
                <span className="admin-row-thumb" style={{ width: 44, height: 44, display: 'grid', placeItems: 'center' }}>
                  <CalendarClock size={17} />
                </span>
                <div className="admin-row-main">
                  <div className="admin-row-title">{e.title}</div>
                  <div className="admin-row-sub">
                    {formatEventDate(e.startsAt)} · {past ? 'برگزار شد' : humanizeDistance(e.startsAt)}
                  </div>
                  <div className="tiny" style={{ color: e.notify ? '#9ff5d5' : 'rgba(212,235,225,.45)', marginTop: 2 }}>
                    {e.notify ? `اعلان ${remindLabel(e.reminderMinutes)}` : 'بدون اعلان'}
                  </div>
                </div>
                <div className="admin-actions">
                  <button
                    className="mini-btn"
                    onClick={() =>
                      update((d) => {
                        const target = d.events.find((x) => x.id === e.id)
                        if (target) target.notify = !target.notify
                      })
                    }
                    aria-label="اعلان"
                  >
                    {e.notify ? <Bell size={14} /> : <BellOff size={14} />}
                  </button>
                  <button className="mini-btn" onClick={() => setEditing(e)} aria-label="ویرایش">
                    <Pencil size={14} />
                  </button>
                  <button className="mini-btn danger" onClick={() => setToDelete(e)} aria-label="حذف">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف مراسم"
        body={`آیا «${toDelete?.title ?? ''}» حذف شود؟ یادآوری‌های برنامه‌ریزی‌شده نیز لغو می‌شوند.`}
        confirmLabel="حذف کن"
        danger
        onConfirm={() => {
          if (!toDelete) return
          update((d) => {
            d.events = d.events.filter((x) => x.id !== toDelete.id)
          })
          toast.success('مراسم حذف شد')
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

function EventForm({
  item,
  onCancel,
  onSave,
}: {
  item: EventItem
  onCancel: () => void
  onSave: (item: EventItem) => void
}) {
  const { state } = useStore()
  const [draft, setDraft] = useState<EventItem>(item)
  const [date, setDate] = useState(toDateInputValue(item.startsAt))
  const [time, setTime] = useState(toTimeInputValue(item.startsAt))
  const [endTime, setEndTime] = useState(toTimeInputValue(item.endsAt ?? item.startsAt + 7200000))
  const set = <K extends keyof EventItem>(key: K, value: EventItem[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const applyDate = (d: string, t: string, et: string) => {
    const [y, m, day] = d.split('-').map(Number)
    const [hh, mm] = t.split(':').map(Number)
    const [eh, em] = et.split(':').map(Number)
    if (!y || !m || !day) return
    const start = new Date(y, m - 1, day, hh || 0, mm || 0, 0, 0)
    const end = new Date(y, m - 1, day, eh || 0, em || 0, 0, 0)
    if (end.getTime() <= start.getTime()) end.setTime(start.getTime() + 2 * 3600_000)
    setDraft((prev) => ({ ...prev, startsAt: start.getTime(), endsAt: end.getTime() }))
  }

  return (
    <div className="col" style={{ gap: 13 }}>
      <div className="row-between">
        <h2 style={{ fontSize: '1rem' }}>{item.id ? 'ویرایش مراسم' : 'مراسم جدید'}</h2>
        <button className="icon-btn" onClick={onCancel} aria-label="بستن">
          <X size={17} />
        </button>
      </div>

      <div className="form-section">
        <AdminField label="عنوان مراسم" required>
          <input className="input" value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلاً مراسم هفتگی سوگواری" />
        </AdminField>
        <AdminField label="توضیحات">
          <textarea className="textarea" value={draft.description} onChange={(e) => set('description', e.target.value)} rows={4} />
        </AdminField>
        <ImagePicker value={draft.image} onChange={(ref) => set('image', ref)} label="تصویر مراسم" />
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <CalendarClock size={16} />
          زمان برگزاری
        </div>
        <div className="grid-2" style={{ gap: 10 }}>
          <AdminField label="تاریخ (میلادی)">
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                applyDate(e.target.value, time, endTime)
              }}
            />
          </AdminField>
          <AdminField label="ساعت شروع">
            <input
              className="input"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value)
                applyDate(date, e.target.value, endTime)
              }}
            />
          </AdminField>
        </div>
        <div className="grid-2" style={{ gap: 10 }}>
          <AdminField label="ساعت پایان تقریبی">
            <input
              className="input"
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value)
                applyDate(date, time, e.target.value)
              }}
            />
          </AdminField>
          <AdminField label="محل برگزاری">
            <input className="input" value={draft.location} onChange={(e) => set('location', e.target.value)} placeholder="مثلاً مسجد جامع محله" />
          </AdminField>
        </div>
        <div className="row tiny" style={{ gap: 6, color: '#9ff5d5', lineHeight: 1.9 }}>
          <MapPin size={13} />
          {formatEventDate(draft.startsAt)} — پایان {formatTime(draft.endsAt ?? draft.startsAt)}
        </div>
        <AdminField label="سخنران / مجری (اختیاری)">
          <input className="input" value={draft.speaker ?? ''} onChange={(e) => set('speaker', e.target.value)} />
        </AdminField>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <Bell size={16} />
          اعلان و یادآوری
        </div>
        <Toggle checked={draft.notify} onChange={(v) => set('notify', v)} label="ارسال اعلان یادآوری پیش از مراسم" />
        {draft.notify && (
          <>
            <div className="field">
              <span className="label">چه مدت قبل از شروع؟</span>
              <div className="row wrap" style={{ gap: 7 }}>
                {state.settings.notifications.leadOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="chip chip-btn"
                    aria-pressed={draft.reminderMinutes === m}
                    onClick={() => set('reminderMinutes', m)}
                  >
                    {remindLabel(m)}
                  </button>
                ))}
              </div>
            </div>
            <div className="tiny dim" style={{ lineHeight: 1.9 }}>
              زمان ارسال: {formatEventDate(draft.startsAt - draft.reminderMinutes * 60_000)} — کاربران می‌توانند
              زمان یادآوری خود را تغییر دهند.
            </div>
          </>
        )}
      </div>

      <div className="row" style={{ gap: 9 }}>
        <button className="btn btn-ghost grow" onClick={onCancel}>انصراف</button>
        <button className="btn btn-primary grow" onClick={() => onSave(draft)}>
          <Save size={16} />
          ذخیره مراسم
        </button>
      </div>
      <button
        className="btn btn-outline btn-sm"
        onClick={async () => {
          const perm = await requestNotificationPermission()
          if (perm === 'granted') {
            await notifyNow('اعلان مراسم', `${draft.title} — ${formatEventDate(draft.startsAt)}`, 'manual-event')
          }
        }}
      >
        <Send size={14} />
        ارسال اعلان آزمایشی همین حالا
      </button>
    </div>
  )
}
