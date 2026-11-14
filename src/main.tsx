import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

const splash = document.getElementById('boot-splash')
window.setTimeout(() => {
  splash?.setAttribute('data-hidden', 'true')
  window.setTimeout(() => splash?.remove(), 500)
}, 420)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
