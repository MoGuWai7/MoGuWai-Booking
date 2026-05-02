/**
 * 파일 역할:
 * - 손님이 예약번호 + 연락처로 본인 예약을 조회/취소하는 독립 페이지입니다.
 *
 * 주의사항:
 * - 본인 확인은 앱 레벨(예약번호 AND 연락처 동시 매칭)에서만 이루어집니다.
 *   RLS의 anon 정책은 SELECT/UPDATE 자체를 허용하므로,
 *   향후 보안 강화 시 RPC로 캡슐화하는 것을 권장합니다.
 *   (docs/handover/11-known-issues.md §2-5)
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Reservation } from '@/types/database'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { formatDate, formatTime } from '@/lib/utils'

export default function ReservationCheckPage() {
  const [number, setNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  async function handleSearch() {
    if (!number.trim() || !phone.trim()) {
      setError('예약번호와 연락처를 모두 입력해주세요')
      return
    }
    setLoading(true)
    setError('')
    setReservation(null)
    setCancelled(false)

    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('mbk_reservations')
      .select('*')
      .eq('reservation_number', number.trim().toUpperCase())
      .eq('customer_phone', phone.trim())
      .maybeSingle()

    setLoading(false)
    if (fetchError || !data) {
      setError('예약을 찾을 수 없습니다. 예약번호와 연락처를 확인해주세요.')
      return
    }
    setReservation(data)
  }

  async function handleCancel() {
    if (!reservation) return
    setCancelling(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('mbk_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservation.id)

    setCancelling(false)
    setCancelModal(false)
    if (error) {
      setError('취소 처리 중 오류가 발생했습니다')
      return
    }
    setReservation({ ...reservation, status: 'cancelled' })
    setCancelled(true)
  }

  const reservedDate = reservation ? new Date(reservation.reserved_at) : null
  const timeStr = reservedDate
    ? `${String(reservedDate.getHours()).padStart(2, '0')}:${String(reservedDate.getMinutes()).padStart(2, '0')}`
    : ''

  return (
    <div className="min-h-screen bg-mesh">
      <header className="border-b" style={{ borderColor: 'var(--hairline)' }}>
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl" style={{ color: 'var(--ink)' }}>모과이</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>예약</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 py-12">
        <div className="mb-8">
          <div className="eyebrow mb-2">조회</div>
          <h1 className="display text-3xl md:text-4xl" style={{ color: 'var(--ink)' }}>
            예약 조회 · 취소
          </h1>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>예약번호</label>
            <input
              value={number}
              onChange={e => setNumber(e.target.value.toUpperCase())}
              className="field font-num tracking-wider"
              placeholder="RES-XXXXXXXX"
              maxLength={12}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>연락처</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="field"
              placeholder="010-0000-0000"
              inputMode="numeric"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.18)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                조회 중
              </span>
            ) : '조회하기'}
          </button>
        </div>

        {reservation && (
          <div className="mt-5 card p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium" style={{ color: 'var(--ink)' }}>예약 정보</h2>
              <Badge status={reservation.status} />
            </div>

            <div className="space-y-3 text-sm">
              <Row label="예약번호" value={reservation.reservation_number} mono />
              {reservedDate && (
                <>
                  <Row label="날짜" value={formatDate(reservation.reserved_at)} />
                  <Row label="시간" value={formatTime(timeStr)} />
                </>
              )}
              <Row label="예약자" value={reservation.customer_name} />
            </div>

            {cancelled && (
              <div
                className="mt-5 px-4 py-3 rounded-xl text-sm text-center"
                style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.18)' }}
              >
                예약이 취소되었습니다.
              </div>
            )}

            {!cancelled && (reservation.status === 'pending' || reservation.status === 'confirmed') && (
              <button
                onClick={() => setCancelModal(true)}
                className="btn-secondary w-full mt-5"
                style={{ color: 'var(--danger)', borderColor: 'rgba(185,28,28,0.22)' }}
              >
                예약 취소하기
              </button>
            )}
          </div>
        )}
      </main>

      <Modal
        open={cancelModal}
        title="예약을 취소하시겠습니까?"
        description="취소된 예약은 복구할 수 없습니다."
        confirmLabel="예약 취소"
        confirmVariant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelModal(false)}
      />
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span className={`font-medium ${mono ? 'font-num tracking-wider' : ''}`} style={{ color: 'var(--ink)' }}>
        {value}
      </span>
    </div>
  )
}
