import { useMemo, useState } from 'react'
import {
  HandHeart,
  Camera,
  HeartHandshake,
  GraduationCap,
  Share2,
  Wallet,
  Mic,
  Utensils,
  BookOpen,
  Users,
  CheckCircle2,
  Send,
  CheckCheck,
  ClipboardList,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader } from '../components/Nav'
import { useToast } from '../lib/toast'
import { uid } from '../lib/id'
import { formatJalali, toFa } from '../lib/jalali'
import type { CooperationRequest } from '../types'

export const COOP_ICON_MAP: Record<string, LucideIcon> = {
  HandHeart,
  Camera,
  HeartHandshake,
  GraduationCap,
  Share2,
  Wallet,
  Mic,
  Utensils,
  BookOpen,
  Users,
}

const AVAILABILITY = ['صبح‌ها', 'بعدازظهرها', 'شب‌ها', 'آخر هفته‌ها', 'به‌صورت موردی', 'همه اوقات']

export function CooperatePage() {
  const { state, update } = useStore()
  const toast = useToast()
  const types = state.cooperationTypes.filter((t) => t.active)

  const [typeId, setTypeId] = useState<string>(types[0]?.id ?? '')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [availability, setAvailability] = useState<string[]>([])
  const [skills, setSkills] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [lastRef, setLastRef] = useState('')

  const myRequests = useMemo(() => {
    return [...state.requests]
      .filter((r) => r.phone.replace(/\D/g, '') && phone.replace(/\D/g, '').length >= 10 && r.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5)
  }, [state.requests, phone])

  const validate = () => {
    const e: Record<string, string> = {}
    if (fullName.trim().length < 3) e.fullName = 'نام و نام خانوادگی را کامل وارد کنید.'
    if (!/^09\d{9}$/.test(phone.replace(/\D/g, '').replace(/^۹/, '9'))) {
      e.phone = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.'
    }
    if (!typeId) e.typeId = 'نوع همکاری را انتخاب کنید.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) {
      toast.error('لطفاً خطاهای فرم را برطرف کنید')
      return
    }
    const type = state.cooperationTypes.find((t) => t.id === typeId)
    const request: CooperationRequest = {
      id: uid('coop'),
      fullName: fullName.trim(),
      phone: phone.trim(),
      age: age.trim(),
      neighborhood: neighborhood.trim(),
      typeId,
      typeTitle: type?.title ?? 'همکاری عمومی',
      availability: availability.join('، '),
      skills: skills.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
      status: 'new',
    }
    update((d) => {
      d.requests.unshift(request)
      d.notificationsLog.unshift({
        id: uid('n'),
        title: 'درخواست همکاری جدید',
        body: `${request.fullName} برای «${request.typeTitle}» ثبت‌نام کرد.`,
        kind: 'system',
        createdAt: new Date().toISOString(),
        sentBy: 'system',
      })
    })
    setLastRef(request.id.slice(-6).toUpperCase())
    setStep('done')
    toast.success('فرم همکاری با موفقیت ثبت شد')
    window.scrollTo({ top: 0 })
  }

  if (step === 'done') {
    return (
      <div className="page">
        <PageHeader title="ثبت درخواست" back="home" />
        <div className="glass card center col" style={{ alignItems: 'center', gap: 14, padding: '34px 20px' }}>
          <span
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(150deg, rgba(52,211,153,.3), rgba(16,120,90,.12))',
              border: '1px solid rgba(110,231,183,.45)',
              boxShadow: '0 0 0 10px rgba(16,185,129,.08)',
              color: '#b6f8dd',
            }}
          >
            <CheckCheck size={34} />
          </span>
          <h2 style={{ fontSize: '1.14rem' }}>درخواست شما ثبت شد</h2>
          <p className="small muted" style={{ maxWidth: 320, lineHeight: 2 }}>
            خادمان قرارگاه در اولین فرصت با شما تماس می‌گیرند. سپاس از همراهی شما در خدمت به محله.
          </p>
          <span className="chip">
            کد پیگیری: <strong style={{ letterSpacing: 1 }}>{lastRef}</strong>
          </span>
          <div className="col" style={{ width: '100%', gap: 9, marginTop: 6 }}>
            <button className="btn btn-primary btn-block" onClick={() => setStep('form')}>
              <HandHeart size={17} />
              ثبت همکاری دیگر
            </button>
            <a className="btn btn-ghost btn-block" href={`tel:${state.contactChannels[0]?.phone.replace(/[^\d]/g, '') || ''}`}>
              تماس با خادمان
            </a>
          </div>
        </div>
        <div className="warn-note">
          <CheckCircle2 size={16} />
          <span>درخواست شما فقط روی همین دستگاه ذخیره می‌شود؛ برای پیگیری رسمی با دفتر قرارگاه تماس بگیرید.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="فرم همکاری" subtitle="خادم قرارگاه شوید" back="home" />

      <div className="glass card">
        <div className="row" style={{ gap: 11, alignItems: 'flex-start' }}>
          <span className="coop-icon">
            <Users size={19} />
          </span>
          <p className="small muted" style={{ lineHeight: 2 }}>
            هر مهارتی که دارید، در قرارگاه جای خودش را دارد. نوع همکاری را انتخاب کنید و فرم را تکمیل
            کنید؛ خادمان مسئول همان بخش با شما تماس می‌گیرند.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="col" style={{ gap: 14 }}>
        <div className="form-section">
          <div className="form-section-title">
            <HandHeart size={16} />
            نوع همکاری
            {errors.typeId && <span className="tiny" style={{ color: '#ffc0c8' }}>— {errors.typeId}</span>}
          </div>
          <div className="coop-type-grid">
            {types.map((t) => {
              const Icon = COOP_ICON_MAP[t.icon] ?? HandHeart
              return (
                <button
                  type="button"
                  key={t.id}
                  className="coop-type"
                  aria-pressed={typeId === t.id}
                  onClick={() => setTypeId(t.id)}
                >
                  <span className="coop-icon">
                    <Icon size={19} />
                  </span>
                  <span className="coop-type-title">{t.title}</span>
                  <span className="coop-type-desc">{t.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <ClipboardList size={16} />
            مشخصات شما
          </div>
          <div className="field">
            <label htmlFor="fullName">نام و نام خانوادگی *</label>
            <input
              id="fullName"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثلاً حسین محمدی"
              autoComplete="name"
            />
            {errors.fullName && <span className="tiny" style={{ color: '#ffc0c8' }}>{errors.fullName}</span>}
          </div>
          <div className="grid-2" style={{ gap: 10 }}>
            <div className="field">
              <label htmlFor="phone">شماره موبایل *</label>
              <input
                id="phone"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                style={{ textAlign: 'right' }}
              />
              {errors.phone && <span className="tiny" style={{ color: '#ffc0c8' }}>{errors.phone}</span>}
            </div>
            <div className="field">
              <label htmlFor="age">سن (اختیاری)</label>
              <input
                id="age"
                className="input"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^\d۰-۹]/g, ''))}
                placeholder="—"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="neighborhood">محله / محدوده سکونت</label>
            <input
              id="neighborhood"
              className="input"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="مثلاً محله کرمان، کوچه شهید…"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <Send size={16} />
            زمان و توانمندی
          </div>
          <div className="field">
            <span className="label">زمان‌های مناسب شما</span>
            <div className="row wrap" style={{ gap: 7 }}>
              {AVAILABILITY.map((a) => {
                const on = availability.includes(a)
                return (
                  <button
                    type="button"
                    key={a}
                    className="chip chip-btn"
                    aria-pressed={on}
                    onClick={() =>
                      setAvailability((prev) => (on ? prev.filter((x) => x !== a) : [...prev, a]))
                    }
                  >
                    {on && <CheckCircle2 size={12} />}
                    {a}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="field">
            <label htmlFor="skills">مهارت‌ها یا تجربه‌های مرتبط</label>
            <input
              id="skills"
              className="input"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="مثلاً عکاسی با دوربین، کار با شبکه‌های اجتماعی…"
            />
          </div>
          <div className="field">
            <label htmlFor="note">توضیحات بیشتر (اختیاری)</label>
            <textarea
              id="note"
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="هر نکته‌ای که فکر می‌کنید خادمان باید بدانند"
              rows={3}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block">
          <Send size={18} />
          ثبت درخواست همکاری
        </button>
      </form>

      {myRequests.length > 0 && (
        <div className="section">
          <h3 className="section-title">
            <span className="bar" />
            درخواست‌های پیشین شما
          </h3>
          {myRequests.map((r) => (
            <div key={r.id} className="admin-row">
              <span className="admin-row-thumb" style={{ display: 'grid', placeItems: 'center' }}>
                <HandHeart size={18} />
              </span>
              <div className="admin-row-main">
                <div className="admin-row-title">{r.typeTitle}</div>
                <div className="admin-row-sub">
                  {formatJalali(r.createdAt)} · {statusFa(r.status)}
                </div>
              </div>
              <span className={`badge ${r.status === 'new' ? 'badge-gold' : r.status === 'done' ? 'badge-green' : 'badge-gold'}`}>
                {statusFa(r.status)}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="tiny dim center">
        اطلاعات شما فقط برای پیگیری همکاری استفاده می‌شود و هرگز به شخص ثالث داده نمی‌شود.
        {toFa(' ') }
      </p>
    </div>
  )
}

function statusFa(status: CooperationRequest['status']): string {
  if (status === 'new') return 'در انتظار بررسی'
  if (status === 'reviewed') return 'بررسی‌شده'
  return 'تأییدشده'
}
