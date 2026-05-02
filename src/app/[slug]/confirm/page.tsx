import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BookingTicket from '@/components/booking/BookingTicket'
import type { Reservation, Business, Staff } from '@/types/database'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ number?: string }>
}

export default async function ConfirmPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { number } = await searchParams

  if (!number) notFound()

  const supabase = await createClient()

  const { data: reservationRaw } = await supabase
    .from('mbk_reservations')
    .select('*')
    .eq('reservation_number', number)
    .maybeSingle()

  if (!reservationRaw) notFound()
  const reservation = reservationRaw as Reservation

  const { data: businessRaw } = await supabase
    .from('mbk_businesses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!businessRaw) notFound()
  const business = businessRaw as Business

  const { data: staffRaw } = reservation.staff_id
    ? await supabase.from('mbk_staff').select('*').eq('id', reservation.staff_id).maybeSingle()
    : { data: null }
  const staff = staffRaw as Staff | null

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-5 py-12">
      <div className="w-full max-w-md">
        <BookingTicket
          reservation={reservation}
          business={business}
          staff={staff}
        />

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={`/${slug}`}
            className="btn-secondary w-full"
            style={{ justifyContent: 'center' }}
          >
            다른 날짜로 또 예약
          </Link>
          <Link
            href="/reservation/check"
            className="btn-ghost w-full"
            style={{ justifyContent: 'center' }}
          >
            예약 조회·취소
          </Link>
        </div>
      </div>
    </div>
  )
}
