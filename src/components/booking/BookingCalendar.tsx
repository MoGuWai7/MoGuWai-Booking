/**
 * 파일 역할:
 * - 손님 예약 페이지의 월 단위 캘린더 컴포넌트입니다.
 * - 지난 날짜와 휴무일을 비활성 처리하고 선택 가능한 날짜만 클릭을 받습니다.
 *
 * 주의사항:
 * - blockedDates 는 ISO 형식 'YYYY-MM-DD' 문자열 배열입니다.
 * - 시간대 이슈를 피하기 위해 isoDate()는 로컬 타임존 기준으로 포맷합니다.
 */
'use client'

import { useState } from 'react'

interface BookingCalendarProps {
  blockedDates: string[]
  onSelect: (date: Date) => void
  selected: Date | null
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function BookingCalendar({ blockedDates, onSelect, selected }: BookingCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const blockedSet = new Set(blockedDates)

  function isoDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function isBlocked(day: number) {
    return blockedSet.has(isoDate(new Date(year, month, day)))
  }
  function isPast(day: number) {
    return new Date(year, month, day) < today
  }
  function isSelected(day: number) {
    if (!selected) return false
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day
  }
  function isToday(day: number) {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const canGoPrev = new Date(year, month - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1)

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--hairline)' }}
          aria-label="이전 달"
        >
          ‹
        </button>
        <span className="font-medium" style={{ color: 'var(--ink)' }}>
          {year}년 {MONTHS[month]}
        </span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--hairline)' }}
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className="text-center text-xs py-1.5 font-medium"
            style={{ color: i === 0 || i === 6 ? 'var(--ink-2)' : 'var(--ink-3)' }}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const past = isPast(day)
          const blocked = isBlocked(day)
          const sel = isSelected(day)
          const tod = isToday(day)
          const disabled = past || blocked

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(new Date(year, month, day))}
              className="relative flex flex-col items-center justify-center aspect-square rounded-lg text-sm font-medium transition-all"
              style={{
                background: sel
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(79, 70, 229, 0.14) 100%)'
                  : 'transparent',
                color: sel ? '#3730A3'
                  : disabled ? 'var(--ink-4)'
                  : 'var(--ink)',
                border: sel
                  ? '1px solid rgba(79, 70, 229, 0.35)'
                  : tod
                    ? '1px solid rgba(79, 70, 229, 0.45)'
                    : '1px solid transparent',
                boxShadow: sel ? '0 1px 2px rgba(79, 70, 229, 0.10), 0 4px 12px rgba(79, 70, 229, 0.12)' : 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textDecoration: blocked ? 'line-through' : 'none',
                fontWeight: sel ? 600 : tod ? 500 : 400,
              }}
            >
              <span>{day}</span>
              {blocked && (
                <span className="absolute bottom-0.5 text-[8px] font-medium" style={{ color: 'var(--danger)' }}>
                  휴무
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
