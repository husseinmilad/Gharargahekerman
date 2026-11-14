import { Window } from 'happy-dom'
export {}
async function main() {
  const win = new Window({ url: 'http://www.test/#/cooperate', width: 420, height: 900 })
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
  const orig = console.error
  console.error = (...a: any[]) => { const m = a.map(x => x instanceof Error ? x.message : String(x)).join(' '); if (!m.includes('not configured to support act')) errors.push(m.slice(0,200)) }

  const React = await import('react'); g.React = React
  const { createRoot } = await import('react-dom/client')
  const { act } = await import('react')
  const App = (await import('../src/App.tsx')).default
  const container = win.document.createElement('div')
  win.document.body.appendChild(container)
  await act(async () => { createRoot(container).render(React.createElement(App)) })
  await new Promise(r => setTimeout(r, 300))

  const qa = (s: string) => Array.from(win.document.querySelectorAll(s)) as any[]
  const setVal = async (el: any, v: string, tag = 'input') => {
    await act(async () => {
      const proto = tag === 'textarea' ? win.HTMLTextAreaElement : win.HTMLInputElement
      Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set?.call(el, v)
      el.dispatchEvent(new win.Event('input', { bubbles: true }))
    })
    await new Promise(r => setTimeout(r, 60))
  }
  const click = async (el: any) => {
    await act(async () => { el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true })) })
    await new Promise(r => setTimeout(r, 180))
  }

  console.log('cooperate page:', (win.document.body.textContent ?? '').includes('فرم همکاری'))
  const coopTypes = qa('.coop-type')
  console.log('coop types rendered:', coopTypes.length)
  await click(coopTypes[2]) // تیم پشتیبانی
  await setVal(win.document.querySelector('#fullName'), 'حسین محمدی')
  await setVal(win.document.querySelector('#phone'), '09123456789')
  await setVal(win.document.querySelector('#neighborhood'), 'محله کرمان')
  await setVal(win.document.querySelector('#skills'), 'آشپزی و پذیرایی')
  const availChip = qa('.chip-btn').find(b => b.textContent.includes('شب‌ها'))
  await click(availChip)
  const submit = qa('button').find(b => b.getAttribute('type') === 'submit')
  await click(submit)
  await new Promise(r => setTimeout(r, 400))
  const afterCoop = win.document.body.textContent ?? ''
  console.log('coop submitted:', afterCoop.includes('درخواست شما ثبت شد'))
  const stored = JSON.parse(win.localStorage.getItem('gharargah-kerman:state:v3') ?? '{}')
  console.log('stored requests:', stored.requests?.length, '| type:', stored.requests?.[0]?.typeTitle, '| phone:', stored.requests?.[0]?.phone)

  // فرم تماس
  await act(async () => { win.location.hash = '#/contact' })
  await new Promise(r => setTimeout(r, 250))
  console.log('contact page:', (win.document.body.textContent ?? '').includes('ارتباط با خادمان'))
  await setVal(win.document.querySelector('#c-name'), 'زهرا احمدی')
  await setVal(win.document.querySelector('#c-phone'), '09120000000')
  await setVal(win.document.querySelector('#c-body'), 'پیشنهاد می‌کنم برنامه قرائت قرآن هفتگی برگزار شود.', 'textarea')
  const sendBtn = qa('button').find(b => b.getAttribute('type') === 'submit')
  await click(sendBtn)
  await new Promise(r => setTimeout(r, 300))
  const stored2 = JSON.parse(win.localStorage.getItem('gharargah-kerman:state:v3') ?? '{}')
  console.log('contact submitted:', (win.document.body.textContent ?? '').includes('کد پیگیری پیام'), '| messages:', stored2.messages?.length)

  // تغییر اندازه متن (دسترس‌پذیری)
  await act(async () => { win.location.hash = '#/about' })
  await new Promise(r => setTimeout(r, 200))
  const aaBtns = qa('.text-size-btn')
  console.log('text size buttons:', aaBtns.length, '| groups:', win.document.querySelectorAll('.text-size-ctrl').length, '| compact:', win.document.querySelectorAll('.icon-btn.text-size-btn').length)
  if (aaBtns.length) {
    await click(aaBtns[0])
    console.log('html data-text-size after cycle:', win.document.documentElement.dataset.textSize, '| stored:', win.localStorage.getItem('gharargah-text-size'))
  }
  console.log('ERRORS:', errors)
  console.error = orig
  process.exit(0)
}
main()
