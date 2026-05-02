/**
 * 파일 역할:
 * - 운영시간과 슬롯 단위를 받아 가능한 시간 격자를 만듭니다.
 * - 이미 잡힌 시간(bookedTimes)은 line-through + disabled 처리합니다.
 *
 * 주의사항:
 * - 마감 시간은 슬롯에 포함되지 않습니다 (close=18:00, slot=60이면 17:00이 마지막).
 *   시술/식사가 마감을 넘기지 않도록 하기 위함.
 */
'use client'

import { generateTimeSlots, formatTime } from '@/lib/utils'

interface TimeSlotGridProps {
  openTime: string
  closeTime: string
  slotDuration: number
  bookedTimes: string[]
  selected: string | null
  onSelect: (time: string) => void
}

export default function TimeSlotGrid({
  openTime,
  closeTime,
  slotDuration,
  bookedTimes,
  selected,
  onSelect,
}: TimeSlotGridProps) {
  const slots = generateTimeSlots(openTime, closeTime, slotDuration)
  const bookedSet = new Set(bookedTimes)

  if (slots.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--ink-3)' }}>
        예약 가능한 시간이 없습니다
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map(slot => {
        const booked = bookedSet.has(slot)
        const sel = selected === slot

        return (
          <button
            key={slot}
            type="button"
            disabled={booked}
            onClick={() => onSelect(slot)}
            className="py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: sel ? 'var(--ink)' : 'var(--surface)',
              border: `1px solid ${sel ? 'var(--ink)' : 'var(--hairline)'}`,
              color: sel ? 'var(--paper)' : booked ? 'var(--ink-4)' : 'var(--ink)',
              cursor: booked ? 'not-allowed' : 'pointer',
              textDecoration: booked ? 'line-through' : 'none',
              opacity: booked ? 0.6 : 1,
            }}
          >
            <span className="font-num">{formatTime(slot)}</span>
          </button>
        )
      })}
    </div>
  )
}
