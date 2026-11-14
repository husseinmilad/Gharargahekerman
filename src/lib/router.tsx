import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home'; params: Record<string, string> }
  | { name: 'news'; params: Record<string, string> }
  | { name: 'newsDetail'; params: Record<string, string>; id: string }
  | { name: 'events'; params: Record<string, string> }
  | { name: 'eventDetail'; params: Record<string, string>; id: string }
  | { name: 'reports'; params: Record<string, string> }
  | { name: 'reportDetail'; params: Record<string, string>; id: string }
  | { name: 'donate'; params: Record<string, string> }
  | { name: 'cooperate'; params: Record<string, string> }
  | { name: 'contact'; params: Record<string, string> }
  | { name: 'about'; params: Record<string, string> }
  | { name: 'notifications'; params: Record<string, string> }
  | { name: 'admin'; params: Record<string, string> }
  | { name: 'notFound'; params: Record<string, string> }

function parse(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '')
  const [pathPart, queryPart] = clean.split('?')
  const parts = pathPart.split('/').filter(Boolean)
  const params: Record<string, string> = {}
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => {
      params[k] = v
    })
  }
  const [first, second] = parts
  switch (first) {
    case undefined:
    case '':
    case 'home':
      return { name: 'home', params }
    case 'news':
      return second ? { name: 'newsDetail', params, id: second } : { name: 'news', params }
    case 'events':
      return second ? { name: 'eventDetail', params, id: second } : { name: 'events', params }
    case 'reports':
      return second ? { name: 'reportDetail', params, id: second } : { name: 'reports', params }
    case 'donate':
      return { name: 'donate', params }
    case 'cooperate':
      return { name: 'cooperate', params }
    case 'contact':
      return { name: 'contact', params }
    case 'about':
      return { name: 'about', params }
    case 'notifications':
      return { name: 'notifications', params }
    case 'admin':
      return { name: 'admin', params }
    default:
      return { name: 'notFound', params }
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  const target = path.startsWith('#') ? path : `#/${path.replace(/^\/+/, '')}`
  if (opts.replace) {
    window.history.replaceState(null, '', target)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else if (window.location.hash !== target) {
    window.location.hash = target
  }
}

export function goBack(fallback = 'home') {
  // اگر تاریخچه درون برنامه باشد به عقب برمی‌گردیم، وگرنه به مسیر جایگزین می‌رویم
  const hash = window.location.hash
  const navAny = navigator as Navigator & { canGoBack?: () => boolean }
  const canGoBack = typeof navAny.canGoBack === 'function' ? navAny.canGoBack() : window.history.length > 1
  if (canGoBack && hash && hash !== '#/' && hash !== '') {
    window.history.back()
    // اگر مرورگر به عقب نرفت (مثلاً لینک مستقیم باز شده)، مسیر جایگزین فعال شود
    window.setTimeout(() => {
      if (window.location.hash === hash) navigate(fallback)
    }, 120)
  } else {
    navigate(fallback)
  }
}

export function routeTitle(route: Route): string {
  switch (route.name) {
    case 'home':
      return 'خانه'
    case 'news':
      return 'اخبار'
    case 'newsDetail':
      return 'خبر'
    case 'events':
      return 'مراسم‌ها'
    case 'eventDetail':
      return 'جزئیات مراسم'
    case 'reports':
      return 'گزارش‌ها'
    case 'reportDetail':
      return 'گزارش'
    case 'donate':
      return 'نذورات'
    case 'cooperate':
      return 'همکاری'
    case 'contact':
      return 'ارتباط با خادمان'
    case 'about':
      return 'درباره قرارگاه'
    case 'notifications':
      return 'اعلان‌ها'
    case 'admin':
      return 'مدیریت'
    default:
      return 'صفحه یافت نشد'
  }
}

/** دسترسی ساده به ناوبری در کامپوننت‌ها */
export function useNavigate() {
  return { navigate, goBack }
}
