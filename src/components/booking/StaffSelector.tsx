'use client'

import type { Staff } from '@/types/database'

interface StaffSelectorProps {
  staff: Staff[]
  selected: string | null
  onSelect: (staffId: string) => void
}

export default function StaffSelector({ staff, selected, onSelect }: StaffSelectorProps) {
  const active = staff.filter(s => s.is_active)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {active.map(s => {
        const sel = selected === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
            style={{
              background: sel ? 'var(--ink)' : 'var(--surface)',
              border: `1px solid ${sel ? 'var(--ink)' : 'var(--hairline)'}`,
              color: sel ? 'var(--paper)' : 'var(--ink)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: sel ? 'rgba(255,255,255,0.12)' : 'var(--surface-2)',
                color: sel ? 'var(--paper)' : 'var(--ink-2)',
                border: sel ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--hairline)',
              }}
            >
              {s.name.charAt(0)}
            </div>
            <span className="text-sm font-medium">{s.name}</span>
          </button>
        )
      })}
    </div>
  )
}
