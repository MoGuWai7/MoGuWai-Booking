/**
 * 파일 역할:
 * - 브라우저(Client Component)에서 사용할 Supabase 클라이언트 팩토리입니다.
 * - 인증 상태를 자동으로 쿠키에 저장하여 새로고침 후에도 세션이 유지됩니다.
 *
 * 주의사항:
 * - anon key만 사용합니다. RLS 정책이 클라이언트 측 권한을 결정합니다.
 * - 한 번에 만든 클라이언트를 모듈 레벨로 캐싱하지 않는 이유는 React 19 + Next.js 16 환경에서
 *   각 컴포넌트가 자체 인스턴스를 갖는 편이 안전하기 때문입니다.
 */
import { createBrowserClient } from '@supabase/ssr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
