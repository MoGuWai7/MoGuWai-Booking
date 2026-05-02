/**
 * 파일 역할:
 * - 로그인 / 회원가입 / 로그아웃 서버 액션 모음.
 * - Supabase Auth (이메일+비밀번호) 호출과 zod 검증, 그리고 본 앱 전용 사용자 테이블(mbk_users) 동기화를 담당합니다.
 *
 * 사용자 격리 정책:
 * - 동일 Supabase 인스턴스를 다른 앱과 공유하더라도, 본 앱의 사용자는 반드시 mbk_users 에 row 가 존재해야 합니다.
 *   - signup(): 가입 성공 직후 service_role 키로 mbk_users INSERT.
 *   - login(): 인증 성공 후 mbk_users 에 row 가 없으면 즉시 signOut + 에러 반환.
 * - mbk_users.id 는 auth.users.id 와 동일하므로 owner_id = auth.uid() 비교 로직은 그대로 동작합니다.
 *
 * 주요 흐름:
 * 1. zod 로 입력값 검증 → 실패 시 fieldErrors 반환.
 * 2. Supabase Auth API 호출.
 * 3. 본 앱 멤버십 확인/생성 (mbk_users).
 * 4. 성공 시 { redirectTo: '/path' } 반환 → 클라이언트에서 router.push.
 *
 * 주의사항:
 * - Next.js 16 + useActionState 패턴에서는 서버 액션 안의 redirect()가 클라이언트
 *   navigation 을 트리거하지 않습니다. 따라서 이 파일은 redirect 를 직접 호출하지 않고,
 *   결과 객체에 redirectTo 를 담아 클라이언트가 처리하도록 합니다.
 *   예외: logout()은 form action 으로 직접 호출되므로 redirect 사용 가능.
 */
'use server'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
})

const signupSchema = loginSchema.extend({
  passwordConfirm: z.string(),
}).refine(d => d.password === d.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
})

export type AuthState = {
  error?: string
  fieldErrors?: Record<string, string>
  redirectTo?: string
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach(e => { fieldErrors[e.path[0] as string] = e.message })
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { data: signInData, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !signInData?.user) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다' }
  }

  // 이 앱의 사용자(mbk_users) 인지 확인. 다른 앱에서 가입한 계정이면 차단.
  const admin = await createAdminClient()
  const { data: appUser } = await admin
    .from('mbk_users')
    .select('id')
    .eq('id', signInData.user.id)
    .maybeSingle()

  if (!appUser) {
    await supabase.auth.signOut()
    return { error: '이 이메일은 모과이 예약에 가입되어 있지 않습니다. 회원가입 후 이용해주세요.' }
  }

  return { redirectTo: '/dashboard' }
}

export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    passwordConfirm: formData.get('passwordConfirm') as string,
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.issues.forEach(e => { fieldErrors[e.path[0] as string] = e.message })
    return { fieldErrors }
  }

  const supabase = await createClient()
  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: '이미 가입된 이메일입니다' }
    }
    return { error: '회원가입 중 오류가 발생했습니다' }
  }

  // 가입 직후 본 앱 사용자 테이블(mbk_users) 에 row 등록.
  // 이메일 인증이 켜져있으면 세션이 즉시 발급되지 않으므로 service_role 클라이언트로 INSERT.
  const userId = signUpData.user?.id
  if (userId) {
    const admin = await createAdminClient()
    const { error: provisionError } = await admin
      .from('mbk_users')
      .upsert({ id: userId, email: parsed.data.email }, { onConflict: 'id' })
    if (provisionError) {
      console.error('mbk_users provision error:', provisionError)
      return { error: '회원가입 후처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
    }
  }

  return { redirectTo: '/onboarding' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
