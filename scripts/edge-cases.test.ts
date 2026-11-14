import { Window } from 'happy-dom'
export {}
async function main() {
  const win = new Window({ url: 'http://www.test/#/home', width: 360, height: 640 })
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
  // حالت «همه داده حذف شده» — نباید خطا بدهد
  const empty = {
    schemaVersion: 3, updatedAt: new Date().toISOString(),
    settings: { orgName: 'قرارگاه', orgSubtitle: 'کرمان', motto: '', aboutText: '', address: '', locationNote: '', workHours: '',
      heroImage: '', heroTitle: 'عنوان', heroSubtitle: '', weather: { label: 'تهوا', city: 'تهران', latitude: 35, longitude: 51 },
      notifications: { enabled: true, leadOptions: [60], defaultLeadMinutes: 60, quietHours: { enabled: false, from: 23, to: 7 } },
      adminPinHash: '', socials: [] },
    news: [], events: [], reports: [], cooperationTypes: [], requests: [], messages: [],
    donation: { intro: '', amounts: [], purposes: [], accounts: [], online: { enabled: false, provider: '', linkTemplate: '', note: '' }, receiptNote: '' },
    contactChannels: [], notificationsLog: [],
  }
  win.localStorage.setItem('gharargah-kerman:state:v3', JSON.stringify(empty))
  const errors: string[] = []
  console.error = (...a: any[]) => { const m = a.map(x => x instanceof Error ? x.message : String(x)).join(' '); if (!m.includes('not configured to support act')) errors.push(m.slice(0,150)) }
  const React = await import('react'); g.React = React
  const { createRoot } = await import('react-dom/client'); const { act } = await import('react')
  const App = (await import('../src/App.tsx')).default
  const c = win.document.createElement('div'); win.document.body.appendChild(c)
  await act(async () => { createRoot(c).render(React.createElement(App)) })
  await new Promise(r => setTimeout(r, 400))
  for (const r of ['home','events','news','reports','donate','cooperate','contact','about','notifications']) {
    errors.length = 0
    await act(async () => { win.location.hash = '#/' + r })
    await new Promise(x => setTimeout(x, 200))
    const len = (win.document.body.textContent ?? '').length
    console.log(`${errors.length ? '✗' : '✓'} ${r.padEnd(14)} len=${len} ${errors.length ? errors[0] : ''}`)
  }
  process.exit(0)
}
main()
