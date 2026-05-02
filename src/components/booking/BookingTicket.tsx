'use client'

import { useState } from 'react'
import type { Business, Staff, Reservation } from '@/types/database'
import { formatDate, formatTime } from '@/lib/utils'

interface BookingTicketProps {
  reservation: Reservation
  business: Business
  staff: Staff | null
}

export default function BookingTicket({ reservation, business, staff }: BookingTicketProps) {
  const [copied, setCopied] = useState(false)

  const copyNumber = async () => {
    await navigator.clipboard.writeText(reservation.reservation_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reservedDate = new Date(reservation.reserved_at)
  const timeStr = `${String(reservedDate.getHours()).padStart(2, '0')}:${String(reservedDate.getMinutes()).padStart(2, '0')}`

  return (
    <div className="animate-fade-in-up">
      {/* Confirmation header */}
      <div className="text-center mb-7">
        <div
          className="w-12 h-12 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(22, 163, 74, 0.10) 100%)',
            color: 'var(--success)',
            border: '1px solid rgba(22, 163, 74, 0.28)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M5 10.5l3.5 3.5L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="display text-3xl mb-2" style={{ color: 'var(--ink)' }}>
          예약이 확정되었습니다.
        </h2>
        <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
          예약번호를 잘 보관해 주세요.
        </p>
      </div>

      {/* Ticket */}
      <div className="card-elevated overflow-hidden">
        <div
          className="p-6 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(79, 70, 229, 0.06) 100%)',
            borderBottom: '1px solid rgba(79, 70, 229, 0.18)',
          }}
        >
          <div className="text-xs mb-1" style={{ color: '#4F46E5', fontWeight: 500, letterSpacing: '0.04em' }}>
            예약 가게
          </div>
          <div className="font-medium text-lg" style={{ color: 'var(--ink)' }}>{business.name}</div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="날짜" value={formatDate(reservation.reserved_at)} />
            <InfoRow label="시간" value={formatTime(timeStr)} />
            <InfoRow label="예약자" value={reservation.customer_name} />
            {staff && <InfoRow label="담당자" value={staff.name} />}
          </div>

          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
          >
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--ink-3)' }}>예약번호</div>
              <div className="font-num font-medium tracking-wider" style={{ color: 'var(--ink)' }}>
                {reservation.reservation_number}
              </div>
            </div>
            <button
              onClick={copyNumber}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: copied ? 'rgba(79, 70, 229, 0.12)' : 'var(--surface)',
                border: copied ? '1px solid rgba(79, 70, 229, 0.30)' : '1px solid var(--hairline)',
                color: copied ? '#4F46E5' : 'var(--ink-2)',
              }}
            >
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs mt-5" style={{ color: 'var(--ink-3)' }}>
        예약 조회·취소는 예약번호와 연락처로 가능합니다.
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs mb-1" style={{ color: 'var(--ink-3)' }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}
