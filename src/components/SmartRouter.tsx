import { useEffect } from 'react'
import type { ReactNode } from 'react'

/** اسکرول به بالا در تغییر مسیر */
export function ScrollReset({ dep }: { dep: string }): ReactNode {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [dep])
  return null
}
