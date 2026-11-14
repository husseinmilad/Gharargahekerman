import { useEffect, useState } from 'react'
import { Bell, Send, Trash2, Loader2, BellRing, Info } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { uid } from '../../lib/id'
import { humanizeDistance, toFa } from '../../lib/jalali'
import { notifyNow, requestNotificationPermission, getPermissionState, syncReminders } from '../../lib/notifications'
import type { AppState } from '../../types'
import { AdminField } from './ui'

export function AdminInbox() {
  const { state, update } = useStore()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [perm, setPerm] = useState<string>('prompt')

  useEffect(() => {
    getPermissionState().then(setPerm).catch(() => setPerm('unsupported'))
  }, [perm])

  const send = async () => {
    if (title.trim().length < 3 || body.trim().length < 3) {
      toast.error('عنوان و متن اعلان را کامل کنید')
      return
    }
    setSending(true)
    const p = await requestNotificationPermission()
    setPerm(p)
    const ok = p === 'granted' ? await notifyNow(title.trim(), body.trim(), `admin-${Date.now()}`) : false
    update((d: AppState) => {
      d.notificationsLog.unshift({
        id: uid('n'),
        title: title.trim(),
        body: body.trim(),
        kind: 'system',
        createdAt: new Date().toISOString(),
        sentBy: 'admin',
      })
    })
    setTitle('')
    setBody('')
    setSending(false)
    if (ok) toast.success('اعلان ارسال شد')
    else toast.show('ابلاغ در فهرست اعلان‌های برنامه ثبت شد (برای ارسال گوشی، اجازه اعلان لازم است)', 'info')
  }

  return (
    <div className="col" style={{ gap: 13 }}>
      <h2 className="section-title">
        <span className="bar" />
        ارسال اعلان و اطلاع‌رسانی
      </h2>

      <div className="warn-note">
        <Info size={16} />
        <span>
          اعلان‌های فوری (مثل تغییر زمان مراسم) را از این بخش ارسال کنید. یادآوری مراسم‌ها به‌صورت
          خودکار از بخش «مراسم‌ها» با تعیین زمان یادآوری انجام می‌شود.
          {perm !== 'granted' && ' برای ارسال به گوشی، ابتدا اجازه اعلان را فعال کنید.'}
        </span>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <BellRing size={16} />
          اعلان جدید
        </div>
        <AdminField label="عنوان اعلان" required>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً تغییر زمان مراسم هفتگی" maxLength={60} />
        </AdminField>
        <AdminField label="متن اعلان" required>
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="متن کوتاه و گویا" maxLength={220} />
        </AdminField>
        <button className="btn btn-primary btn-block" onClick={send} disabled={sending}>
          {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          {sending ? 'در حال ارسال…' : 'ثبت و ارسال اعلان'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await syncReminders(state, true)
            toast.success('یادآوری‌های مراسم‌ها بازتنظیم شد')
          }}
        >
          <Bell size={14} />
          بازتنظیم همه یادآوری‌های مراسم
        </button>
      </div>

      <div className="section">
        <h3 className="section-title">
          <span className="bar" />
          تاریخچه اعلان‌ها ({toFa(state.notificationsLog.length)})
        </h3>
        {state.notificationsLog.length === 0 ? (
          <div className="empty-state tiny">اعلانی ثبت نشده است.</div>
        ) : (
          <div className="col" style={{ gap: 7 }}>
            {state.notificationsLog.map((n) => (
              <div key={n.id} className="admin-row">
                <span className="admin-row-thumb" style={{ width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
                  <Bell size={15} />
                </span>
                <div className="admin-row-main">
                  <div className="admin-row-title">{n.title}</div>
                  <div className="admin-row-sub">{n.body}</div>
                  <div className="tiny dim" style={{ marginTop: 2 }}>
                    {humanizeDistance(new Date(n.createdAt).getTime())} · {n.sentBy === 'admin' ? 'ارسال ادمین' : 'سیستمی'}
                  </div>
                </div>
                <button
                  className="mini-btn danger"
                  onClick={() =>
                    update((d) => {
                      d.notificationsLog = d.notificationsLog.filter((x) => x.id !== n.id)
                    })
                  }
                  aria-label="حذف"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
