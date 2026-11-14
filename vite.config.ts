import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { cp, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

/** کپی محتوای منتشرشده (content/) داخل خروجی build تا همه کاربران آن را دریافت کنند */
/** در حالت dev، مسیر /content/* را به پوشه content/ نگاشت می‌کند */
function serveContent(): Plugin {
  return {
    name: 'serve-content',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/content', (req, res, next) => {
        const file = `content${(req.url ?? '').split('?')[0]}`
        if (!existsSync(file)) {
          res.statusCode = 404
          res.end('not found')
          return
        }
        import('node:fs').then(({ createReadStream }) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          createReadStream(file).pipe(res)
        }).catch(next)
      })
    },
  }
}

function copyContent(): Plugin {
  return {
    name: 'copy-content',
    apply: 'build',
    async closeBundle() {
      if (!existsSync('content')) return
      await mkdir('dist/content', { recursive: true })
      await cp('content', 'dist/content', { recursive: true })
      console.log('✓ content/ → dist/content')
    },
  }
}

// Relative base so the same build works on GitHub Pages sub-paths and inside Capacitor (Android)
export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // اجازه‌دادن به دامنه پیش‌نمایش محیط ابری تا صفحه در مرورگر کاربر باز شود
    allowedHosts: true,
    // در حالت توسعه، محتوای منتشرشده از پوشه content/ سرو می‌شود
    fs: { allow: ['.'] },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2019',
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1200,
  },
  plugins: [
    react(),
    copyContent(),
    serveContent(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: [
        'icon.svg',
        'icons/apple-touch-icon.png',
        'icons/favicon-32.png',
        'media/hero.jpg',
        'og-image.jpg',
      ],
      manifest: {
        name: 'قرارگاه مردمی مدافعان وطن — محله کرمان',
        short_name: 'قرارگاه کرمان',
        description:
          'نرم‌افزار جامع قرارگاه مردمی مدافعان وطن محله کرمان: نذورات و کمک‌ها، مراسم، گزارش‌های تصویری و صوتی، همکاری و ارتباط با خادمان.',
        lang: 'fa',
        dir: 'rtl',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#04120d',
        theme_color: '#0a1f18',
        categories: ['lifestyle', 'social', 'education'],
        id: './',
        prefer_related_applications: false,
        screenshots: [
          { src: 'media/hero.jpg', sizes: '1672x941', type: 'image/jpeg', form_factor: 'wide', label: 'صفحه اول قرارگاه' },
        ],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'مراسم پیش رو', short_name: 'مراسم', url: './#/events', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'پرداخت نذورات', short_name: 'نذورات', url: './#/donate', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico,jpg,json}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
})
