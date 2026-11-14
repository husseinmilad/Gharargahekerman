import { Window } from 'happy-dom'
export {}
async function main() {
  const win = new Window({ url: 'http://www.test/#/admin', width: 420, height: 900 })
  const g = globalThis as any
  g.window = win; g.document = win.document
  Object.defineProperty(g, 'navigator', { value: win.navigator, configurable: true })
  g.HTMLElement = win.HTMLElement; g.Element = win.Element; g.Node = win.Node; g.Event = win.Event
  g.HashChangeEvent = win.HashChangeEvent
  g.getComputedStyle = win.getComputedStyle.bind(win)
  g.requestAnimationFrame = (cb: any) => setTimeout(cb, 0)
  g.cancelAnimationFrame = (id: any) => clearTimeout(id)
  g.localStorage = win.localStorage
  g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  g.IS_REACT_ACT_ENVIRONMENT = false
  Object.defineProperty(g, 'crypto', { value: (await import('node:crypto')).webcrypto, configurable: true })
  const errors: string[] = []
  console.error = (...a: any[]) => { const m = a.map(x => x instanceof Error ? x.message : String(x)).join(' '); if (!m.includes('not configured to support act')) errors.push(m.slice(0,200)) }
  win.addEventListener('error', (e: any) => errors.push('win: ' + e.message))

  const React = await import('react'); g.React = React
  const { createRoot } = await import('react-dom/client'); const { act } = await import('react')
  const App = (await import('../src/App.tsx')).default
  const container = win.document.createElement('div')
  win.document.body.appendChild(container)
  await act(async () => { createRoot(container).render(React.createElement(App)) })
  await new Promise(r => setTimeout(r, 300))
  const qa = (s: string) => Array.from(win.document.querySelectorAll(s)) as any[]
  const q = (s: string) => win.document.querySelector(s) as any
  const click = async (el: any) => { await act(async () => { el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true })) }); await new Promise(r => setTimeout(r, 160)) }
  const setVal = async (el: any, v: string, tag='input') => {
    await act(async () => {
      const proto = tag === 'textarea' ? win.HTMLTextAreaElement : win.HTMLInputElement
      Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set?.call(el, v)
      el.dispatchEvent(new win.Event('input', { bubbles: true }))
    })
    await new Promise(r => setTimeout(r, 60))
  }

  // ورود
  await setVal(q('#pin'), '4321'); await setVal(q('#pin2'), '4321')
  await click(qa('button').find(b => b.getAttribute('type') === 'submit'))
  await new Promise(r => setTimeout(r, 500))
  console.log('logged in:', (win.document.body.textContent ?? '').includes('پنل مدیریت قرارگاه'))

  const tabs = ['اخبار', 'مراسم‌ها', 'گزارش‌ها', 'نذورات', 'همکاری‌ها', 'پیام‌ها', 'اعلان‌ها', 'تنظیمات', 'داشبورد']
  for (const name of tabs) {
    errors.length = 0
    const tab = qa('.admin-tab').find(b => b.textContent.includes(name))
    await click(tab)
    await new Promise(r => setTimeout(r, 220))
    const txt = (win.document.body.textContent ?? '').replace(/\s+/g, ' ')
    console.log(`${errors.length ? '✗' : '✓'} ${name.padEnd(9)} len=${txt.length} ${errors.length ? '| ERR: ' + errors.slice(0,2).join(' // ') : ''}`)
  }

  // آزمون فرم مراسم: ساخت مراسم با اعلان
  await click(qa('.admin-tab').find(b => b.textContent.includes('مراسم‌ها')))
  await click(qa('button').find(b => b.textContent.includes('مراسم جدید')))
  const inputs = qa('input.input')
  console.log('event form fields:', inputs.length, '| has date input:', Boolean(q('input[type="date"]')), '| time:', Boolean(q('input[type="time"]')))
  await setVal(inputs[0], 'مراسم آزمایشی محله')
  const saveEv = qa('button').find(b => b.textContent.includes('ذخیره مراسم'))
  await click(saveEv)
  await new Promise(r => setTimeout(r, 400))
  const st = JSON.parse(win.localStorage.getItem('gharargah-kerman:state:v3') ?? '{}')
  console.log('event saved:', st.events?.some((e: any) => e.title === 'مراسم آزمایشی محله'), '| total:', st.events?.length)

  // آزمون تنظیمات: ذخیره نام
  await click(qa('.admin-tab').find(b => b.textContent.includes('تنظیمات')))
  const orgInput = qa('input.input')[0]
  await setVal(orgInput, 'قرارگاه مردمی — نام آزمایشی')
  await click(qa('button').find(b => b.textContent.trim() === 'ذخیره' || b.textContent.includes('ذخیره')))
  await new Promise(r => setTimeout(r, 300))
  const st2 = JSON.parse(win.localStorage.getItem('gharargah-kerman:state:v3') ?? '{}')
  console.log('settings saved:', st2.settings?.orgName)
  console.log('FINAL ERRORS:', errors)
  process.exit(0)
}
main()
