'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReservationCard from '@/components/dashboard/ReservationCard'
import type { Reservation, Staff } from '@/types/database'

type DateFilter = 'yesterday' | 'today' | 'tomorrow' | 'all'

const FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'yesterday', label: '어제' },
  { value: 'today', label: '오늘' },
  { value: 'tomorrow', label: '내일' },
  { value: 'all', label: '전체' },
]

function getDateRange(filter: DateFilter) {
  const now = new Date()
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const offsets: Record<DateFilter, number | null> = {
    yesterday: -1,
    today: 0,
    tomorrow: 1,
    all: null,
  }

  const offset = offsets[filter]
  if (offset === null) return { start: null, end: null }

  const d = new Date(base)
  d.setDate(d.getDate() + offset)
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: `${dateStr}T00:00:00`, end: `${dateStr}T23:59:59` }
}

async function fetchReservations(businessId: string, filter: DateFilter) {
  const supabase = createClient()
  const { start, end } = getDateRange(filter)

  let query = supabase
    .from('mbk_reservations')
    .select('*')
    .eq('business_id', businessId)
    .order('reserved_at')

  if (start && end) {
    query = query.gte('reserved_at', start).lte('reserved_at', end)
  }

  const { data } = await query
  const reservations = (data ?? []) as Reservation[]

  const staffIds = [...new Set(reservations.map(r => r.staff_id).filter((x): x is string => Boolean(x)))]
  const staffMap: Record<string, Staff> = {}
  if (staffIds.length > 0) {
    const { data: staffData } = await supabase
      .from('mbk_staff')
      .select('*')
      .in('id', staffIds)
    ;(staffData ?? []).forEach((s: Staff) => { staffMap[s.id] = s })
  }
  return { reservations, staffMap }
}

export default function ReservationsPage() {
  const [filter, setFilter] = useState<DateFilter>('today')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [staffMap, setStaffMap] = useState<Record<string, Staff>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: biz } = await supabase
        .from('mbk_businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (!biz || cancelled) return

      const result = await fetchReservations(biz.id, filter)
      if (cancelled) return
      setReservations(result.reservations)
      setStaffMap(result.staffMap)
      setLoading(false)

      // store id for filter changes
      ;(load as unknown as { businessId: string }).businessId = biz.id
    }
    load()
    return () => { cancelled = true }
  }, [filter])

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
      <div className="mb-8">
        <div className="eyebrow mb-2">목록</div>
        <h1 className="display text-4xl md:text-5xl" style={{ color: 'var(--ink)' }}>예약 관리</h1>
      </div>

      <div
        className="inline-flex rounded-xl p-1 mb-6"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
      >
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setLoading(true); setFilter(f.value) }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: filter === f.value ? 'var(--surface)' : 'transparent',
              color: filter === f.value ? 'var(--ink)' : 'var(--ink-3)',
              boxShadow: filter === f.value ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-24" style={{ opacity: 0.5 }} />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>예약이 없습니다.</div>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>이 기간에는 들어온 예약이 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(r => (
            <ReservationCard
              key={r.id}
              reservation={r}
              staff={r.staff_id ? (staffMap[r.staff_id] ?? null) : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
