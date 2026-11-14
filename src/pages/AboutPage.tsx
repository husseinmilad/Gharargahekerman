import { Building2, MapPin, Clock3, ShieldCheck, HeartHandshake, Download, Smartphone, Github, Info, ExternalLink, LockKeyhole } from 'lucide-react'
import { useStore } from '../lib/store'
import { PageHeader } from '../components/Nav'
import { useNavigate } from '../lib/router'
import { LogoMark } from '../components/Logo'
import { InstallButton } from '../components/InstallButton'
import { toFa } from '../lib/jalali'
import { isNativeApp } from '../lib/notifications'

export function AboutPage() {
  const { state } = useStore()
  const { navigate } = useNavigate()
  const s = state.settings

  const installHint = () => {
    if (isNativeApp()) return 'شما از نسخه اندروید استفاده می‌کنید.'
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isIOS)
      return 'برای نصب: دکمه «اشتراک‌گذاری» مرورگر سافاری را بزنید و «افزودن به صفحه اصلی» را انتخاب کنید.'
    return 'برای نصب: از منوی مرورگر گزینه «نصب برنامه» یا «افزودن به صفحه اصلی» را بزنید.'
  }

  return (
    <div className="page">
      <PageHeader title="درباره قرارگاه" subtitle={`${s.orgName} — ${s.orgSubtitle}`} back="home" />

      <div className="glass card center col" style={{ alignItems: 'center', gap: 12, padding: '28px 18px' }}>
        <span className="brand-logo" style={{ width: 78, height: 78, borderRadius: 24 }}>
          <LogoMark />
        </span>
        <div>
          <h2 style={{ fontSize: '1.1rem' }}>{s.orgName}</h2>
          <div className="tiny dim">{s.orgSubtitle}</div>
        </div>
        <span className="chip" style={{ fontSize: '.76rem' }}>{s.motto}</span>
      </div>

      <div className="glass card prose">{s.aboutText}</div>

      <div className="form-section">
        <div className="form-section-title">
          <Building2 size={16} />
          اطلاعات تماس
        </div>
        <div className="row" style={{ gap: 11 }}>
          <span className="coop-icon"><MapPin size={17} /></span>
          <div>
            <div className="tiny dim">نشانی</div>
            <div className="small" style={{ lineHeight: 1.9 }}>{s.address}<br /><span className="tiny dim">{s.locationNote}</span></div>
          </div>
        </div>
        <div className="row" style={{ gap: 11 }}>
          <span className="coop-icon"><Clock3 size={17} /></span>
          <div>
            <div className="tiny dim">ساعات فعالیت</div>
            <div className="small">{s.workHours}</div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <Smartphone size={16} />
          نصب برنامه روی گوشی
        </div>
        <p className="small muted" style={{ lineHeight: 2 }}>{installHint()}</p>
        <InstallButton />
        <div className="row" style={{ gap: 8 }}>
          <span className="badge badge-green"><Download size={11} /> PWA آماده نصب</span>
          <span className="badge badge-gold"><Smartphone size={11} /> نسخه اندروید</span>
        </div>
        <p className="tiny dim" style={{ lineHeight: 1.9 }}>
          این نرم‌افزار به‌صورت PWA طراحی شده و روی اندروید، iOS و ویندوز نصب می‌شود. نسخه APK اندروید نیز
          از مخزن گیت‌هاب پروژه با GitHub Actions ساخته می‌شود.
        </p>
        <a
          className="btn btn-ghost btn-sm"
          href="https://github.com/husseinmilad/Gharargahekerman/releases/download/latest-android/gharargah-kerman-1.0.0.apk"
          target="_blank"
          rel="noopener noreferrer"
          style={{ alignSelf: 'flex-start' }}
        >
          <Github size={14} />
          دریافت فایل APK اندروید
          <ExternalLink size={12} />
        </a>
        <span className="tiny dim">نسخه ۱.۰.۰ — نصب مستقیم، بدون نیاز به گوگل‌پلی</span>
      </div>

      <div className="grid-2" style={{ gap: 10 }}>
        <div className="glass card col" style={{ gap: 6, padding: 14 }}>
          <ShieldCheck size={19} style={{ color: '#9ff5d5' }} />
          <strong style={{ fontSize: '.84rem' }}>حریم خصوصی</strong>
          <span className="tiny dim" style={{ lineHeight: 1.8 }}>اطلاعات شما فقط روی دستگاه خودتان ذخیره می‌شود.</span>
        </div>
        <div className="glass card col" style={{ gap: 6, padding: 14 }}>
          <HeartHandshake size={19} style={{ color: '#f5d78e' }} />
          <strong style={{ fontSize: '.84rem' }}>مردمی و خودجوش</strong>
          <span className="tiny dim" style={{ lineHeight: 1.8 }}>بدون وابستگی؛ با همت اهالی محله کرمان.</span>
        </div>
      </div>

      <button className="btn btn-ghost btn-block" onClick={() => navigate('admin')}>
        <LockKeyhole size={16} />
        ورود به بخش ویژه مدیریت
      </button>

      <div className="warn-note">
        <Info size={16} />
        <span>
          نرم‌افزار نسخه {toFa('1.0.0')} — داده‌ها روی همین دستگاه نگهداری می‌شوند. برای به‌روزرسانی
          محتوا، ادمین از پنل مدیریت استفاده می‌کند.
        </span>
      </div>
    </div>
  )
}
