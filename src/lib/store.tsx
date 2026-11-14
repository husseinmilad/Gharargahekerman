import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval'
import type { AppSettings, AppState, DonationConfig } from '../types'
import { SCHEMA_VERSION, createSeedState } from '../types'
import { StoreContext } from './store-context'
import type { StoreContextValue } from './store-context'
import { pullRemote, remoteSource } from './remote'
import { applyRemote } from './remote'

const LS_STATE = 'gharargah-kerman:state:v3'
const LS_FIRST_RUN = 'gharargah-kerman:first-run'

/* ------------------------------------------------------------------ */
/*  دارایی‌های رسانه‌ای: آپلودها داخل IndexedDB و با پیشوند idb:       */
/* ------------------------------------------------------------------ */

const objectUrlCache = new Map<string, string>()

export async function saveAsset(file: Blob, hint = 'asset'): Promise<string> {
  const key = `asset:${hint}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
  await idbSet(key, file)
  return `idb:${key}`
}

export async function removeAsset(ref: string): Promise<void> {
  if (!ref.startsWith('idb:')) return
  const key = ref.slice(4)
  const cached = objectUrlCache.get(key)
  if (cached) URL.revokeObjectURL(cached)
  objectUrlCache.delete(key)
  await idbDel(key)
}

export async function resolveAsset(ref?: string): Promise<string | undefined> {
  if (!ref) return undefined
  if (ref.startsWith('idb:')) {
    const key = ref.slice(4)
    const hit = objectUrlCache.get(key)
    if (hit) return hit
    const blob = await idbGet<Blob>(key)
    if (!blob) return undefined
    const url = URL.createObjectURL(blob)
    objectUrlCache.set(key, url)
    return url
  }
  if (ref.startsWith('http') || ref.startsWith('data:') || ref.startsWith('blob:')) return ref
  const base =
    typeof import.meta.env !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : './'
  return `${base}${ref.replace(/^\.?\//, '')}`
}

/** فشرده‌سازی تصویر در مرورگر برای صرفه‌جویی در حجم */
export async function compressImage(file: File, maxSide = 1800, quality = 0.84): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1 && file.size < 700 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export async function saveImage(file: File, hint = 'img'): Promise<string> {
  const compressed = await compressImage(file)
  return saveAsset(compressed, hint)
}

/* ------------------------------------------------------------------ */
/*  وضعیت برنامه                                                      */
/* ------------------------------------------------------------------ */

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_STATE)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || parsed.schemaVersion !== SCHEMA_VERSION) {
      return migrate(parsed)
    }
    return parsed
  } catch {
    return createSeedState()
  }
}

function migrate(old: Partial<AppState> | null): AppState {
  const fresh = createSeedState()
  if (!old) return fresh
  return {
    ...fresh,
    ...old,
    schemaVersion: SCHEMA_VERSION,
    settings: { ...fresh.settings, ...(old.settings ?? {}) },
    donation: { ...fresh.donation, ...(old.donation ?? {}) },
    updatedAt: new Date().toISOString(),
  }
}

function persist(state: AppState) {
  try {
    localStorage.setItem(LS_STATE, JSON.stringify(state))
  } catch (err) {
    console.error('ذخیره‌سازی محلی ناموفق بود', err)
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const stateRef = useRef(state)
  stateRef.current = state

  const update = useCallback((mutate: (draft: AppState) => void) => {
    setState((prev) => {
      const draft: AppState = structuredClone(prev)
      mutate(draft)
      draft.updatedAt = new Date().toISOString()
      persist(draft)
      return draft
    })
  }, [])

  const resetAll = useCallback(() => {
    const fresh = createSeedState()
    persist(fresh)
    setState(fresh)
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      update((d) => {
        d.settings = { ...d.settings, ...patch }
      })
    },
    [update],
  )

  const updateDonation = useCallback(
    (patch: Partial<DonationConfig>) => {
      update((d) => {
        d.donation = { ...d.donation, ...patch }
      })
    },
    [update],
  )

  const exportState = useCallback(() => JSON.stringify(stateRef.current, null, 2), [])

  const importState = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as AppState
      if (!parsed || typeof parsed !== 'object' || !parsed.settings) return false
      const merged: AppState = { ...createSeedState(), ...parsed, schemaVersion: SCHEMA_VERSION }
      persist(merged)
      setState(merged)
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_STATE && e.newValue) {
        try {
          setState(JSON.parse(e.newValue) as AppState)
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // دریافت محتوای تازه منتشرشده (اخبار، مراسم و گزارش‌های جدید)
  const refreshRemote = useCallback(async (): Promise<{ applied: boolean; message: string }> => {
    const result = await pullRemote(stateRef.current)
    if (!result.ok) return { applied: false, message: result.reason ?? 'دریافت محتوا ناموفق بود' }
    if (!result.applied) return { applied: false, message: 'محتوا به‌روز است' }
    const res = await fetch(remoteSource(`t=${Math.floor(Date.now() / 60000)}`), { cache: 'no-store' })
    const json = (await res.json()) as Parameters<typeof applyRemote>[1]
    setState((prev) => {
      const next = applyRemote(prev, json)
      persist(next)
      return next
    })
    return { applied: true, message: 'محتوای جدید دریافت شد' }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshRemote().catch(() => undefined)
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [refreshRemote])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-seed', '#2fbf8f')
    if (!localStorage.getItem(LS_FIRST_RUN)) localStorage.setItem(LS_FIRST_RUN, '1')
  }, [])

  const value = useMemo<StoreContextValue>(
    () => ({ state, update, resetAll, updateSettings, updateDonation, importState, exportState, refreshRemote }),
    [state, update, resetAll, updateSettings, updateDonation, importState, exportState, refreshRemote],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export { useStore } from './store-context'
export { useNow } from './clock'

export async function clearAllAssets(): Promise<void> {
  const allKeys = await idbKeys()
  await Promise.all(
    allKeys
      .filter((k): k is string => typeof k === 'string' && k.startsWith('asset:'))
      .map((k) => idbDel(k)),
  )
  objectUrlCache.forEach((url) => URL.revokeObjectURL(url))
  objectUrlCache.clear()
}
