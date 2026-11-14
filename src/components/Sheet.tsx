import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  center?: boolean
}

export function Sheet({ open, title, onClose, children, center }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className={`sheet-backdrop ${center ? 'modal-center' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title ?? 'پنجره'}>
        <div className="sheet-handle" />
        {title && (
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem' }}>{title}</h2>
            <button className="icon-btn" onClick={onClose} aria-label="بستن" style={{ width: 38, height: 38 }}>
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'تأیید',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Sheet open={open} onClose={onCancel} center title={title}>
      <p className="muted" style={{ fontSize: '0.9rem', lineHeight: 2, marginBottom: 18 }}>
        {body}
      </p>
      <div className="row" style={{ gap: 10 }}>
        <button className="btn btn-ghost grow" onClick={onCancel}>
          انصراف
        </button>
        <button className={`btn grow ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}
