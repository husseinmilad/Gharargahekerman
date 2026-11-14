import { useState } from 'react'
import { Plus, Trash2, Save, CreditCard, Landmark, HandHeart, ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useToast } from '../../lib/toast'
import { uid } from '../../lib/id'
import { formatNumber, normalizeCard, toFa } from '../../lib/format'
import { isPlaceholderAccount } from '../../types'
import type { BankAccount, DonationConfig } from '../../types'
import { AdminField, Toggle } from './ui'

export function AdminDonation() {
  const { state, updateDonation, update } = useStore()
  const toast = useToast()
  const [draft, setDraft] = useState<DonationConfig>(state.donation)
  const [dirty, setDirty] = useState(false)

  const patch = (p: Partial<DonationConfig>) => {
    setDraft((d) => ({ ...d, ...p }))
    setDirty(true)
  }

  const save = () => {
    for (const acc of draft.accounts) {
      const digits = acc.cardNumber.replace(/\D/g, '')
      if (digits.length !== 0 && digits.length !== 16) {
        toast.error(`شماره کارت «${acc.bankName}» باید ۱۶ رقم باشد`)
        return
      }
      const shebaDigits = acc.sheba.replace(/[^0-9]/g, '')
      if (shebaDigits.length !== 0 && shebaDigits.length !== 24) {
        toast.error(`شماره شبای «${acc.bankName}» باید ۲۴ رقم باشد`)
        return
      }
    }
    updateDonation(draft)
    setDirty(false)
    toast.success('تنظیمات نذورات ذخیره شد')
  }

  const setAccount = (id: string, patchAcc: Partial<BankAccount>) => {
    patch({
      accounts: draft.accounts.map((a) => (a.id === id ? { ...a, ...patchAcc } : a)),
    })
  }

  const addAccount = () => {
    patch({
      accounts: [
        ...draft.accounts,
        {
          id: uid('acc'),
          bankName: 'بانک …',
          cardNumber: '',
          sheba: '',
          holder: state.settings.orgName,
        },
      ],
    })
  }

  const amountInput = draft.amounts.join('، ')

  return (
    <div className="col" style={{ gap: 13 }}>
      <div className="row-between">
        <h2 className="section-title">
          <span className="bar" />
          نذورات و کمک‌ها
        </h2>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!dirty}>
          <Save size={15} />
          {dirty ? 'ذخیره تغییرات' : 'ذخیره‌شده'}
        </button>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <HandHeart size={16} />
          متن معرفی و مبالغ پیشنهادی
        </div>
        <AdminField label="متن معرفی بخش نذورات">
          <textarea className="textarea" value={draft.intro} onChange={(e) => patch({ intro: e.target.value })} rows={4} />
        </AdminField>
        <AdminField label="مبالغ پیشنهادی (تومان)" hint="با «،» جدا کنید. مثلاً: 50000، 100000، 500000">
          <input
            className="input"
            dir="ltr"
            value={amountInput}
            onChange={(e) =>
              patch({
                amounts: e.target.value
                  .split(/[،,]/)
                  .map((v) => Number(v.replace(/\D/g, '')))
                  .filter((n) => n > 0)
                  .slice(0, 8),
              })
            }
          />
        </AdminField>
        <div className="row wrap" style={{ gap: 6 }}>
          {draft.amounts.map((a) => (
            <span key={a} className="chip" style={{ fontSize: '.72rem' }}>
              {formatNumber(a)} تومان
            </span>
          ))}
        </div>
        <AdminField label="جهت‌های مصرف" hint="هر جهت در یک خط">
          <textarea
            className="textarea"
            style={{ minHeight: 90 }}
            value={draft.purposes.join('\n')}
            onChange={(e) => patch({ purposes: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
            rows={4}
          />
        </AdminField>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <ShieldCheck size={16} />
          درگاه پرداخت آنلاین
        </div>
        <Toggle checked={draft.online.enabled} onChange={(v) => patch({ online: { ...draft.online, enabled: v } })} label="فعال‌بودن پرداخت آنلاین" />
        <AdminField label="نام درگاه / ارائه‌دهنده">
          <input
            className="input"
            value={draft.online.provider}
            onChange={(e) => patch({ online: { ...draft.online, provider: e.target.value } })}
            placeholder="مثلاً زرین‌پال، آی‌دی‌پی، درگاه بانک"
          />
        </AdminField>
        <AdminField
          label="الگوی لینک پرداخت"
          hint="از {amount} برای مبلغ (به ریال) استفاده کنید. مثال: https://gateway.example/pay?amount={amount}"
        >
          <input
            className="input"
            dir="ltr"
            value={draft.online.linkTemplate}
            onChange={(e) => patch({ online: { ...draft.online, linkTemplate: e.target.value } })}
            placeholder="https://…?amount={amount}"
          />
        </AdminField>
        {draft.online.linkTemplate.trim() === '' && (
          <div className="warn-note">
            <AlertTriangle size={15} />
            <span>
              تا زمانی که لینک درگاه تنظیم نشود، دکمه پرداخت آنلاین غیرفعال می‌ماند و کاربران به روش
              کارت‌به‌کارت هدایت می‌شوند.
            </span>
          </div>
        )}
        {draft.online.linkTemplate.trim() !== '' && (
          <a className="btn btn-ghost btn-sm" href={draft.online.linkTemplate.replace('{amount}', '10000')} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} />
            آزمایش لینک با مبلغ نمونه
          </a>
        )}
        <AdminField label="یادداشت زیر دکمه پرداخت">
          <input className="input" value={draft.online.note} onChange={(e) => patch({ online: { ...draft.online, note: e.target.value } })} />
        </AdminField>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <CreditCard size={16} />
          شماره کارت و شبا
        </div>
        {draft.accounts.map((acc) => (
          <div key={acc.id} className="glass card col" style={{ gap: 10, padding: 13 }}>
            <div className="row-between">
              <span className="row" style={{ gap: 7 }}>
                <Landmark size={15} color="#f5d78e" />
                <strong style={{ fontSize: '.82rem' }}>{acc.bankName || 'حساب جدید'}</strong>
              </span>
              {isPlaceholderAccount(acc) && <span className="badge badge-gold" style={{ fontSize: '.6rem' }}>ناقص</span>}
              {draft.accounts.length > 1 && (
                <button
                  className="mini-btn danger"
                  onClick={() => patch({ accounts: draft.accounts.filter((a) => a.id !== acc.id) })}
                  aria-label="حذف حساب"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <AdminField label="نام بانک">
              <input className="input" value={acc.bankName} onChange={(e) => setAccount(acc.id, { bankName: e.target.value })} />
            </AdminField>
            <AdminField label="شماره کارت (۱۶ رقم)">
              <input
                className="input"
                dir="ltr"
                inputMode="numeric"
                value={toFa(acc.cardNumber)}
                onChange={(e) =>
                  setAccount(acc.id, {
                    cardNumber: normalizeCard(
                      e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))),
                    ),
                  })
                }
                placeholder="6037-xxxx-xxxx-xxxx"
              />
            </AdminField>
            <AdminField label="شماره شبا (۲۴ رقم بدون IR)">
              <input
                className="input"
                dir="ltr"
                value={toFa(acc.sheba)}
                onChange={(e) =>
                  setAccount(acc.id, {
                    sheba: `IR${e.target.value
                      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                      .replace(/[^0-9]/g, '')
                      .slice(0, 24)}`,
                  })
                }
                placeholder="IR000000000000000000000000"
              />
            </AdminField>
            <AdminField label="نام صاحب حساب">
              <input className="input" value={acc.holder} onChange={(e) => setAccount(acc.id, { holder: e.target.value })} />
            </AdminField>
            <AdminField label="یادداشت (اختیاری)">
              <input className="input" value={acc.note ?? ''} onChange={(e) => setAccount(acc.id, { note: e.target.value })} />
            </AdminField>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={addAccount} style={{ alignSelf: 'flex-start' }}>
          <Plus size={14} />
          افزودن حساب دیگر
        </button>
      </div>

      <div className="form-section">
        <AdminField label="پیام پس از واریز (راهنمای ارسال رسید)">
          <textarea className="textarea" value={draft.receiptNote} onChange={(e) => patch({ receiptNote: e.target.value })} rows={3} />
        </AdminField>
      </div>

      <button className="btn btn-primary btn-block" onClick={save} disabled={!dirty}>
        <Save size={16} />
        ذخیره تنظیمات نذورات
      </button>

      <button
        className="btn btn-ghost btn-sm"
        onClick={() => {
          update((d) => {
            d.notificationsLog.unshift({
              id: uid('n'),
              title: 'گزارش نذورات',
              body: 'یادآوری: گزارش هزینه‌کرد نذورات را در جلسه هفتگی ارائه دهید.',
              kind: 'system',
              createdAt: new Date().toISOString(),
              sentBy: 'admin',
            })
          })
          toast.success('یادداشت گزارش در فهرست اعلان‌ها ثبت شد')
        }}
      >
        ثبت یادداشت گزارش هزینه‌کرد
      </button>
    </div>
  )
}
