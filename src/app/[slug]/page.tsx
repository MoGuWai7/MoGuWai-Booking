/**
 * 파일 역할:
 * - 손님 진입점 — 동적 슬러그(/[slug]) 기반 가게 예약 페이지입니다.
 * - 가게 정보 / 활성 담당자 / 휴무일을 SSR로 미리 가져와 BookingFlow에 넘깁니다.
 *
 * 주의사항:
 * - 슬러그가 없으면 notFound()로 src/app/[slug]/not-found.tsx가 노출됩니다.
 * - anon 키로 SELECT 가 가능하도록 mbk_businesses / mbk_staff / mbk_blocked_dates 에는
 *   `using (true)` SELECT 정책이 별도 추가되어 있습니다 (schema.sql).
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BookingFlow from './BookingFlow'
import { categoryLabel, formatTime } from '@/lib/utils'
import type { Business, Staff } from '@/types/database'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BookingPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: businessRaw } = await supabase
    .from('mbk_businesses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!businessRaw) notFound()
  const business = businessRaw as Business

  const [{ data: staffRaw }, { data: blockedRaw }] = await Promise.all([
    supabase.from('mbk_staff').select('*').eq('business_id', business.id).eq('is_active', true).order('created_at'),
    supabase.from('mbk_blocked_dates').select('blocked_date').eq('business_id', business.id),
  ])
  const staff = (staffRaw ?? []) as Staff[]
  const blockedDates = (blockedRaw ?? []) as { blocked_date: string }[]

  return (
    <div className="min-h-screen bg-mesh">
      {/* Sticky business header */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ background: 'var(--paper)', borderColor: 'var(--hairline)' }}
      >
        <div className="max-w-3xl mx-auto px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-1">{categoryLabel[business.category]}</div>
              <h1 className="font-serif text-2xl truncate" style={{ color: 'var(--ink)' }}>
                {business.name}
              </h1>
              {business.description && (
                <p className="text-xs mt-1" style={{ color: 'var(--ink-3)' }}>
                  {business.description}
                </p>
              )}
            </div>
            <div className="text-right text-xs flex-shrink-0" style={{ color: 'var(--ink-3)' }}>
              <div className="font-num">{formatTime(business.open_time)} ~ {formatTime(business.close_time)}</div>
              {business.phone && <div className="mt-0.5 font-num">{business.phone}</div>}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-10">
        <BookingFlow
          business={business}
          staff={staff}
          blockedDates={blockedDates.map(d => d.blocked_date)}
        />
      </div>

      <footer className="text-center py-8 text-xs" style={{ color: 'var(--ink-3)' }}>
        Powered by{' '}
        <Link href="/" className="font-medium" style={{ color: 'var(--ink-2)' }}>모과이</Link>
      </footer>
    </div>
  )
}
