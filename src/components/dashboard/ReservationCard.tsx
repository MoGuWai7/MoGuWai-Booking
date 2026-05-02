/**
 * 파일 역할:
 * - 사장님 대시보드의 예약 카드 컴포넌트입니다.
 * - 상태별로 노출되는 액션 버튼을 동적으로 렌더링하고, 상태 변경을 서버 액션에 위임합니다.
 *
 * 상태 전이 (UI 강제):
 *   pending  → confirmed | completed | cancelled
 *   confirmed → completed | cancelled
 *   completed → (변경 불가)
 *   cancelled → (변경 불가)
 *
 * 주의사항:
 * - DB enum/check 제약은 없습니다. 본 컴포넌트가 유일한 상태 전이 가드입니다.
 * - 취소는 모달 확인 후 처리합니다 (실수 방지).
 */
'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import type { Reservation, Staff } from '@/types/database'
import { formatDateShort, formatTime } from '@/lib/utils'
import { updateReservationStatus } from '@/app/dashboard/reservations/actions'

interface ReservationCardProps {
  reservation: Reservation
  staff: Staff | null
}

export default function ReservationCard({ reservation: initial, staff }: ReservationCardProps) {
  const [reservation, setReservation] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [cancelModal, setCancelModal] = useState(false)

  const reservedDate = new Date(reservation.reserved_at)
  const timeStr = `${String(reservedDate.getHours()).padStart(2, '0')}:${String(reservedDate.getMinutes()).padStart(2, '0')}`

  async function handleStatus(status: 'confirmed' | 'completed' | 'cancelled') {
    setLoading(status)
    const result = await updateReservationStatus(reservation.id, status)
    setLoading(null)
    if (!result.error) setReservation({ ...reservation, status })
    if (status === 'cancelled') setCancelModal(false)
  }

  const isCancelled = reservation.status === 'cancelled'
  const isDone = reservation.status === 'completed'

  return (
    <div className="card p-5" style={{ opacity: isCancelled ? 0.55 : 1 }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm" style={{ color: 'var(--ink)' }}>
              {reservation.customer_name}
            </span>
            <Badge status={reservation.status} />
          </div>
          <div className="text-xs" style={{ color: 'var(--ink-3)' }}>
            {reservation.customer_phone}
            {staff && <span className="ml-2">· {staff.name}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-num font-medium text-sm" style={{ color: 'var(--ink)' }}>
            {formatTime(timeStr)}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
            {formatDateShort(reservation.reserved_at)}
          </div>
        </div>
      </div>

      <div className="text-[11px] font-num" style={{ color: 'var(--ink-4)' }}>
        {reservation.reservation_number}
      </div>

      {!isCancelled && !isDone && (
        <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--hairline)' }}>
          {reservation.status === 'pending' && (
            <button
              onClick={() => handleStatus('confirmed')}
              disabled={loading !== null}
              className="flex-1 py-2 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
              style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--hairline)' }}
            >
              {loading === 'confirmed' ? '처리 중' : '확정'}
            </button>
          )}
          <button
            onClick={() => handleStatus('completed')}
            disabled={loading !== null}
            className="flex-1 py-2 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(79, 70, 229, 0.18), 0 4px 14px rgba(79, 70, 229, 0.18)',
            }}
          >
            {loading === 'completed' ? '처리 중' : '방문 완료'}
          </button>
          <button
            onClick={() => setCancelModal(true)}
            disabled={loading !== null}
            className="py-2 px-3 text-xs rounded-lg font-medium transition-all disabled:opacity-50"
            style={{ color: 'var(--danger)', background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.18)' }}
          >
            취소
          </button>
        </div>
      )}

      <Modal
        open={cancelModal}
        title="예약을 취소하시겠습니까?"
        description={`${reservation.customer_name} 고객의 예약을 취소합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="취소 처리"
        confirmVariant="danger"
        loading={loading === 'cancelled'}
        onConfirm={() => handleStatus('cancelled')}
        onCancel={() => setCancelModal(false)}
      />
    </div>
  )
}
