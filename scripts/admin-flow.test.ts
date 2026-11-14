import { Window } from 'happy-dom'
export {}

async function main() {
  const win = new Window({ url: 'http://localhost:5173/#/admin', width: 420, height: 900 })
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
  Object.defineProperty(g, 'crypto', { value: (await import('node:crypto')).webcrypto, configurable: true })
  console.log('crypto.subtle:', typeof g.crypto?.subtle)
  Object.defineProperty(g, 'crypto', { value: (await import('node:crypto')).webcrypto, configurable: true })
  const errors: string[] = []
  const orig = console.error
  console.error = (...a: any[]) => {
    const m = a.map((x) => (x instanceof Error ? x.message : String(x))).join(' ')
    if (!m.includes('not configured to support act')) { errors.push(m.slice(0, 240)); orig('CAPTURED>', ...a) }
  }

  const React = await import('react')
  g.React = React
  const { createRoot } = await import('react-dom/client')
  const { act } = await import('react')
  const App = (await import('../src/App.tsx')).default
  const container = win.document.createElement('div')
  win.document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(React.createElement(App)))
  await new Promise((r) => setTimeout(r, 300))

  const q = (sel: string) => win.document.querySelector(sel) as any
  const qa = (sel: string) => Array.from(win.document.querySelectorAll(sel)) as any[]
  const fire = async (el: any, type: string, value?: string) => {
    await act(async () => {
      if (value !== undefined) {
        const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value')?.set
        setter?.call(el, value)
        el.dispatchEvent(new win.Event('input', { bubbles: true }))
      }
      el.dispatchEvent(new win.Event(type, { bubbles: true }))
    })
    await new Promise((r) => setTimeout(r, 120))
  }

  console.log('STEP1 login screen:', (win.document.body.textContent ?? '').includes('بخش ویژه مدیریت'))
  console.log('   inputs found:', win.document.querySelectorAll('input').length, '| ids:', Array.from(win.document.querySelectorAll('input')).map((i: any) => i.id || i.type).join(','))
  const pin = q('#pin')
  const pin2 = q('#pin2')
  await fire(pin, 'input', '1234')
  await fire(pin2, 'input', '1234')
  console.log('   pin values:', q('#pin')?.value, q('#pin2')?.value)
  const form = q('form')
  console.log('   has form:', Boolean(form), '| session:', Boolean(win.localStorage.getItem('gharargah-admin-session-v1')))
  console.log('   body after submit:', (win.document.body.textContent ?? '').replace(/\s+/g, ' ').slice(0, 320))
  // کلیک روی دکمه submit به‌جای رویداد submit فرم
  const submitBtn = qa('button').find((b) => b.getAttribute('type') === 'submit' || b.textContent.includes('تنظیم رمز و ورود'))
  console.log('   submitBtn found:', Boolean(submitBtn), '| btns:', qa('button').length, '| types:', qa('button').slice(0,12).map((b)=>b.getAttribute('type')+':'+(b.textContent||'').trim().slice(0,12)).join(' / '))
  await act(async () => {
    submitBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }))
  })
  await new Promise((r) => setTimeout(r, 900))
  console.log('after click body:', (win.document.body.textContent ?? '').replace(/\s+/g, ' ').slice(0, 200))
  await act(async () => {
    await new Promise((r) => setTimeout(r, 600))
  })
  console.log('   session2:', win.localStorage.getItem('gharargah-admin-session-v1'))
  console.log('STEP2 logged in:', (win.document.body.textContent ?? '').includes('پنل مدیریت قرارگاه'))
  console.log('   tabs:', qa('.admin-tab').length)
  console.log('   stat cards:', qa('.stat-card').length)
  console.log('   errors:', errors.slice(0, 2))

  // برو به تب اخبار و باز کن فرم خبر جدید
  const newsTab = qa('.admin-tab').find((b) => b.textContent.includes('اخبار'))
  await fire(newsTab, 'click')
  const addBtn = qa('button').find((b) => b.textContent.includes('خبر جدید'))
  await fire(addBtn, 'click')
  console.log('STEP3 news form:', (win.document.body.textContent ?? '').includes('خبر جدید'))
  console.log('   inputs:', qa('input.input, textarea.textarea').length)
  const titleInput = qa('input.input')[0]
  await fire(titleInput, 'input', 'خبر آزمایشی از پنل')
  const saveBtn = qa('button').find((b) => b.textContent.trim() === 'ذخیره' || b.textContent.includes('ذخیره'))
  await fire(saveBtn, 'click')
  await new Promise((r) => setTimeout(r, 300))
  const stored = JSON.parse(win.localStorage.getItem('gharargah-kerman:state:v3') ?? '{}')
  console.log('STEP4 persisted news count:', stored.news?.length, '| first:', stored.news?.[0]?.title)
  console.log('   pin hash saved:', Boolean(stored.settings?.adminPinHash))
  console.log('FINAL errors:', errors.slice(0, 3))
  console.error = orig
  process.exit(0)
}
main()
