/* ------------------------------------------------------------------
 *  اعلان‌ها: PWA (Service Worker) + اندروید (Capacitor)
 * ------------------------------------------------------------------ */

import { Capacitor } from '@capacitor/core'
import type { AppState, EventItem } from '../types'

const SENT_KEY = 'gharargah-reminders-sent-v1'
const BASE = typeof import.meta.env !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : './'

export const isNativeApp = () => Capacitor.isNativePlatform()
export const isAndroid = () => Capacitor.getPlatform() === 'android'

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

let nativeNotificationsModule: typeof import('@capacitor/local-notifications') | null = null

async function nativeNotifications() {
  if (!isNativeApp()) return null
  if (!nativeNotificationsModule) {
    nativeNotificationsModule = await import('@capacitor/local-notifications')
  }
  return nativeNotificationsModule
}

export async function getPermissionState(): Promise<PermissionState> {
  if (isNativeApp()) {
    const mod = await nativeNotifications()
    if (!mod) return 'unsupported'
    const res = await mod.LocalNotifications.checkPermissions()
    return res.display === 'granted' ? 'granted' : res.display === 'denied' ? 'denied' : 'prompt'
  }
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as PermissionState
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (isNativeApp()) {
    const mod = await nativeNotifications()
    if (!mod) return 'unsupported'
    const res = await mod.LocalNotifications.requestPermissions()
    return res.display === 'granted' ? 'granted' : res.display === 'denied' ? 'denied' : 'prompt'
  }
  if (typeof Notification === 'undefined') return 'unsupported'
  const result = await Notification.requestPermission()
  return result as PermissionState
}

async function showBrowserNotification(title: string, body: string, tag?: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: `${BASE}icons/icon-192.png`,
        badge: `${BASE}icons/badge-72.png`,
        dir: 'rtl',
        lang: 'fa',
        tag,
        data: { url: `${BASE}#/notifications` },
      } as NotificationOptions)
      return true
    }
  } catch {
    /* fall back blow */
  }
  try {
    new Notification(title, { body, dir: 'rtl', lang: 'fa', tag })
    return true
  } catch {
    return false
  }
}

/** اعلان فوری (مثلاً وقتی ادمین خبری را منتشر می‌کند) */
export async function notifyNow(title: string, body: string, tag = `now-${Date.now()}`) {
  if (isNativeApp()) {
    const mod = await nativeNotifications()
    if (!mod) return false
    const perm = await getPermissionState()
    if (perm !== 'granted') return false
    await mod.LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 2_000_000_000),
          title,
          body,
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#2fbf8f',
          sound: 'default',
        },
      ],
    })
    return true
  }
  return showBrowserNotification(title, body, tag)
}

function readSent(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function writeSent(map: Record<string, number>) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

export function reminderTime(event: EventItem): number {
  return event.startsAt - event.reminderMinutes * 60_000
}

export function pendingReminders(state: AppState, now = Date.now()) {
  const sent = readSent()
  return state.events
    .filter((e) => e.notify && e.startsAt > now)
    .map((e) => ({ event: e, at: reminderTime(e), sent: sent[e.id] === reminderTime(e) }))
    .sort((a, b) => a.at - b.at)
}

function isQuietHour(state: AppState, at = new Date()): boolean {
  const q = state.settings.notifications.quietHours
  if (!q.enabled) return false
  const h = at.getHours()
  return q.from <= q.to ? h >= q.from && h < q.to : h >= q.from || h < q.to
}

/** برنامه‌ریزی یادآوری‌ها: در اندروید اعلان بومی زمان‌بندی می‌شود، در وب در زمان مناسب */
export async function syncReminders(state: AppState, force = false) {
  if (!state.settings.notifications.enabled) return
  const perm = await getPermissionState()
  if (perm !== 'granted') return

  const now = Date.now()
  const sent = readSent()

  if (isNativeApp()) {
    const mod = await nativeNotifications()
    if (!mod) return
    const pending = await mod.LocalNotifications.getPending()
    const pendingIds = new Set(pending.notifications.map((n) => n.id))
    for (const event of state.events) {
      if (!event.notify || event.startsAt <= now) continue
      const at = reminderTime(event)
      const id = hashId(event.id)
      const marker = sent[event.id]
      if (marker === at && !force) continue
      if (at <= now) continue
      if (pendingIds.has(id) && marker !== at) {
        await mod.LocalNotifications.cancel({ notifications: [{ id }] })
      }
      try {
        await mod.LocalNotifications.schedule({
          notifications: [
            {
              id,
              title: `یادآوری مراسم: ${event.title}`,
              body: `${formatReminderBody(event)}`,
              schedule: { at: new Date(at), allowWhileIdle: true },
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#2fbf8f',
              sound: 'default',
            },
          ],
        })
        sent[event.id] = at
      } catch (err) {
        console.warn('زمان‌بندی اعلان ناموفق', err)
      }
    }
    writeSent(sent)
    return
  }

  // وب: هر بار که برنامه باز است، یادآوری‌های سررسیده را نمایش بده
  for (const [eventId, at] of Object.entries(sent)) {
    if (at < now - 6 * 3600_000) delete sent[eventId]
  }
  for (const event of state.events) {
    if (!event.notify || event.startsAt <= now) continue
    const at = reminderTime(event)
    if (sent[event.id] === at) continue
    if (now >= at && now < event.startsAt && !isQuietHour(state)) {
      const ok = await showBrowserNotification(
        `یادآوری مراسم: ${event.title}`,
        formatReminderBody(event),
        `event-${event.id}`,
      )
      if (ok) sent[event.id] = at
    }
  }
  writeSent(sent)
}

function formatReminderBody(event: EventItem): string {
  const d = new Date(event.startsAt)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `امروز ساعت ${hh}:${mm} — ${event.location}`
}

function hashId(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h) % 2_000_000_000 || 1
}

export async function clearReminders() {
  if (!isNativeApp()) return
  const mod = await nativeNotifications()
  if (!mod) return
  const pending = await mod.LocalNotifications.getPending()
  if (pending.notifications.length) {
    await mod.LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    })
  }
}

/** تست اعلان از پنل ادمین */
export async function sendTestNotification() {
  const perm = await requestNotificationPermission()
  if (perm !== 'granted') return false
  return notifyNow(
    'اعلان آزمایشی قرارگاه',
    'اگر این پیام را می‌بینید، اعلان‌های نرم‌افزار درست کار می‌کنند.',
    'test-notification',
  )
}

/** به‌روزرسانی Service Worker برای دریافت نسخه جدید */
export async function applyUpdate() {
  const reg = await navigator.serviceWorker?.getRegistration()
  reg?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  window.location.reload()
}
