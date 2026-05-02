/**
 * 파일 역할:
 * - 서버 컴포넌트 / 서버 액션 / 라우트 핸들러에서 사용할 Supabase 클라이언트 팩토리입니다.
 * - 두 종류의 클라이언트를 노출합니다:
 *   - createClient(): 사용자 쿠키 기반. RLS 정책 적용. (대부분의 경우 이걸 사용)
 *   - createAdminClient(): SERVICE_ROLE_KEY 사용. RLS 우회. (현재 /api/chat 에서만 사용)
 *
 * 주의사항:
 * - 클라이언트 컴포넌트(`'use client'`)에서는 절대 import 하지 마세요.
 *   브라우저로 SUPABASE_SERVICE_ROLE_KEY가 유출됩니다.
 * - 타입을 의도적으로 any로 캐스팅한 이유: Supabase의 깊은 제네릭이 일부 .from() 호출에서
 *   `never`로 추론되는 알려진 이슈를 회피하기 위함. 운영 안정화 후 점진적 강타입화 권장.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: object }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookies are read-only
          }
        },
      },
    }
  )
}

export async function createAdminClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: object }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
