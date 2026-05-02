/**
 * 파일 역할:
 * - 사장님 대시보드의 예약 상태 변경 서버 액션입니다.
 *
 * 주요 흐름:
 * 1. 클라이언트(ReservationCard)에서 status 변경 요청을 받습니다.
 * 2. mbk_reservations UPDATE를 호출합니다.
 *
 * 주의사항:
 * - 별도 권한 검사가 없는 이유: Supabase RLS가 가게 소유자만 UPDATE 통과시킵니다.
 *   다른 사장님의 예약 id로 호출되어도 RLS에서 막히므로 안전합니다.
 * - 상태 전이 규칙(pending→confirmed→completed 등)은 클라이언트(ReservationCard)에서만
 *   강제됩니다. DB enum 또는 check 제약은 없습니다.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import type { ReservationStatus } from '@/types/database'

export async function updateReservationStatus(reservationId: string, status: ReservationStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mbk_reservations')
    .update({ status })
    .eq('id', reservationId)

  if (error) {
    console.error('Update reservation status error:', error)
    return { error: error.message }
  }
  return { success: true }
}
