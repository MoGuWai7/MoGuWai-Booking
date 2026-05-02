/**
 * 파일 역할:
 * - Supabase OAuth 콜백 라우트입니다.
 * - 외부 IdP(예: Google, Kakao)가 리디렉션해 보낸 단기 코드를 세션으로 교환합니다.
 *
 * 사용자 격리:
 * - 본 앱 전용 사용자 테이블(mbk_users) 에 row 가 없으면 자동 INSERT 합니다.
 *   OAuth 가입은 회원가입과 로그인이 한 번에 이뤄지므로 signup 액션을 거치지 않기 때문.
 *   (필요 시 운영 정책에 맞춰 자동 가입 대신 차단/관리자 승인 흐름으로 변경 가능)
 *
 * 주의사항:
 * - 현재 본 프로젝트의 UI 는 OAuth 진입점을 노출하고 있지 않습니다 (이메일/비밀번호 전용).
 *   향후 소셜 로그인 추가 시 사용됩니다.
 */
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const admin = await createAdminClient()
      await admin
        .from('mbk_users')
        .upsert({ id: data.user.id, email: data.user.email ?? null }, { onConflict: 'id' })
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
