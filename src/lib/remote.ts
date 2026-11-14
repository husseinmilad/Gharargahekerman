/* ------------------------------------------------------------------
 *  همگام‌سازی محتوای منتشرشده از مخزن گیت‌هاب
 *  ادمین از پنل، فایل محتوا را به‌روزرسانی می‌کند و همه کاربران
 *  نسخه تازه را دریافت می‌کنند. (بدون نیاز به سرور جداگانه)
 * ------------------------------------------------------------------ */

import type { AppState } from '../types'
import { SCHEMA_VERSION } from '../types'

const LS_LAST = 'gharargah-kerman:last-remote-sync'
const LS_SOURCE = 'gharargah-kerman:remote-source'
const DEFAULT_SOURCE = 'content/app-state.json'

/** در tsx/Node مقدار import.meta.env تعریف نشده است */
const BASE = typeof import.meta.env !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : './'

export function remoteSource(suffix = ''): string {
  const custom = localStorage.getItem(LS_SOURCE)
  const base = custom && custom.trim() ? custom.trim() : DEFAULT_SOURCE
  const relative = base.startsWith('http') ? base : `${BASE}${base.replace(/^\.?\//, '')}`
  if (suffix && base.startsWith('http')) return relative + (relative.includes('?') ? '&' : '?') + suffix
  return relative + (relative.includes('?') ? '&' : '?') + suffix
}

export function setRemoteSource(path: string) {
  if (path.trim()) localStorage.setItem(LS_SOURCE, path.trim())
  else localStorage.removeItem(LS_SOURCE)
}

export function getRemoteSource(): string {
  return localStorage.getItem(LS_SOURCE) ?? DEFAULT_SOURCE
}

export function lastSyncAt(): number {
  return Number(localStorage.getItem(LS_LAST) ?? 0)
}

interface RemotePayload {
  schemaVersion: number
  updatedAt: string
  settings?: Partial<AppState['settings']>
  news?: AppState['news']
  events?: AppState['events']
  reports?: AppState['reports']
  cooperationTypes?: AppState['cooperationTypes']
  donation?: Partial<AppState['donation']>
  contactChannels?: AppState['contactChannels']
}

function isPayload(value: unknown): value is RemotePayload {
  return Boolean(value && typeof value === 'object' && 'updatedAt' in (value as object))
}

export interface RemoteResult {
  ok: boolean
  updatedAt?: string
  applied?: boolean
  reason?: string
}

/** دریافت محتوای منتشرشده؛ در صورت جدیدتر بودن، اعمال می‌شود */
export async function pullRemote(current: AppState): Promise<RemoteResult> {
  try {
    const res = await fetch(remoteSource(`t=${Math.floor(Date.now() / 60000)}`), { cache: 'no-store' })
    if (!res.ok) return { ok: false, reason: `پاسخ ${res.status}` }
    const json: unknown = await res.json()
    if (!isPayload(json)) return { ok: false, reason: 'ساختار فایل محتوا نامعتبر است' }
    if (json.schemaVersion !== SCHEMA_VERSION) return { ok: false, reason: 'نسخه محتوا ناسازگار است' }
    const remoteAt = Date.parse(json.updatedAt)
    if (!Number.isFinite(remoteAt)) return { ok: false, reason: 'تاریخ محتوا نامعتبر است' }
    const neverSynced = !localStorage.getItem(LS_LAST)
    const currentAt = Date.parse(current.updatedAt)
    // نخستین دریافت همیشه اعمال می‌شود تا محتوای منتشرشده جای داده‌های نمونه را بگیرد
    if (!neverSynced && remoteAt <= (Number.isFinite(currentAt) ? currentAt : 0)) {
      localStorage.setItem(LS_LAST, String(Date.now()))
      return { ok: true, updatedAt: json.updatedAt, applied: false, reason: 'up-to-date' }
    }
    localStorage.setItem(LS_LAST, String(Date.now()))
    return { ok: true, updatedAt: json.updatedAt, applied: true, reason: neverSynced ? 'first-sync' : 'newer' }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'خطای شبکه' }
  }
}

/** استخراج داده محتوایی برای انتشار (بدون داده‌های شخصی درخواست‌ها و پیام‌ها) */
export function contentForPublish(state: AppState) {
  return {
    schemaVersion: state.schemaVersion,
    updatedAt: state.updatedAt,
    settings: state.settings,
    news: state.news,
    events: state.events,
    reports: state.reports,
    cooperationTypes: state.cooperationTypes,
    donation: state.donation,
    contactChannels: state.contactChannels,
  }
}

/** اعمال محتوای دریافتی روی وضعیت فعلی (فقط بخش‌های عمومی) */
export function applyRemote(state: AppState, remote: RemotePayload): AppState {
  return {
    ...state,
    updatedAt: remote.updatedAt,
    settings: { ...state.settings, ...(remote.settings ?? {}), adminPinHash: state.settings.adminPinHash },
    news: remote.news ?? state.news,
    events: remote.events ?? state.events,
    reports: remote.reports ?? state.reports,
    cooperationTypes: remote.cooperationTypes ?? state.cooperationTypes,
    donation: { ...state.donation, ...(remote.donation ?? {}) },
    contactChannels: remote.contactChannels ?? state.contactChannels,
  }
}
