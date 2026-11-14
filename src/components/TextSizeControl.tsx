import { useEffect, useState } from 'react'

type Size = 'normal' | 'large' | 'xlarge'
const KEY = 'gharargah-text-size'
const LABELS: Record<Size, string> = { normal: 'عادی', large: 'بزرگ', xlarge: 'بزرگ‌تر' }

function readSize(): Size {
  const v = localStorage.getItem(KEY) as Size | null
  return v === 'large' || v === 'xlarge' ? v : 'normal'
}

/** کنترل خوانایی برای همه سنین — اندازه متن کل برنامه */
export function TextSizeControl({ compact = false }: { compact?: boolean }) {
  const [size, setSize] = useState<Size>(readSize)

  useEffect(() => {
    document.documentElement.dataset.textSize = size
    try {
      localStorage.setItem(KEY, size)
    } catch {
      /* ignore */
    }
  }, [size])

  const cycle = () => {
    setSize((prev) => (prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'))
  }

  if (compact) {
    return (
      <button
        className="icon-btn text-size-btn"
        style={{ width: 40, height: 40, borderRadius: 13, fontWeight: 800, fontSize: '0.82rem' }}
        onClick={cycle}
        aria-label={`اندازه متن: ${LABELS[size]} — تغییر`}
        title={`اندازه متن: ${LABELS[size]}`}
      >
        {size === 'xlarge' ? 'A+' : size === 'large' ? 'A' : 'A'}
      </button>
    )
  }

  return (
    <div className="text-size-ctrl" role="group" aria-label="اندازه متن">
      {(['normal', 'large', 'xlarge'] as Size[]).map((s, i) => (
        <button
          key={s}
          className="text-size-btn"
          aria-pressed={size === s}
          onClick={() => setSize(s)}
          aria-label={`اندازه ${LABELS[s]}`}
          style={{ fontSize: `${0.68 + i * 0.16}rem` }}
        >
          A
        </button>
      ))}
    </div>
  )
}
