/**
 * 파일 역할:
 * - 가게 등록(온보딩) 서버 액션입니다.
 * - 새 가게와 담당자들을 한 번에 INSERT 합니다.
 *
 * 주요 흐름:
 * 1. 4단계 폼에서 모인 모든 값을 zod로 검증합니다.
 * 2. 가게 이름 기반으로 slug를 생성하고, 충돌 시 최대 5회 다른 suffix로 재시도합니다.
 * 3. mbk_businesses INSERT → 반환된 id로 mbk_staff 일괄 INSERT.
 * 4. { redirectTo: '/dashboard' } 반환.
 *
 * 주의사항:
 * - Next.js 16의 useActionState 패턴 때문에 redirect를 직접 부르지 않습니다.
 * - slug 5회 재시도 후에도 충돌하면 일반 INSERT 에러가 노출됩니다 (실제 발생 확률은 매우 낮음).
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import { z } from 'zod'
import type { Category } from '@/types/database'

const onboardingSchema = z.object({
  category: z.enum(['restaurant', 'hair', 'nail', 'skin', 'etc']),
  name: z.string().min(1, '가게 이름을 입력해주세요').max(50),
  phone: z.string().min(9, '전화번호를 입력해주세요'),
  address: z.string().optional(),
  description: z.string().optional(),
  open_time: z.string().regex(/^\d{2}:\d{2}$/, '올바른 시간 형식이 아닙니다'),
  close_time: z.string().regex(/^\d{2}:\d{2}$/, '올바른 시간 형식이 아닙니다'),
  slot_duration: z.coerce.number().min(15).max(240),
  staff: z.string().transform(s =>
    s.split('\n')
      .map(n => n.trim())
      .filter(Boolean)
      .slice(0, 10)
  ),
})

export type OnboardingState = {
  error?: string
  fieldErrors?: Record<string, string>
  redirectTo?: string
}

export async function createBusiness(prevState: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { redirectTo: '/auth/login' }

  const raw = {
    category: formData.get('category'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    description: formData.get('description'),
    open_time: formData.get('open_time'),
    close_time: formData.get('close_time'),
    slot_duration: formData.get('slot_duration'),
    staff: formData.get('staff'),
  }

  const parsed = onboardingSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach(e => { fieldErrors[e.path[0] as string] = e.message })
    return { fieldErrors }
  }

  const { category, name, phone, address, description, open_time, close_time, slot_duration, staff } = parsed.data

  // 슬러그 충돌(같은 이름의 다른 가게가 이미 있는 경우)을 피하기 위해
  // 최대 5회 새로운 random suffix를 가진 슬러그를 시도합니다.
  // 실 사용에서는 random 4자 suffix 충돌이 거의 발생하지 않으므로 1회 안에 통과.
  let slug = generateSlug(name)
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from('mbk_businesses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    slug = generateSlug(name)
  }

  const { data: business, error: bizError } = await supabase
    .from('mbk_businesses')
    .insert({
      owner_id: user.id,
      name,
      slug,
      category: category as Category,
      description: description || null,
      phone,
      address: address || null,
      open_time,
      close_time,
      slot_duration,
    })
    .select()
    .single()

  if (bizError) {
    console.error('Business insert error:', bizError)
    return { error: '가게 등록 중 오류가 발생했습니다' }
  }

  if (staff.length > 0) {
    const { error: staffError } = await supabase
      .from('mbk_staff')
      .insert(staff.map(name => ({ business_id: business.id, name })))
    if (staffError) console.error('Staff insert error:', staffError)
  }

  return { redirectTo: '/dashboard' }
}
