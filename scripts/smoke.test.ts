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
  await new Promise((r) => setTimeout(r, 900))

  const text = win.document.body.textContent ?? ''
  console.log('LENGTH', text.length)
  console.log('HAS_TITLE', text.includes('قرارگاه مردمی'))
  console.log('SAMPLE', text.replace(/\s+/g, ' ').slice(0, 600))
  console.log('NAV_ITEMS', win.document.querySelectorAll('.nav-item').length)
  console.log('GLASS_CARDS', win.document.querySelectorAll('.glass').length)
  console.log('ERRORS', g.__errors ?? 'none')
  process.exit(0)
}

main()
