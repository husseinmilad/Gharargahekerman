import { createContext, useContext } from 'react'
import { useNow as useNowImpl } from './clock'
import type { AppSettings, AppState, DonationConfig } from '../types'

export interface StoreContextValue {
  state: AppState
  update: (mutate: (draft: AppState) => void) => void
  resetAll: () => void
  updateSettings: (patch: Partial<AppSettings>) => void
  updateDonation: (patch: Partial<DonationConfig>) => void
  importState: (json: string) => boolean
  exportState: () => string
  /** دریافت محتوای تازه منتشرشده از مخزن */
  refreshRemote: () => Promise<{ applied: boolean; message: string }>
}

export const StoreContext = createContext<StoreContextValue | null>(null)

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('StoreProvider یافت نشد')
  return ctx
}

/** ساعت زنده برای شمارش معکوس‌ها */
export function useNowInterval(intervalMs = 30_000): number {
  return useNowImpl(intervalMs)
}
