import { useEffect, useState } from 'react'
import { Download, CheckCircle2, Share } from 'lucide-react'
import { useToast } from '../lib/toast'
import { isNativeApp } from '../lib/notifications'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** نصب PWA در مرورگر (اندروید/دسکتاپ) با راهنمای iOS */
export function InstallButton({ block = true }: { block?: boolean }) {
  const toast = useToast()
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(
    typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true),
  )
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (isNativeApp()) return null

  if (installed) {
    return (
      <div className="row tiny" style={{ gap: 7, color: '#9ff5d5', lineHeight: 1.9 }}>
        <CheckCircle2 size={16} />
        برنامه روی این دستگاه نصب شده است.
      </div>
    )
  }

  const onClick = async () => {
    if (promptEvent) {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
        toast.success('نصب برنامه آغاز شد')
      }
      setPromptEvent(null)
      return
    }
    toast.show(
      isIOS
        ? 'در سافاری دکمه اشتراک‌گذاری را بزنید و «افزودن به صفحه اصلی» را انتخاب کنید.'
        : 'از منوی مرورگر گزینه «نصب برنامه» یا «افزودن به صفحه اصلی» را انتخاب کنید.',
      'info',
    )
  }

  return (
    <button className={`btn btn-primary ${block ? 'btn-block' : ''}`} onClick={onClick}>
      {isIOS ? <Share size={17} /> : <Download size={17} />}
      {isIOS ? 'راهنمای نصب در آیفون' : 'نصب برنامه روی گوشی'}
    </button>
  )
}
