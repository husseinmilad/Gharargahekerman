import { Window } from 'happy-dom'
export {}

async function main() {
  const win = new Window({ url: 'http://localhost:5173/#/home', width: 420, height: 900 })
  const g = globalThis as any
  g.window = win
  g.document = win.document
  Object.defineProperty(g, 'navigator', { value: win.navigator, configurable: true })
  g.HTMLElement = win.HTMLElement
  g.HTMLIFrameElement = win.HTMLIFrameElement
  g.Element = win.Element
  g.Node = win.Node
  g.Event = win.Event
  g.HashChangeEvent = win.HashChangeEvent
  g.getComputedStyle = win.getComputedStyle.bind(win)
  g.requestAnimationFrame = (cb: any) => setTimeout(cb, 0)
  g.cancelAnimationFrame = (id: any) => clearTimeout(id)
  g.localStorage = win.localStorage
  g.matchMedia = win.matchMedia?.bind(win) ?? (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  g.IS_REACT_ACT_ENVIRONMENT = false

  const errors: string[] = []
  const origError = console.error
  console.error = (...args: any[]) => {
    const msg = args.map((a) => (a instanceof Error ? a.message : String(a))).join(' ')
    if (!msg.includes('not configured to support act')) errors.push(msg.slice(0, 300))
  }
  win.addEventListener('error', (e: any) => errors.push('win-error: ' + e.message))

  const React = await import('react')
  g.React = React
  const { createRoot } = await import('react-dom/client')
  const { act } = await import('react')
  const App = (await import('../src/App.tsx')).default
  const container = win.document.createElement('div')
  win.document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(React.createElement(App))
  })
  await new Promise((r) => setTimeout(r, 400))

  const routes = [
    ['home', 'قرارگاه مردمی'],
    ['news', 'اخبار'],
    ['news/news-1', 'مهربانی کرمان'],
    ['events', 'مراسم‌ها'],
    ['events/event-1', 'جزئیات مراسم'],
    ['reports', 'گزارش‌های تصویری'],
    ['reports/report-1', 'گالری تصاویر'],
    ['donate', 'نذورات'],
    ['cooperate', 'فرم همکاری'],
    ['contact', 'ارتباط با خادمان'],
    ['about', 'درباره قرارگاه'],
    ['notifications', 'اعلان‌ها'],
    ['admin', 'بخش ویژه مدیریت'],
    ['nothing', 'صفحه پیدا نشد'],
  ]

  for (const [route, expect] of routes) {
    errors.length = 0
    await act(async () => {
      win.location.hash = '#/' + route
    })
    await new Promise((r) => setTimeout(r, 250))
    const text = (win.document.body.textContent ?? '').replace(/\s+/g, ' ')
    const ok = text.includes(expect)
    console.log(`${ok ? '✓' : '✗'} ${route}  len=${text.length}  ${ok ? '' : 'MISSING: ' + expect}`)
    if (errors.length) console.log('   ERRORS:', errors.slice(0, 3).join(' | '))
    if (process.env.SHOW && process.env.SHOW === route) console.log('   TEXT:', text.slice(0, 1400))
  }
  console.error = origError
  process.exit(0)
}
main()
