/**
 * 파일 역할:
 * - proxy.ts에서 호출되는 세션 갱신 + 보호 경로 검사 로직입니다.
 * - 매 요청마다 Supabase access token이 만료되었으면 자동 리프레시합니다.
 *
 * 주요 흐름:
 * 1. 요청에 담긴 쿠키로 Supabase 서버 클라이언트를 만듭니다.
 * 2. supabase.auth.getUser()로 세션을 검증합니다 (만료 시 자동 갱신).
 * 3. 보호 경로(`/dashboard`, `/onboarding`)에 비로그인 접근이면 /auth/login 리다이렉트.
 *
 * 주의사항:
 * - getUser() 실패 시(예: Supabase 연결 오류) 미들웨어 전체가 멈추지 않도록 try-catch로 보호.
 * - 정적 리소스/이미지는 proxy 실행 자체가 제외되어야 함 → src/proxy.ts의 matcher에서 제외.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Supabase 연결 장애가 모든 요청을 멈추지 않도록 try-catch로 보호.
  // (네트워크 일시 오류 등에서 사용자에게 그대로 페이지를 보여주는 편이 안전)
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    return supabaseResponse
  }

  // 비로그인으로 접근 시 차단할 경로 prefix.
  // 향후 방문자 로그 페이지를 만들 때 여기에 `/admin`, `/admin/logs` 등을 함께 추가하면
  // 미들웨어 단에서도 비인가 진입을 차단할 수 있습니다 (docs/handover/13-visitor-logs.md).
  const protectedPaths = ['/dashboard', '/onboarding']
  const isProtected = protectedPaths.some((p: string) => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
