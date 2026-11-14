import { useMemo, useState } from 'react'
import {
  Copy,
  Check,
  CreditCard,
  Landmark,
  ShieldCheck,
  HandHeart,
  ExternalLink,
  Info,
  Receipt,
  QrCode,
  MessageCircle,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useNavigate } from '../lib/router'
import { PageHeader } from '../components/Nav'
import { copyText } from '../lib/clipboard'
import { useToast } from '../lib/toast'
import { compactToman, formatNumber, formatToman, groupSheba, maskCard, normalizeSheba, toFa } from '../lib/format'
import { isPlaceholderAccount } from '../types'
import { QRCodeCanvas } from 'qrcode.react'

/** کارت پرداخت آنلاین: تنظیم شده توسط ادمین */
function useGateway(amount: number, purpose: string) {
  const { state } = useStore()
  const online = state.donation.online
  const ready = online.enabled && online.linkTemplate.trim().length > 0
  const url = useMemo(() => {
    if (!online.enabled) return ''
    const tpl = online.linkTemplate.trim()
    if (!tpl) return ''
    const rial = amount * 10
    return tpl
      .replaceAll('{amount}', String(rial))
      .replaceAll('{toman}', String(amount))
      .replaceAll('{purpose}', encodeURIComponent(purpose))
  }, [online.enabled, online.linkTemplate, amount, purpose])
  return { ready, url, provider: online.provider, note: online.note }
}

