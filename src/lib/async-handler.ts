import type React from 'react'

/**
 * هندلر async با گرفتن خطاها؛ از «Uncaught (in promise)» در فرم‌های ناهمگام
 * (مثل ورود ادمین که به Web Crypto نیاز دارد) جلوگیری می‌کند.
 */
export function asyncHandler<E extends React.SyntheticEvent>(
  fn: (event: E) => Promise<void> | void,
): (event: E) => void {
  return (event: E) => {
    try {
      const result = fn(event)
      if (result && typeof (result as Promise<void>).catch === 'function') {
        ;(result as Promise<void>).catch((err) => {
          console.error('خطای غیرمنتظره در رویداد:', err)
        })
      }
    } catch (err) {
      console.error('خطای غیرمنتظره در رویداد:', err)
    }
  }
}
