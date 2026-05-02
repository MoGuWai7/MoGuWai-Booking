import type { ReservationStatus } from '@/types/database'

interface BadgeProps {
  children?: React.ReactNode
  variant?: 'accent' | 'warm' | 'success' | 'warning' | 'muted'
  status?: ReservationStatus
  className?: string
}

const statusConfig: Record<ReservationStatus, { label: string; chip: string }> = {
  pending: { label: '대기', chip: 'chip-warning' },
  confirmed: { label: '확정', chip: 'chip-accent' },
  completed: { label: '완료', chip: 'chip-success' },
  cancelled: { label: '취소', chip: 'chip-danger' },
}

export default function Badge({ children, variant = 'accent', status, className = '' }: BadgeProps) {
  if (status) {
    const cfg = statusConfig[status]
    return (
      <span className={`chip ${cfg.chip} ${className}`}>{cfg.label}</span>
    )
  }

  const variantClass: Record<NonNullable<BadgeProps['variant']>, string> = {
    accent: 'chip-accent',
    warm: 'chip-danger',
    success: 'chip-success',
    warning: 'chip-warning',
    muted: '',
  }

  return (
    <span className={`chip ${variantClass[variant]} ${className}`}>{children}</span>
  )
}