export function DonatePage() {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const toast = useToast()
  const donation = state.donation

  const [amount, setAmount] = useState<number>(donation.amounts[1] ?? 100000)
  const [customAmount, setCustomAmount] = useState('')
  const [purpose, setPurpose] = useState(donation.purposes[0] ?? 'نذورات و اطعام')
  const [tab, setTab] = useState<'online' | 'card'>('online')

  const finalAmount = customAmount ? Number(customAmount.replace(/\D/g, '')) || 0 : amount
  const gateway = useGateway(finalAmount, purpose)

  const handlePay = () => {
    if (!gateway.ready || !gateway.url) {
      toast.error('درگاه پرداخت آنلاین توسط خادمان تنظیم نشده است. از روش کارت‌به‌کارت استفاده کنید.')
      setTab('card')
      return
    }
    if (!finalAmount || finalAmount < 1000) {
      toast.error('حداقل مبلغ پرداخت ۱٬۰۰۰ تومان است')
      return
    }
    window.open(gateway.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page">
      <PageHeader title="نذورات و کمک‌ها" subtitle="هر کمک شما، لبخندی در محله" back="home" />

      <div className="glass card" style={{ background: 'linear-gradient(150deg, rgba(52,211,153,.16), rgba(8,30,22,.6))' }}>
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <span className="coop-icon" style={{ width: 44, height: 44 }}>
            <HandHeart size={21} />
          </span>
          <p className="small" style={{ lineHeight: 2.05, color: 'rgba(240,255,249,.86)' }}>
            {donation.intro}
          </p>
        </div>
      </div>

      <div className="segmented" role="tablist" aria-label="روش پرداخت">
        <button role="tab" aria-selected={tab === 'online'} onClick={() => setTab('online')}>
          <ExternalLink size={14} style={{ verticalAlign: -2, marginLeft: 4 }} />
          پرداخت آنلاین
        </button>
        <button role="tab" aria-selected={tab === 'card'} onClick={() => setTab('card')}>
          <CreditCard size={14} style={{ verticalAlign: -2, marginLeft: 4 }} />
          کارت / شبا
        </button>
      </div>

      {tab === 'online' && (
        <>
          <div className="form-section">
            <div className="form-section-title">
              <HandHeart size={16} />
              مبلغ نذر یا کمک
            </div>
            <div className="amount-grid">
              {donation.amounts.map((a) => (
                <button
                  key={a}
                  className="amount-btn"
                  aria-pressed={!customAmount && amount === a}
                  onClick={() => {
                    setAmount(a)
                    setCustomAmount('')
                  }}
                >
                  {formatNumber(a)}
                  <small>تومان</small>
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="custom-amount">یا مبلغ دلخواه (تومان)</label>
              <input
                id="custom-amount"
                className="input"
                inputMode="numeric"
                placeholder="مثلاً ۱۵۰۰۰۰"
                value={customAmount ? toFa(customAmount) : ''}
                onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))}
              />
            </div>
            <div className="row-between" style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(0,0,0,.24)' }}>
              <span className="tiny dim">مبلغ قابل پرداخت</span>
              <strong style={{ fontSize: '1.05rem', color: '#9ff5d5' }}>
                {formatNumber(finalAmount)} تومان
              </strong>
            </div>
            <div className="field">
              <label htmlFor="purpose">جهت مصرف</label>
              <select id="purpose" className="select" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                {donation.purposes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="gateway-card">
            <div className="row-between">
              <div className="row" style={{ gap: 10 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'rgba(245,215,142,.18)',
                    border: '1px solid rgba(245,215,142,.36)',
                    color: '#f5d78e',
                  }}
                >
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <div className="small bold">{gateway.provider || 'درگاه پرداخت آنلاین'}</div>
                  <div className="tiny dim">پرداخت امن با کارت بانکی (شتاب)</div>
                </div>
              </div>
              {gateway.ready ? <span className="badge badge-green">فعال</span> : <span className="badge badge-gold">در انتظار تنظیم</span>}
            </div>

            {!gateway.ready && (
              <div className="warn-note">
                <Info size={16} />
                <span>
                  درگاه آنلاین هنوز توسط ادمین قرارگاه تنظیم نشده است. در این مدت می‌توانید از روش
                  کارت‌به‌کارت یا شبا استفاده کنید — همه کمک‌ها در همان روز ثبت و پیگیری می‌شود.
                </span>
              </div>
            )}
            {gateway.note && <p className="tiny dim" style={{ lineHeight: 1.9 }}>{gateway.note}</p>}

            <button className="btn btn-gold btn-lg btn-block" onClick={handlePay} disabled={!finalAmount}>
              <ExternalLink size={18} />
              پرداخت {formatNumber(finalAmount)} تومانی
            </button>
            <p className="tiny dim" style={{ textAlign: 'center', lineHeight: 1.8 }}>
              با زدن این دکمه به درگاه بانکی منتقل می‌شوید. پرداخت شما برای {purpose} اختصاص می‌یابد.
            </p>
          </div>
        </>
      )}

      {tab === 'card' && (
        <>
          <div className="form-section">
            <div className="form-section-title">
              <HandHeart size={16} />
              مبلغ مورد نظر (برای یادداشت رسید)
            </div>
            <div className="amount-grid">
              {donation.amounts.map((a) => (
                <button
                  key={a}
                  className="amount-btn"
                  aria-pressed={!customAmount && amount === a}
                  onClick={() => {
                    setAmount(a)
                    setCustomAmount('')
                  }}
                >
                  {formatNumber(a)}
                  <small>تومان</small>
                </button>
              ))}
            </div>
            <input
              className="input"
              inputMode="numeric"
              placeholder="یا مبلغ دلخواه (تومان)"
              value={customAmount ? toFa(customAmount) : ''}
              onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))}
            />
          </div>

          <div className="col" style={{ gap: 10 }}>
            {donation.accounts.map((acc) => {
              const unset = isPlaceholderAccount(acc)
              return (
                <div key={acc.id} className="account-card">
                  <div className="row-between">
                    <div className="row" style={{ gap: 9 }}>
                      <Landmark size={17} style={{ color: '#f5d78e' }} />
                      <span className="small bold">{acc.bankName}</span>
                    </div>
                    {unset ? <span className="badge badge-gold">در انتظار تکمیل</span> : <span className="badge badge-green">فعال</span>}
                  </div>
                  <div>
                    <div className="tiny dim" style={{ marginBottom: 4 }}>
                      صاحب حساب: {acc.holder}
                    </div>
                    {unset ? (
                      <div className="warn-note" style={{ marginBottom: 10 }}>
                        <Info size={15} />
                        <span>شماره کارت و شبا توسط خادمان قرارگاه در حال تکمیل است. لطفاً کمی بعد دوباره مراجعه کنید یا با واحد مالی تماس بگیرید.</span>
                      </div>
                    ) : null}
                  </div>

                  <CopyRow
                    label="شماره کارت"
                    value={acc.cardNumber.replace(/\D/g, '')}
                    display={unset ? '—' : maskCard(acc.cardNumber)}
                    disabled={unset}
                  />
                  <CopyRow
                    label="شماره شبا (بدون IR)"
                    value={normalizeSheba(acc.sheba).replace(/^IR/i, '')}
                    display={unset ? '—' : groupSheba(normalizeSheba(acc.sheba))}
                    ltr
                    disabled={unset}
                  />
                  {acc.note && <p className="tiny dim">{acc.note}</p>}
                  {!unset && (
                    <details>
                      <summary
                        className="row tiny"
                        style={{ cursor: 'pointer', gap: 6, color: '#9ff5d5', listStyle: 'none' }}
                      >
                        <QrCode size={14} /> نمایش بارکد پرداخت (QR)
                      </summary>
                      <div style={{ display: 'grid', placeItems: 'center', padding: '12px 0 2px' }}>
                        <div style={{ background: '#fff', padding: 10, borderRadius: 14 }}>
                          <QRCodeCanvas
                            value={`${acc.cardNumber.replace(/\D/g, '')}|${normalizeSheba(acc.sheba)}`}
                            size={150}
                            level="M"
                            bgColor="#ffffff"
                            fgColor="#06241a"
                          />
                        </div>
                        <span className="tiny dim" style={{ marginTop: 7 }}>
                          اسکن برای یادداشت شماره حساب
                        </span>
                      </div>
                    </details>
                  )}
                </div>
              )
            })}
          </div>

          <div className="warn-note">
            <Receipt size={16} />
            <span>{donation.receiptNote}</span>
          </div>

          <button className="btn btn-ghost" onClick={() => navigate('contact')}>
            <MessageCircle size={16} />
            ارسال رسید به خادمان
          </button>
        </>
      )}

      <div className="glass card col" style={{ gap: 10 }}>
        <div className="row" style={{ gap: 9 }}>
          <ShieldCheck size={18} style={{ color: '#9ff5d5' }} />
          <strong style={{ fontSize: '.88rem' }}>امانت‌داری در نذورات</strong>
        </div>
        <p className="tiny muted" style={{ lineHeight: 2 }}>
          تمام نذورات و کمک‌ها در دفتر قرارگاه ثبت و در جلسه هفتگی خادمان گزارش می‌شود. گزارش هزینه‌کرد
          پویش‌ها به‌صورت شفاف در بخش «گزارش‌های تصویری» منتشر می‌شود. کد پیگیری پرداخت خود را تا زمان
          دریافت رسید نگه دارید.
        </p>
      </div>

      <p className="tiny dim center" style={{ lineHeight: 1.9 }}>
        مبالغ نمایش‌داده‌شده به تومان هستند و در درگاه آنلاین به ریال ارسال می‌شوند.
        {finalAmount > 0 && ` (${stringifyRial(finalAmount)})`}
      </p>
    </div>
  )
}

