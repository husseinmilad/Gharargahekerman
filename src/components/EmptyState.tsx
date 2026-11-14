import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      {icon ?? <Sparkles size={26} />}
      <strong>{title}</strong>
      {description && <span className="tiny" style={{ maxWidth: 300 }}>{description}</span>}
      {action}
    </div>
  )
}
