import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StatCard from '@/components/dashboard/StatCard'
import Badge from '@/components/ui/Badge'
import { formatTime } from '@/lib/utils'
import type { Reservation, Business } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('mbk_businesses')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!business) redirect('/onboarding')
  const biz = business as Business

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const { data: todayReservations } = await supabase
    .from('mbk_reservations')
    .select('*, staff:staff_id(name)')
    .eq('business_id', biz.id)
    .gte('reserved_at', `${todayStr}T00:00:00`)
    .lte('reserved_at', `${todayStr}T23:59:59`)
    .order('reserved_at')

  type ReservationWithStaff = Reservation & { staff: { name: string } | null }
  const reservations = (todayReservations ?? []) as ReservationWithStaff[]
  const total = reservations.length
  const pending = reservations.filter(r => r.status === 'pending').length
  const confirmed = reservations.filter(r => r.status === 'confirmed').length
  const completed = reservations.filter(r => r.status === 'completed').length
  const cancelled = reservations.filter(r => r.status === 'cancelled').length

  const dateLabel = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
  const yearLabel = today.getFullYear()

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <div className="eyebrow mb-2">{yearLabel}</div>
          <h1 className="display text-4xl md:text-5xl" style={{ color: 'var(--ink)' }}>
            {dateLabel}
          </h1>
        </div>
        <Link
          href={`/${biz.slug}`}
          target="_blank"
          className="btn-secondary"
        >
          예약 페이지 열기
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M5 2h7v7M12 2L6 8M9 7v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10 stagger-children">
        <StatCard label="오늘 전체" value={total} delay={0} />
        <StatCard label="대기 · 확정" value={pending + confirmed} delay={60} />
        <StatCard label="완료" value={completed} delay={120} />
        <StatCard label="취소" value={cancelled} delay={180} />
      </div>

      {/* Today list */}
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-base font-medium" style={{ color: 'var(--ink)' }}>오늘 예약</h2>
        <Link
          href="/dashboard/reservations"
          className="text-sm transition-colors"
          style={{ color: 'var(--ink-2)' }}
        >
          전체 보기 →
        </Link>
      </div>

      {reservations.length === 0 ? (
        <EmptyState slug={biz.slug} />
      ) : (
        <div className="card overflow-hidden">
          {reservations.slice(0, 8).map((r, idx) => {
            const d = new Date(r.reserved_at)
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            const staffName = r.staff?.name

            return (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--hairline)' }}
              >
                <div className="w-16 flex-shrink-0">
                  <div className="font-num font-medium text-sm" style={{ color: 'var(--ink)' }}>
                    {timeStr}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                    {formatTime(timeStr).split(' ')[0]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm" style={{ color: 'var(--ink)' }}>
                      {r.customer_name}
                    </span>
                    <Badge status={r.status} />
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
                    {r.customer_phone}
                    {staffName && <span className="ml-2">· {staffName}</span>}
                  </div>
                </div>
              </div>
            )
          })}
          {reservations.length > 8 && (
            <Link
              href="/dashboard/reservations"
              className="block px-5 py-3 text-center text-sm transition-colors"
              style={{ color: 'var(--ink-2)', borderTop: '1px solid var(--hairline)' }}
            >
              +{reservations.length - 8}건 더 보기
            </Link>
          )}
        </div>
      )}

      {/* Share link block */}
      <div
        className="mt-10 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
      >
        <div className="min-w-0">
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--ink-3)' }}>공유 링크</div>
          <div className="font-num text-sm truncate" style={{ color: 'var(--ink)' }}>
            moguwai.app/{biz.slug}
          </div>
        </div>
        <Link
          href={`/${biz.slug}`}
          target="_blank"
          className="btn-primary"
          style={{ padding: '10px 16px', fontSize: '13px' }}
        >
          링크 열기
        </Link>
      </div>
    </div>
  )
}

function EmptyState({ slug }: { slug: string }) {
  return (
    <div className="card p-12 text-center">
      <div className="font-serif text-3xl mb-3" style={{ color: 'var(--ink)' }}>비어 있는 하루.</div>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-2)' }}>
        오늘은 아직 예약이 없습니다. 예약 링크를 공유해보세요.
      </p>
      <Link
        href={`/${slug}`}
        target="_blank"
        className="btn-secondary inline-flex"
      >
        예약 페이지 보기
      </Link>
    </div>
  )
}
