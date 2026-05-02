/**
 * 파일 역할:
 * - 손님이 보는 4단계 예약 흐름 (날짜 → 시간 → 담당자 → 정보) 클라이언트 컴포넌트입니다.
 * - 각 단계의 선택값을 로컬 state로 관리하며, 마지막에 create_reservation RPC를 호출합니다.
 *
 * 주요 흐름:
 * 1. 날짜 선택 → 같은 날의 잡힌 시간을 mbk_reservations에서 조회 (loadBookedTimes).
 * 2. 시간 선택 → (담당자가 여러 명이면) 담당자 선택, 아니면 정보 입력으로 점프.
 * 3. 담당자 변경 시 잡힌 시간 다시 조회 (담당자별로 가용 시간이 다름).
 * 4. 정보 입력 → 클라이언트 측 검증 → supabase.rpc('create_reservation') 호출.
 * 5. 성공 시 /[slug]/confirm?number=... 로 이동.
 *
 * 주의사항:
 * - 동시 예약 충돌은 RPC 안에서 SELECT count → INSERT 트랜잭션으로 차단되지만,
 *   완전한 원자성을 위해서는 부분 인덱스가 추가되어야 합니다.
 *   (docs/handover/11-known-issues.md §2-3 참고)
 * - status != 'cancelled' 조건이 누락되면 취소된 시간을 "차있다"고 표시하므로 주의.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BookingCalendar from '@/components/booking/BookingCalendar'
import TimeSlotGrid from '@/components/booking/TimeSlotGrid'
import StaffSelector from '@/components/booking/StaffSelector'
import BookingForm from '@/components/booking/BookingForm'
import ChatButton from '@/components/chatbot/ChatButton'
import type { Business, Staff, Reservation } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatTime } from '@/lib/utils'

interface Props {
  business: Business
  staff: Staff[]
  blockedDates: string[]
}

type Step = 0 | 1 | 2 | 3

const STEP_LABELS = ['날짜', '시간', '담당자', '정보']

export default function BookingFlow({ business, staff, blockedDates }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(
    staff.length === 1 ? staff[0].id : null
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const hasStaff = staff.filter(s => s.is_active).length > 0

  // 선택한 날짜에 이미 잡혀 있는 예약 시간을 가져와 TimeSlotGrid에서 비활성 처리하기 위한 함수.
  // status='cancelled' 인 예약은 가용 시간이므로 .neq('status', 'cancelled')로 제외합니다.
  async function loadBookedTimes(date: Date, staffId: string | null) {
    const supabase = createClient()
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    let query = supabase
      .from('mbk_reservations')
      .select('reserved_at')
      .eq('business_id', business.id)
      .neq('status', 'cancelled')
      .gte('reserved_at', `${dateStr}T00:00:00`)
      .lte('reserved_at', `${dateStr}T23:59:59`)

    if (staffId) query = query.eq('staff_id', staffId)

    const { data } = await query
    if (data) {
      setBookedTimes(
        data.map((r: { reserved_at: string }) => {
          const d = new Date(r.reserved_at)
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        })
      )
    }
  }

  async function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSelectedTime(null)
    await loadBookedTimes(date, selectedStaff)
    setStep(1)
  }

  async function handleTimeSelect(time: string) {
    setSelectedTime(time)
    setStep(hasStaff && staff.length > 1 ? 2 : 3)
  }

  async function handleStaffSelect(staffId: string) {
    setSelectedStaff(staffId)
    if (selectedDate) await loadBookedTimes(selectedDate, staffId)
    setStep(3)
  }

  async function handleSubmit() {
    const errors: { name?: string; phone?: string } = {}
    if (!name.trim()) errors.name = '이름을 입력해주세요'
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errors.phone = '올바른 연락처를 입력해주세요'
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})

    if (!selectedDate || !selectedTime) return
    setSubmitting(true)
    setError('')

    const [h, m] = selectedTime.split(':').map(Number)
    const reservedAt = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h, m, 0
    )

    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('create_reservation', {
      p_business_id: business.id,
      p_staff_id: selectedStaff,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
      p_reserved_at: reservedAt.toISOString(),
    })

    if (rpcError) {
      setError(rpcError.message || '예약 중 오류가 발생했습니다')
      setSubmitting(false)
      return
    }

    const reservation = data as Reservation
    router.push(`/${business.slug}/confirm?number=${reservation.reservation_number}`)
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-7">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1.5">
            <div
              className="h-0.5 rounded-full transition-all"
              style={{ background: i <= step ? 'var(--ink)' : 'var(--hairline)' }}
            />
            <span className="text-[11px] font-medium" style={{ color: i <= step ? 'var(--ink)' : 'var(--ink-3)' }}>
              {i + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop: 2-col layout */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Calendar — always visible on desktop */}
        <div className="hidden lg:block lg:col-span-6">
          <div className="card p-6 sticky top-32">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--ink)' }}>날짜 선택</h3>
            <BookingCalendar
              blockedDates={blockedDates}
              selected={selectedDate}
              onSelect={handleDateSelect}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-6 space-y-3">
          {/* Step 0 (mobile only) */}
          {step === 0 && (
            <div className="card p-6 animate-fade-in-up lg:hidden">
              <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--ink)' }}>날짜 선택</h3>
              <BookingCalendar
                blockedDates={blockedDates}
                selected={selectedDate}
                onSelect={handleDateSelect}
              />
            </div>
          )}

          {/* Time slots */}
          {step >= 1 && selectedDate && (
            <div className="card p-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  시간 선택
                </h3>
                {selectedTime && step > 1 && (
                  <button onClick={() => setStep(1)} className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                    {formatTime(selectedTime)} · 변경
                  </button>
                )}
              </div>
              {step === 1 && (
                <TimeSlotGrid
                  openTime={business.open_time}
                  closeTime={business.close_time}
                  slotDuration={business.slot_duration}
                  bookedTimes={bookedTimes}
                  selected={selectedTime}
                  onSelect={handleTimeSelect}
                />
              )}
            </div>
          )}

          {/* Staff */}
          {hasStaff && step >= 2 && (
            <div className="card p-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium" style={{ color: 'var(--ink)' }}>담당자 선택</h3>
                {selectedStaff && step > 2 && (
                  <button onClick={() => setStep(2)} className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                    {staff.find(s => s.id === selectedStaff)?.name} · 변경
                  </button>
                )}
              </div>
              {step === 2 && (
                <StaffSelector
                  staff={staff}
                  selected={selectedStaff}
                  onSelect={handleStaffSelect}
                />
              )}
            </div>
          )}

          {/* Form */}
          {step === 3 && (
            <div className="card p-6 animate-fade-in-up">
              <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--ink)' }}>예약자 정보</h3>

              <div
                className="rounded-xl p-4 mb-5 text-sm space-y-2"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
              >
                {selectedDate && (
                  <Row label="날짜" value={formatDate(selectedDate.toISOString())} />
                )}
                {selectedTime && (
                  <Row label="시간" value={formatTime(selectedTime)} />
                )}
                {selectedStaff && (
                  <Row label="담당자" value={staff.find(s => s.id === selectedStaff)?.name ?? ''} />
                )}
              </div>

              <BookingForm
                name={name}
                phone={phone}
                onChangeName={setName}
                onChangePhone={setPhone}
                errors={formErrors}
              />

              {error && (
                <div
                  className="mt-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.18)' }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full mt-5"
                style={{ padding: '13px' }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    예약하는 중
                  </span>
                ) : '예약 확정'}
              </button>
            </div>
          )}
        </div>
      </div>

      <ChatButton businessId={business.id} businessName={business.name} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: 'var(--ink-3)' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--ink)' }}>{value}</span>
    </div>
  )
}
