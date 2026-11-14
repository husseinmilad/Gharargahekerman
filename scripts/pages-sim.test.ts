import { Window } from 'happy-dom'
import { readFileSync } from 'node:fs'
export {}
async function main() {
  const win = new Window({ url: 'http://localhost:8099/Gharargahekerman/#/home' })
  const g = globalThis as any
  g.window = win; g.document = win.document
  Object.defineProperty(g, 'navigator', { value: win.navigator, configurable: true })
  g.HTMLElement = win.HTMLElement; g.Element = win.Element; g.Node = win.Node; g.Event = win.Event
  g.HashChangeEvent = win.HashChangeEvent
  g.getComputedStyle = win.getComputedStyle.bind(win)
  g.requestAnimationFrame = (cb: any) => setTimeout(cb, 0)
  g.localStorage = win.localStorage
  g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  g.IS_REACT_ACT_ENVIRONMENT = false
  // BASE_URL مانند GitHub Pages زیرمسیر
  Object.defineProperty(import.meta, 'env', { value: { BASE_URL: '/Gharargahekerman/' }, configurable: true })
  const React = await import('react'); g.React = React
  const { createRoot } = await import('react-dom/client'); const { act } = await import('react')
  const { resolveAsset } = await import('../src/lib/store.tsx')
  const resolved = await resolveAsset('media/hero.jpg')
  console.log('resolveAsset under base:', resolved)
  const html = readFileSync('/tmp/subpath/Gharargahekerman/index.html', 'utf8')
  console.log('index has relative assets:', html.includes('src="./assets/'))
  console.log('index no absolute /src:', !html.includes('src="/src'))
  process.exit(resolved === '/Gharargahekerman/media/hero.jpg' ? 0 : 1)
}
main()
