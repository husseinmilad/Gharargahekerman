import { useRef, useState } from 'react'
import {
  Save,
  CloudUpload,
  RefreshCw,
  Globe,
  Building2,
  CloudSun,
  Bell,
  KeyRound,
  Database,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Copy,
  Plus,
  X,
  MapPin,
} from 'lucide-react'
import { useStore, clearAllAssets } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { sha256 } from '../../lib/id'
import type { AppSettings, ContactChannel } from '../../types'
import { AdminField, ImagePicker, Toggle } from './ui'
import { ConfirmDialog } from '../../components/Sheet'
import { copyText } from '../../lib/clipboard'
import { contentForPublish, getRemoteSource, setRemoteSource, lastSyncAt } from '../../lib/remote'
import { toFa } from '../../lib/jalali'

export function AdminSettings() {
  const { state, update, updateSettings, resetAll, importState, exportState } = useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<AppSettings>(state.settings)
  const [dirty, setDirty] = useState(false)
  const [pinNew, setPinNew] = useState('')
  const [pinOld, setPinOld] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [remotePath, setRemotePath] = useState(getRemoteSource())
  const refresh = useStore().refreshRemote
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(lastSyncAt())
  const [confirmClearAssets, setConfirmClearAssets] = useState(false)

  const patch = (p: Partial<AppSettings>) => {
    setDraft((d) => ({ ...d, ...p }))
    setDirty(true)
  }

  const save = () => {
    updateSettings(draft)
    setDirty(false)
    toast.success('تنظیمات برنامه ذخیره شد')
  }

  const changePin = async () => {
    if (!/^\d{4,8}$/.test(pinNew)) {
      toast.error('رمز جدید باید ۴ تا ۸ رقم باشد')
      return
    }
    if (pinNew !== pinConfirm) {
      toast.error('تکرار رمز جدید مطابقت ندارد')
      return
    }
    if (draft.adminPinHash) {
      const oldHash = await sha256(pinOld)
      if (oldHash !== draft.adminPinHash) {
        toast.error('رمز فعلی درست نیست')
        return
      }
    }
    const hash = await sha256(pinNew)
    updateSettings({ adminPinHash: hash })
    setDraft((d) => ({ ...d, adminPinHash: hash }))
    setPinNew('')
    setPinOld('')
    setPinConfirm('')
    toast.success('رمز مدیریت تغییر کرد')
  }

  const backup = () => {
    const json = exportState()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gharargah-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('نسخه پشتیبان دانلود شد')
  }

  const restore = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    if (importState(text)) {
      toast.success('داده‌ها بازیابی شد')
      setDraft(JSON.parse(text).settings ?? state.settings)
    } else {
      toast.error('فایل پشتیبان معتبر نیست')
    }
  }

  const setChannel = (id: string, patchCh: Partial<ContactChannel>) => {
    update((d) => {
      const ch = d.contactChannels.find((c) => c.id === id)
      if (ch) Object.assign(ch, patchCh)
    })
  }

  return (
    <div className="col" style={{ gap: 13 }}>
      <div className="row-between">
        <h2 className="section-title">
          <span className="bar" />
          تنظیمات برنامه
        </h2>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!dirty}>
          <Save size={15} />
          {dirty ? 'ذخیره' : 'ذخیره‌شده'}
        </button>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <Building2 size={16} />
          هویت قرارگاه
        </div>
        <AdminField label="نام قرارگاه">
          <input className="input" value={draft.orgName} onChange={(e) => patch({ orgName: e.target.value })} />
        </AdminField>
        <div className="grid-2" style={{ gap: 10 }}>
          <AdminField label="زیرعنوان (محله)">
            <input className="input" value={draft.orgSubtitle} onChange={(e) => patch({ orgSubtitle: e.target.value })} />
          </AdminField>
          <AdminField label="شعار">
            <input className="input" value={draft.motto} onChange={(e) => patch({ motto: e.target.value })} />
          </AdminField>
        </div>
        <AdminField label="درباره قرارگاه">
          <textarea className="textarea" value={draft.aboutText} onChange={(e) => patch({ aboutText: e.target.value })} rows={4} />
        </AdminField>
        <AdminField label="نشانی">
          <input className="input" value={draft.address} onChange={(e) => patch({ address: e.target.value })} />
        </AdminField>
        <div className="grid-2" style={{ gap: 10 }}>
          <AdminField label="نشانه مکانی">
            <input className="input" value={draft.locationNote} onChange={(e) => patch({ locationNote: e.target.value })} />
          </AdminField>
          <AdminField label="ساعات فعالیت">
            <input className="input" value={draft.workHours} onChange={(e) => patch({ workHours: e.target.value })} />
          </AdminField>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <MapPin size={16} />
          تصویر بالای صفحه اول (هدر)
        </div>
        <ImagePicker value={draft.heroImage} onChange={(ref) => patch({ heroImage: ref ?? '' })} label="تصویر هدر" aspect="16 / 9" />
        <AdminField label="عنوان روی هدر">
          <input className="input" value={draft.heroTitle} onChange={(e) => patch({ heroTitle: e.target.value })} />
        </AdminField>
        <AdminField label="زیرعنوان روی هدر">
          <input className="input" value={draft.heroSubtitle} onChange={(e) => patch({ heroSubtitle: e.target.value })} />
        </AdminField>
        <p className="tiny dim" style={{ lineHeight: 1.9 }}>
          واژه آخر عنوان به رنگ طلایی نمایش داده می‌شود. تصویر پیشنهادی: افقی با کیفیت و بدون نوشته.
        </p>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <CloudSun size={16} />
          نمایش هوای آنلاین
        </div>
        <AdminField label="برچسب نمایش" hint="مثلاً «هوای تهران»">
          <input className="input" value={draft.weather.label} onChange={(e) => patch({ weather: { ...draft.weather, label: e.target.value } })} />
        </AdminField>
        <AdminField label="نام شهر">
          <input className="input" value={draft.weather.city} onChange={(e) => patch({ weather: { ...draft.weather, city: e.target.value } })} />
        </AdminField>
        <div className="grid-2" style={{ gap: 10 }}>
          <AdminField label="عرض جغرافیایی" hint="تهران: 35.6892">
            <input
              className="input"
              dir="ltr"
              value={draft.weather.latitude}
              onChange={(e) => patch({ weather: { ...draft.weather, latitude: Number(e.target.value) || 0 } })}
              inputMode="decimal"
            />
          </AdminField>
          <AdminField label="طول جغرافیایی" hint="تهران: 51.389">
            <input
              className="input"
              dir="ltr"
              value={draft.weather.longitude}
              onChange={(e) => patch({ weather: { ...draft.weather, longitude: Number(e.target.value) || 0 } })}
              inputMode="decimal"
            />
          </AdminField>
        </div>
        <p className="tiny dim" style={{ lineHeight: 1.9 }}>
          داده هوا از سرویس Open-Meteo و بدون نیاز به کلید دریافت می‌شود. مقدار پیش‌فرض تهران است.
        </p>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <Bell size={16} />
          اعلان‌ها
        </div>
        <Toggle
          checked={draft.notifications.enabled}
          onChange={(v) => patch({ notifications: { ...draft.notifications, enabled: v } })}
          label="فعال‌بودن سیستم اعلان یادآوری"
        />
        <div className="field">
          <span className="label">گزینه‌های زمان یادآوری (دقیقه)</span>
          <div className="row wrap" style={{ gap: 6 }}>
            {draft.notifications.leadOptions.map((m) => (
              <span key={m} className="chip" style={{ fontSize: '.72rem' }}>
                {m >= 1440 ? `${toFa(m / 1440)} روز` : m >= 60 ? `${toFa(m / 60)} ساعت` : `${toFa(m)} دقیقه`}
                <button
                  style={{ display: 'grid', placeItems: 'center' }}
                  onClick={() =>
                    patch({
                      notifications: {
                        ...draft.notifications,
                        leadOptions: draft.notifications.leadOptions.filter((x) => x !== m),
                      },
                    })
                  }
                  aria-label="حذف گزینه"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            {[30, 60, 120, 180, 720, 1440].filter((m) => !draft.notifications.leadOptions.includes(m)).map((m) => (
              <button
                key={m}
                className="chip chip-btn"
                onClick={() =>
                  patch({
                    notifications: {
                      ...draft.notifications,
                      leadOptions: [...draft.notifications.leadOptions, m].sort((a, b) => a - b),
                    },
                  })
                }
              >
                <Plus size={11} />
                {m >= 1440 ? `${toFa(m / 1440)} روز` : m >= 60 ? `${toFa(m / 60)} ساعت` : `${toFa(m)} دقیقه`}
              </button>
            ))}
          </div>
        </div>
        <AdminField label="زمان یادآوری پیش‌فرض برای مراسم جدید">
          <select
            className="select"
            value={draft.notifications.defaultLeadMinutes}
            onChange={(e) => patch({ notifications: { ...draft.notifications, defaultLeadMinutes: Number(e.target.value) } })}
          >
            {draft.notifications.leadOptions.map((m) => (
              <option key={m} value={m}>
                {m >= 1440 ? `${toFa(m / 1440)} روز قبل` : m >= 60 ? `${toFa(m / 60)} ساعت قبل` : `${toFa(m)} دقیقه قبل`}
              </option>
            ))}
          </select>
        </AdminField>
        <div className="divider" />
        <Toggle
          checked={draft.notifications.quietHours.enabled}
          onChange={(v) => patch({ notifications: { ...draft.notifications, quietHours: { ...draft.notifications.quietHours, enabled: v } } })}
          label="سکوت اعلان در ساعات شب"
        />
        {draft.notifications.quietHours.enabled && (
          <div className="grid-2" style={{ gap: 10 }}>
            <AdminField label="از ساعت">
              <input
                className="input"
                type="number"
                min={0}
                max={23}
                value={draft.notifications.quietHours.from}
                onChange={(e) =>
                  patch({
                    notifications: {
                      ...draft.notifications,
                      quietHours: { ...draft.notifications.quietHours, from: Math.max(0, Math.min(23, Number(e.target.value))) },
                    },
                  })
                }
              />
            </AdminField>
            <AdminField label="تا ساعت">
              <input
                className="input"
                type="number"
                min={0}
                max={23}
                value={draft.notifications.quietHours.to}
                onChange={(e) =>
                  patch({
                    notifications: {
                      ...draft.notifications,
                      quietHours: { ...draft.notifications.quietHours, to: Math.max(0, Math.min(23, Number(e.target.value))) },
                    },
                  })
                }
              />
            </AdminField>
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <KeyRound size={16} />
          رمز مدیریت
        </div>
        {draft.adminPinHash && (
          <AdminField label="رمز فعلی">
            <input className="input" type="password" inputMode="numeric" value={pinOld} onChange={(e) => setPinOld(e.target.value.replace(/\D/g, ''))} maxLength={8} />
          </AdminField>
        )}
        <div className="grid-2" style={{ gap: 10 }}>
          <AdminField label="رمز جدید (۴–۸ رقم)">
            <input className="input" type="password" inputMode="numeric" value={pinNew} onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ''))} maxLength={8} />
          </AdminField>
          <AdminField label="تکرار رمز جدید">
            <input className="input" type="password" inputMode="numeric" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))} maxLength={8} />
          </AdminField>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={changePin} style={{ alignSelf: 'flex-start' }}>
          <KeyRound size={14} />
          تغییر رمز
        </button>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <Database size={16} />
          پشتیبان‌گیری و بازیابی
        </div>
        <p className="tiny dim" style={{ lineHeight: 1.9 }}>
          همه داده‌ها روی همین دستگاه ذخیره می‌شوند. برای انتقال به گوشی دیگر یا نگهداری نسخه ایمن، از فایل
          پشتیبان استفاده کنید. (فایل‌های صوتی و تصویری آپلودی داخل فایل پشتیبان نیستند.)
        </p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost btn-sm grow" onClick={backup}>
            <Download size={14} />
            دانلود پشتیبان
          </button>
          <button className="btn btn-ghost btn-sm grow" onClick={() => fileRef.current?.click()}>
            <Upload size={14} />
            بازیابی
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            void restore(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-ghost btn-sm grow" onClick={async () => {
            const ok = await copyText(exportState())
            toast[ok ? 'success' : 'error'](ok ? 'محتوای پشتیبان کپی شد' : 'کپی ناموفق بود')
          }}>
            <Copy size={14} />
            کپی داده‌ها
          </button>
          <button className="btn btn-danger btn-sm grow" onClick={() => setConfirmClearAssets(true)}>
            <Trash2 size={14} />
            پاک‌سازی فایل‌ها
          </button>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <Building2 size={16} />
          شماره تماس خادمان
        </div>
        {state.contactChannels.map((ch) => (
          <div key={ch.id} className="glass card col" style={{ gap: 8, padding: 12 }}>
            <AdminField label="عنوان واحد">
              <input className="input" value={ch.role} onChange={(e) => setChannel(ch.id, { role: e.target.value })} />
            </AdminField>
            <div className="grid-2" style={{ gap: 8 }}>
              <AdminField label="نام">
                <input className="input" value={ch.name} onChange={(e) => setChannel(ch.id, { name: e.target.value })} />
              </AdminField>
              <AdminField label="شماره">
                <input className="input" dir="ltr" value={ch.phone} onChange={(e) => setChannel(ch.id, { phone: e.target.value })} />
              </AdminField>
            </div>
            <AdminField label="ساعات پاسخگویی">
              <input className="input" value={ch.hours} onChange={(e) => setChannel(ch.id, { hours: e.target.value })} />
            </AdminField>
            <button
              className="mini-btn danger"
              style={{ alignSelf: 'flex-end' }}
              onClick={() =>
                update((d) => {
                  d.contactChannels = d.contactChannels.filter((c) => c.id !== ch.id)
                })
              }
              aria-label="حذف"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={() =>
            update((d) => {
              d.contactChannels.push({
                id: `ch-${Date.now()}`,
                role: 'واحد جدید',
                name: 'نام خادم',
                phone: '۰۹۱۰ ۰۰۰ ۰۰۰۰',
                hours: 'همه‌روزه',
              })
            })
          }
        >
          <Plus size={14} />
          افزودن شماره تماس
        </button>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <Globe size={16} />
          انتشار محتوا برای همه کاربران
        </div>
        <p className="tiny dim" style={{ lineHeight: 1.95 }}>
          با این کار، اخبار و مراسم و گزارش‌های فعلی در فایل عمومی <code>content/app-state.json</code> ذخیره
          می‌شود. آن فایل را در مخزن گیت‌هاب جایگزین کنید تا همه کاربران هنگام باز کردن برنامه، محتوای تازه
          را دریافت کنند. داده‌های شخصی (درخواست‌های همکاری و پیام‌ها) در این فایل قرار نمی‌گیرد.
        </p>
        <div className="row" style={{ gap: 8 }}>
          <button
            className="btn btn-primary btn-sm grow"
            onClick={() => {
              const json = JSON.stringify(contentForPublish(state), null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'app-state.json'
              a.click()
              URL.revokeObjectURL(url)
              toast.success('فایل محتوا آماده شد؛ آن را جایگزین content/app-state.json کنید')
            }}
          >
            <CloudUpload size={15} />
            دریافت فایل محتوا
          </button>
          <button
            className="btn btn-ghost btn-sm grow"
            onClick={async () => {
              const ok = await copyText(JSON.stringify(contentForPublish(state)))
              toast[ok ? 'success' : 'error'](ok ? 'محتوای عمومی کپی شد' : 'کپی ناموفق بود')
            }}
          >
            <Copy size={14} />
            کپی محتوا
          </button>
        </div>
        <div className="divider" />
        <AdminField label="آدرس فایل محتوای عمومی" hint="پیش‌فرض: content/app-state.json (داخل همین برنامه)">
          <input
            className="input"
            dir="ltr"
            value={remotePath}
            onChange={(e) => {
              setRemotePath(e.target.value)
              setRemoteSource(e.target.value)
            }}
            placeholder="content/app-state.json"
          />
        </AdminField>
        <div className="row-between" style={{ gap: 8 }}>
          <span className="tiny dim">
            آخرین دریافت: {lastSync ? new Date(lastSync).toLocaleString('fa-IR') : '—'}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true)
              const res = await refresh()
              setSyncing(false)
              setLastSync(lastSyncAt())
              if (res.applied) toast.success(res.message)
              else toast.show(res.message, 'info')
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : undefined }} />
            {syncing ? 'در حال دریافت…' : 'دریافت محتوای تازه'}
          </button>
        </div>
      </div>

      <div className="form-section" style={{ borderColor: 'rgba(251,113,133,.3)', background: 'rgba(251,113,133,.05)' }}>
        <div className="form-section-title" style={{ color: '#ffd0d6' }}>
          <ShieldAlert size={16} />
          منطقه حساس
        </div>
        <p className="tiny muted" style={{ lineHeight: 1.9 }}>
          بازنشانی برنامه همه اخبار، مراسم، گزارش‌ها و درخواست‌ها را به حالت اولیه برمی‌گرداند. این کار
          قابل بازگشت نیست.
        </p>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmReset(true)} style={{ alignSelf: 'flex-start' }}>
          <RotateCcw size={14} />
          بازنشانی کامل برنامه
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="بازنشانی کامل"
        body="همه داده‌ها و تنظیمات به حالت اولیه برمی‌گردند و رمز مدیریت نیز حذف می‌شود. آیا مطمئن هستید؟"
        confirmLabel="بله، بازنشانی کن"
        danger
        onConfirm={() => {
          resetAll()
          setConfirmReset(false)
          toast.success('برنامه بازنشانی شد')
        }}
        onCancel={() => setConfirmReset(false)}
      />
      <ConfirmDialog
        open={confirmClearAssets}
        title="پاک‌سازی فایل‌های ذخیره‌شده"
        body="همه عکس‌ها و فایل‌های صوتی/ویدیویی که آپلود کرده‌اید از دستگاه پاک می‌شوند (ساختار محتوا حفظ می‌شود)."
        confirmLabel="پاک کن"
        danger
        onConfirm={async () => {
          await clearAllAssets()
          setConfirmClearAssets(false)
          toast.success('فایل‌ها پاک شدند')
        }}
        onCancel={() => setConfirmClearAssets(false)}
      />
    </div>
  )
}
