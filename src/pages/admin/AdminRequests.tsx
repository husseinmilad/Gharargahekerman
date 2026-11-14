import { useMemo, useState } from 'react'
import { Users, Phone, Trash2, CheckCheck, Clock3, Download, Search, Check } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { formatJalali, toFa } from '../../lib/jalali'
import { COOPERATION_ICONS } from '../../types'
import { Save, Plus, Power, ChevronDown } from 'lucide-react'
import type { RequestStatus } from '../../types'

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'در انتظار بررسی',
  reviewed: 'بررسی‌شده',
  done: 'تأیید نهایی',
}

export function AdminRequests() {
  const { state, update } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  const items = useMemo(
    () =>
      [...state.requests]
        .filter((r) => (filter === 'all' ? true : r.status === filter))
        .filter((r) =>
          query ? r.fullName.includes(query) || r.phone.includes(query) || r.typeTitle.includes(query) : true,
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [state.requests, filter, query],
  )

  const exportCsv = () => {
    const header = 'نام,موبایل,سن,محله,نوع همکاری,زمان مناسب,مهارت,یادداشت,تاریخ,وضعیت'
    const rows = state.requests.map((r) =>
      [r.fullName, r.phone, r.age, r.neighborhood, r.typeTitle, r.availability, r.skills, r.note, formatJalali(r.createdAt), STATUS_LABEL[r.status]]
        .map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    const csv = `\uFEFF${header}\n${rows.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cooperation-requests-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('فایل اکسل درخواست‌ها دانلود شد')
  }

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="row-between">
        <h2 className="section-title">
          <span className="bar" />
          درخواست‌های همکاری ({toFa(state.requests.length)})
        </h2>
        {state.requests.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={exportCsv}>
            <Download size={14} />
            خروجی اکسل
          </button>
        )}
      </div>

      <div className="segmented" role="tablist">
        {(['all', 'new', 'reviewed', 'done'] as const).map((s) => (
          <button key={s} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)}>
            {s === 'all' ? 'همه' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          className="input"
          placeholder="جست‌وجو بر اساس نام، شماره یا نوع همکاری…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ paddingRight: 42 }}
        />
        <Search size={16} style={{ position: 'absolute', right: 14, top: 15, opacity: 0.45 }} />
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Users size={24} />
          <strong>{state.requests.length === 0 ? 'هنوز درخواست همکاری ثبت نشده' : 'نتیجه‌ای یافت نشد'}</strong>
          <span className="tiny">درخواست‌های ارسالی از فرم همکاری، در این بخش نمایش داده می‌شوند.</span>
        </div>
      ) : (
        <div className="col" style={{ gap: 9 }}>
          {items.map((r) => (
            <div key={r.id} className="glass card col" style={{ gap: 9, padding: 13 }}>
              <div className="row-between">
                <div>
                  <div className="row" style={{ gap: 7 }}>
                    <strong style={{ fontSize: '.88rem' }}>{r.fullName}</strong>
                    <span className={`badge ${r.status === 'new' ? 'badge-gold' : r.status === 'done' ? 'badge-green' : 'badge-green'}`} style={{ fontSize: '.6rem' }}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                  <div className="tiny dim" style={{ marginTop: 2 }}>
                    {r.typeTitle} · {formatJalali(r.createdAt)}
                  </div>
                </div>
                <div className="row" style={{ gap: 5 }}>
                  <a className="mini-btn" href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} aria-label="تماس">
                    <Phone size={14} />
                  </a>
                  <button
                    className="mini-btn danger"
                    onClick={() =>
                      update((d) => {
                        d.requests = d.requests.filter((x) => x.id !== r.id)
                      })
                    }
                    aria-label="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="row wrap tiny dim" style={{ gap: 12, lineHeight: 1.9 }}>
                <span dir="ltr">{toFa(r.phone)}</span>
                {r.age && <span>سن: {toFa(r.age)}</span>}
                {r.neighborhood && <span>محله: {r.neighborhood}</span>}
                {r.availability && <span className="row" style={{ gap: 4 }}><Clock3 size={11} />{r.availability}</span>}
              </div>
              {r.skills && <div className="tiny"><span className="dim">مهارت:</span> {r.skills}</div>}
              {r.note && <div className="tiny"><span className="dim">یادداشت:</span> {r.note}</div>}

              <div className="row" style={{ gap: 6 }}>
                {(['new', 'reviewed', 'done'] as const).map((s) => (
                  <button
                    key={s}
                    className={`chip chip-btn ${r.status === s ? 'active' : ''}`}
                    style={{ fontSize: '.68rem', padding: '5px 10px' }}
                    onClick={() =>
                      update((d) => {
                        const target = d.requests.find((x) => x.id === r.id)
                        if (target) target.status = s
                      })
                    }
                  >
                    {r.status === s && <Check size={11} />}
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CoopTypesManager />

      <div className="warn-note">
        <CheckCheck size={16} />
        <span>
          درخواست‌ها روی همین دستگاه ذخیره می‌شوند. برای دریافت فرم‌های ارسالی از گوشی‌های دیگر، ادمین
          می‌تواند فرم‌ها را در جلسه جمع‌آوری یا از خروجی اکسل استفاده کند.
        </span>
      </div>
    </div>
  )
}


function CoopTypesManager() {
  const { state, update } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const types = state.cooperationTypes

  const patch = (id: string, p: Partial<(typeof types)[number]>) => {
    update((d) => {
      const t = d.cooperationTypes.find((x) => x.id === id)
      if (t) Object.assign(t, p)
    })
  }

  return (
    <div className="form-section">
      <button
        className="row-between"
        style={{ width: '100%', textAlign: 'right' }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="form-section-title" style={{ margin: 0 }}>
          <Users size={16} />
          انواع همکاری ({toFa(types.length)})
        </span>
        <ChevronDown size={17} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s', opacity: 0.6 }} />
      </button>

      {open && (
        <div className="col" style={{ gap: 9 }}>
          <p className="tiny dim" style={{ lineHeight: 1.9 }}>
            این فهرست در فرم همکاری به کاربران نشان داده می‌شود. موارد غیرفعال پنهان می‌شوند.
          </p>
          {types.map((t) => (
            <div key={t.id} className="glass card col" style={{ gap: 7, padding: 11 }}>
              <div className="row" style={{ gap: 7 }}>
                <input
                  className="input"
                  style={{ minHeight: 40, padding: '8px 12px', fontSize: '.84rem' }}
                  value={t.title}
                  onChange={(e) => patch(t.id, { title: e.target.value })}
                />
                <button
                  className="mini-btn"
                  onClick={() => patch(t.id, { active: !t.active })}
                  aria-label="فعال/غیرفعال"
                  style={{ color: t.active ? '#9ff5d5' : 'rgba(212,235,225,.4)' }}
                >
                  <Power size={14} />
                </button>
                <button
                  className="mini-btn danger"
                  onClick={() =>
                    update((d) => {
                      d.cooperationTypes = d.cooperationTypes.filter((x) => x.id !== t.id)
                    })
                  }
                  aria-label="حذف"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                className="input"
                style={{ minHeight: 38, padding: '8px 12px', fontSize: '.78rem' }}
                value={t.description}
                onChange={(e) => patch(t.id, { description: e.target.value })}
                placeholder="توضیح کوتاه"
              />
              <div className="row wrap" style={{ gap: 4 }}>
                {COOPERATION_ICONS.map((icon) => (
                  <button
                    key={icon}
                    className={`chip chip-btn ${t.icon === icon ? 'active' : ''}`}
                    style={{ fontSize: '.6rem', padding: '3px 7px' }}
                    onClick={() => patch(t.id, { icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="row" style={{ gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                update((d) => {
                  d.cooperationTypes.push({
                    id: `coop-${Date.now()}`,
                    title: 'نوع همکاری جدید',
                    description: 'توضیح این نوع همکاری',
                    icon: 'HandHeart',
                    active: true,
                  })
                })
              }
            >
              <Plus size={14} />
              افزودن نوع
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => toast.success('تغییرات انواع همکاری ذخیره شد')}>
              <Save size={14} />
              ذخیره
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

