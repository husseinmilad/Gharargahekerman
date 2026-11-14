import { useEffect, useMemo } from 'react'
import { useRoute, useNavigate } from './lib/router'
import type { Route } from './lib/router'
import { useStore, StoreProvider } from './lib/store'
import { ToastProvider, useToast } from './lib/toast'
import { BottomNav } from './components/Nav'
import { HomePage } from './pages/HomePage'
import { NewsPage, NewsDetailPage } from './pages/NewsPage'
import { EventsPage, EventDetailPage } from './pages/EventsPage'
import { ReportsPage, ReportDetailPage } from './pages/ReportsPage'
import { DonatePage } from './pages/DonatePage'
import { CooperatePage } from './pages/CooperatePage'
import { ContactPage } from './pages/ContactPage'
import { AboutPage } from './pages/AboutPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { AdminPage } from './pages/admin/AdminPage'
import { syncReminders } from './lib/notifications'
import { ScrollReset } from './components/SmartRouter'
import { EmptyState } from './components/EmptyState'
import { ShieldCheck } from 'lucide-react'

function PublicView({ route }: { route: Route }) {
  const body = (() => {
    switch (route.name) {
      case 'home':
        return <HomePage />
      case 'news':
        return <NewsPage />
      case 'newsDetail':
        return <NewsDetailPage id={route.id} />
      case 'events':
        return <EventsPage />
      case 'eventDetail':
        return <EventDetailPage id={route.id} />
      case 'reports':
        return <ReportsPage />
      case 'reportDetail':
        return <ReportDetailPage id={route.id} />
      case 'donate':
        return <DonatePage />
      case 'cooperate':
        return <CooperatePage />
      case 'contact':
        return <ContactPage />
      case 'about':
        return <AboutPage />
      case 'notifications':
        return <NotificationsPage />
      default:
        return (
          <div className="page" style={{ paddingTop: 60 }}>
            <EmptyState
              title="صفحه پیدا نشد"
              description="آدرس مورد نظر در نرم‌افزار وجود ندارد."
              action={
                <button className="btn btn-primary" onClick={() => useNavigate().navigate('home')}>
                  بازگشت به خانه
                </button>
              }
            />
          </div>
        )
    }
  })()

  return (
    <>
      <div className="app-main">{body}</div>
      <AdminFab />
      <BottomNav />
    </>
  )
}

/** دسترسی سریع به پنل مدیریت برای خادمان (پشتیبان رمز) */
function AdminFab() {
  const { navigate } = useNavigate()
  return (
    <button className="admin-fab" onClick={() => navigate('admin')} aria-label="ورود به بخش مدیریت">
      <ShieldCheck size={14} />
      مدیریت
    </button>
  )
}

function Shell() {
  const route = useRoute()
  const { state } = useStore()
  const toast = useToast()

  // همگام‌سازی یادآوری مراسم‌ها با تغییر داده‌ها
  useEffect(() => {
    const run = () => {
      void syncReminders(state).catch(() => undefined)
    }
    run()
    const t = window.setInterval(run, 4 * 60 * 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [state])

  // اطلاع‌رسانی درباره نسخه جدید PWA
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          installing?.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              toast.show('نسخه جدید نرم‌افزار آماده است؛ صفحه را دوباره باز کنید.', 'info')
            }
          })
        })
      })
      .catch(() => undefined)
  }, [toast])

  useEffect(() => {
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'fa'
    const size = localStorage.getItem('gharargah-text-size')
    if (size) document.documentElement.dataset.textSize = size
  }, [])

  const dep = useMemo(
    () =>
      route.name === 'newsDetail' || route.name === 'eventDetail' || route.name === 'reportDetail'
        ? `${route.name}:${route.id}`
        : route.name,
    [route],
  )

  return (
    <div className={route.name === 'admin' ? '' : 'app-shell'}>
      <ScrollReset dep={dep} />
      {route.name === 'admin' ? <AdminPage /> : <PublicView route={route} />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  )
}