function stringifyRial(toman: number): string {
  return `${formatNumber(toman * 10)} ریال`
}

function CopyRow({
  label,
  value,
  display,
  ltr,
  disabled,
}: {
  label: string
  value: string
  display: string
  ltr?: boolean
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  const onCopy = async () => {
    if (disabled) {
      toast.error('این شماره هنوز توسط ادمین تکمیل نشده است')
      return
    }
    const ok = await copyText(value)
    if (ok) {
      setCopied(true)
      toast.success(`${label} کپی شد`)
      window.setTimeout(() => setCopied(false), 1800)
    } else {
      toast.error('کپی ناموفق بود؛ شماره را دستی انتخاب کنید')
    }
  }

  return (
    <div className="account-row">
      <div style={{ minWidth: 0 }}>
        <div className="tiny dim">{label}</div>
        <div className="account-value" style={{ direction: ltr ? 'ltr' : 'ltr', textAlign: 'right', fontSize: ltr ? '.86rem' : '.98rem' }}>
          {display}
        </div>
      </div>
      <button className={`copy-btn ${copied ? 'done' : ''}`} onClick={onCopy} aria-label={`کپی ${label}`}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'کپی شد' : 'کپی'}
      </button>
    </div>
  )
}

export function formatCompactLegacy(n: number) {
  return compactToman(n)
}

export function formatTomanLegacy(n: number) {
  return formatToman(n)
}
