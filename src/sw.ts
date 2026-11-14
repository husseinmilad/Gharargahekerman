/// <reference lib="WebWorker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string | null }>
}

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

/* هواشناسی: کش کوتاه‌مدت برای مشاهده آفلاین آخرین وضعیت */
registerRoute(
  ({ url }) => url.hostname === 'api.open-meteo.com',
  new NetworkFirst({
    cacheName: 'weather-cache',
    networkTimeoutSeconds: 6,
    plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 60 * 60 * 6 })],
  }),
)

/* تصاویر و رسانه‌های محلی */
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (request.destination === 'image' || /\.(png|jpe?g|webp|avif|svg|gif)$/i.test(url.pathname)),
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 160, maxAgeSeconds: 60 * 60 * 24 * 60 })],
  }),
)

/* قلم و استایل */
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin && (request.destination === 'font' || request.destination === 'style'),
  new StaleWhileRevalidate({ cacheName: 'assets-cache' }),
)

/* محتوای منتشرشده (content/) همیشه تازه بررسی شود */
registerRoute(
  ({ url }) => url.pathname.includes('/content/'),
  new NetworkFirst({ cacheName: 'content-cache', networkTimeoutSeconds: 5 }),
)

/* صفحات: کش شبکه‌اول */
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages-cache', networkTimeoutSeconds: 4 }),
)

/* اعلان‌ها */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const target = (event.notification.data as { url?: string } | undefined)?.url ?? self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          void (client as WindowClient).navigate(target)
          return (client as WindowClient).focus()
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
