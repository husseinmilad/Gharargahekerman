import { Window } from 'happy-dom'
export {}
async function main() {
  const win = new Window({ url: 'http://www.test/#/home', width: 420, height: 900 })
  const g = globalThis as any
  g.window = win; g.document = win.document
  Object.defineProperty(g, 'navigator', { value: win.navigator, configurable: true })
  Object.defineProperty(g, 'crypto', { value: (await import('node:crypto')).webcrypto, configurable: true })
  g.HTMLElement = win.HTMLElement; g.Element = win.Element; g.Node = win.Node; g.Event = win.Event
  g.HashChangeEvent = win.HashChangeEvent
  g.getComputedStyle = win.getComputedStyle.bind(win)
  g.requestAnimationFrame = (cb: any) => setTimeout(cb, 0)
  g.localStorage = win.localStorage
  g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  g.IS_REACT_ACT_ENVIRONMENT = false

  // فایل content واقعی را شبیه‌سازی می‌کنیم
  const payload = JSON.parse(await (await import('node:fs/promises')).readFile('content/app-state.json', 'utf8'))
  payload.updatedAt = new Date(Date.now() + 60_000).toISOString() // جدیدتر از داده‌های محلی
  payload.news = [{ ...payload.news[0], title: 'خبر منتشرشده از گیت‌هاب برای همه کاربران' }]
  g.fetch = async () => new Response(JSON.stringify(payload), { status: 200 })

  const React = await import('react'); g.React = React
  const { createRoot } = await import('react-dom/client'); const { act } = await import('react')
  const App = (await import('../src/App.tsx')).default
  const c = win.document.createElement('div'); win.document.body.appendChild(c)
  await act(async () => { createRoot(c).render(React.createElement(App)) })
  await new Promise(r => setTimeout(r, 3600)) // انتظار برای همگام‌سازی خودکار (۲.۵ ثانیه)
  const text = win.document.body.textContent ?? ''
  console.log('remote content applied:', text.includes('خبر منتشرشده از گیت‌هاب برای همه کاربران'))
  console.log('news cards:', win.document.querySelectorAll('.news-hero-card, .news-row').length)
  const stored = JSON.parse(win.localStorage.getItem('gharargah-kerman:state:v3') ?? '{}')
  console.log('persisted news:', stored.news?.length, '| first title:', stored.news?.[0]?.title?.slice(0, 40))
  process.exit(0)
}
main()
