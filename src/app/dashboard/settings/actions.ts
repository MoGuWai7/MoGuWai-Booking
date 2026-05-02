/**
 * 파일 역할:
 * - 가게 설정 페이지(/dashboard/settings)에서 호출되는 서버 액션 모음입니다.
 * - 가게 정보 수정, 담당자 CRUD, 휴무일 토글을 담당합니다.
 *
 * 주요 함수:
 * - updateBusiness  : 가게 정보 수정
 * - addStaff        : 담당자 추가
 * - toggleStaff     : 담당자 활성/비활성 토글 (예약은 유지)
 * - deleteStaff     : 담당자 삭제 (예약은 staff_id NULL로 남음)
 * - toggleBlockedDate: 특정 날짜 휴무 지정/해제
 *
 * 주의사항:
 * - 모든 함수가 성공 시 revalidatePath('/dashboard/settings')를 호출하여
 *   서버 컴포넌트 캐시를 무효화합니다.
 * - 권한 검증은 RLS에 의존합니다. (다른 가게 데이터에 접근 시 RLS가 차단)
 */
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const businessUpdateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(9),
  address: z.string().optional(),
  description: z.string().optional(),
  open_time: z.string(),
  close_time: z.string(),
  slot_duration: z.coerce.number().min(15).max(240),
})

export async function updateBusiness(businessId: string, prevState: { error?: string }, formData: FormData) {
  const parsed = businessUpdateSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    description: formData.get('description'),
    open_time: formData.get('open_time'),
    close_time: formData.get('close_time'),
    slot_duration: formData.get('slot_duration'),
  })

  if (!parsed.success) {
    return { error: '입력값을 확인해주세요' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('mbk_businesses')
    .update(parsed.data)
    .eq('id', businessId)

  if (error) {
    console.error('Update business error:', error)
    return { error: '저장 중 오류가 발생했습니다' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function addStaff(businessId: string, name: string) {
  if (!name.trim()) return { error: '이름을 입력해주세요' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('mbk_staff')
    .insert({ business_id: businessId, name: name.trim() })
  if (error) return { error: '추가 중 오류가 발생했습니다' }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function toggleStaff(staffId: string, isActive: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mbk_staff')
    .update({ is_active: !isActive })
    .eq('id', staffId)
  if (error) return { error: '변경 중 오류가 발생했습니다' }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteStaff(staffId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mbk_staff')
    .delete()
    .eq('id', staffId)
  if (error) return { error: '삭제 중 오류가 발생했습니다' }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function toggleBlockedDate(businessId: string, date: string, isBlocked: boolean, reason?: string) {
  const supabase = await createClient()
  if (isBlocked) {
    const { error } = await supabase
      .from('mbk_blocked_dates')
      .delete()
      .eq('business_id', businessId)
      .eq('blocked_date', date)
    if (error) return { error: '삭제 중 오류가 발생했습니다' }
  } else {
    const { error } = await supabase
      .from('mbk_blocked_dates')
      .insert({ business_id: businessId, blocked_date: date, reason: reason ?? '휴무' })
    if (error) return { error: '추가 중 오류가 발생했습니다' }
  }
  revalidatePath('/dashboard/settings')
  return { success: true }
}
