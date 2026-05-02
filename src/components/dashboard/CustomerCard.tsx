import type { Customer } from '@/types/database'
import Badge from '@/components/ui/Badge'

interface CustomerCardProps {
  customer: Customer
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  const lastVisited = customer.last_visited_at
    ? new Date(customer.last_visited_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : '-'

  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-medium flex-shrink-0 text-sm"
        style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--hairline)' }}
      >
        {customer.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm" style={{ color: 'var(--ink)' }}>
            {customer.name}
          </span>
          {customer.visit_count >= 3 && (
            <Badge variant="accent" className="text-[10px]">VIP</Badge>
          )}
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
          {customer.phone}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-num font-medium" style={{ color: 'var(--ink)' }}>
          {customer.visit_count}<span className="text-xs ml-0.5" style={{ color: 'var(--ink-3)' }}>회</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
          마지막 {lastVisited}
        </div>
      </div>
    </div>
  )
}
