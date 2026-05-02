/**
 * 파일 역할:
 * - 모든 HTTP 요청 진입점에서 실행되는 Next.js 16 proxy (구 middleware).
 * - 두 가지 일을 합니다:
 *   1) Supabase 세션 쿠키 갱신과 보호 경로(`/dashboard`, `/onboarding`) 비로그인 차단.
 *   2) 사이트 방문자 로그 적재 (mbk_visitor_logs).
 *
 * 방문자 로그 정책:
 * - `/visitor-log` 자체는 matcher에서 제외 → proxy가 실행되지 않으므로 자기 자신 기록 차단.
 * - 정적 자산(_next, favicon, 확장자 포함 파일), API 라우트는 기록에서 제외.
 * - logVisitor()는 fire-and-forget 으로 실행되어 응답 지연이 거의 없음.
 *   Edge runtime에서 응답 후 종료되더라도 안전하도록 NextFetchEvent.waitUntil()도 함께 사용.
 *
 * 주의사항:
 * - Next.js 16에서는 파일명이 `middleware.ts`가 아니라 `proxy.ts`이며 함수명도 `proxy` 입니다.
 * - 인증 검증 로직은 `src/lib/supabase/middleware.ts`의 `updateSession`에 모여 있습니다.
 * - LOG_SECRET_KEY는 `/visitor-log` 페이지 접근 시크릿이며, 본 파일에선 사용하지 않습니다.
 */
import { type NextRequest, type NextFetchEvent } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest, event?: NextFetchEvent) {
  const { pathname } = request.nextUrl
  const ua = request.headers.get('user-agent') ?? ''

  // 방문자 로그 수집 대상 판별.
  // matcher 자체에서도 visitor-log/static을 제외하지만, 라우트 변동에 대비해 프록시 함수 안에서도 한 번 더 가드합니다.
  // UA 기반 봇/스크린샷 필터: Vercel Dashboard preview iframe·각종 모니터링·검색엔진 크롤러를 통계에서 제외.
  // 차단이 아니라 "기록 제외"일 뿐이므로, 실제 응답은 일반 방문과 동일하게 정상 반환됩니다.
  const shouldLog =
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/visitor-log') &&
    !pathname.startsWith('/favicon') &&
    !pathname.includes('.') &&
    !isBotLikeUA(ua)

  if (shouldLog) {
    // fire-and-forget — 응답을 지연시키지 않음.
    // Edge 런타임에서 함수 종료 후에도 작업을 마치도록 waitUntil 호환.
    const promise = logVisitor(request).catch(() => {})
    event?.waitUntil?.(promise)
  }

  // 기존 인증 가드: Supabase 세션 갱신 + 보호 경로 차단.
  return await updateSession(request)
}

/**
 * 봇·스크린샷·헤드리스·모니터링 UA 인지 판별합니다.
 * 매칭되면 방문자 로그에서 "기록 제외"하며, 실제 응답은 막지 않습니다 (Forbidden 반환 X).
 *
 * 잡는 대상:
 * - Vercel Dashboard 의 deployment preview screenshot 요청 (HeadlessChrome / vercel-screenshot)
 * - Googlebot / Bingbot / Yeti(네이버) / DuckDuckBot 등 검색엔진 크롤러
 * - UptimeRobot / Pingdom / StatusCake 등 모니터링
 * - 명백한 자동화/스크래핑 (curl, wget, python-requests, axios, node-fetch, Go-http-client, java/HttpClient, Postman)
 */
function isBotLikeUA(ua: string): boolean {
  if (!ua) return true // UA 자체가 비어있으면 자동화 트래픽으로 간주
  return /bot|crawler|spider|crawling|screenshot|preview|headlesschrome|vercel|monitor|uptime|pingdom|statuscake|lighthouse|pagespeed|chrome-lighthouse|curl\/|wget\/|python-requests|axios\/|node-fetch|go-http-client|java\/|httpclient|postman/i.test(ua)
}

/**
 * 방문자 한 건을 mbk_visitor_logs 테이블에 INSERT 합니다.
 * Supabase REST API + service_role 키로 RLS를 우회하고,
 * Vercel GeoIP 헤더로 위치 정보를 채웁니다.
 */
async function logVisitor(request: NextRequest) {
  const { pathname } = request.nextUrl
  const headers = request.headers

  // Vercel이 자동으로 주입하는 GeoIP 헤더. 로컬 dev에서는 모두 null.
  const country = headers.get('x-vercel-ip-country') ?? null
  const countryCode = headers.get('x-vercel-ip-country') ?? null
  const region = headers.get('x-vercel-ip-country-region') ?? null
  const city = headers.get('x-vercel-ip-city') ?? null
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const referrer = headers.get('referer') ?? null

  const ua = headers.get('user-agent') ?? ''
  const deviceType = detectDevice(ua)
  const os = detectOS(ua)
  const browser = detectBrowser(ua)

  // /[slug] 한 단계 경로에서 가게 slug만 분리.
  // 다단계 경로(/auth/login, /dashboard/x 등)는 정규식 자체에서 매칭되지 않습니다.
  // 단일 세그먼트라도 라우트 이름과 충돌하는 단어는 slug로 취급하지 않습니다.
  const excludedSlugs = new Set(['dashboard', 'auth', 'onboarding', 'reservation', 'visitor-log'])
  const slugMatch = pathname.match(/^\/([^/]+)$/)
  const slug = slugMatch && !excludedSlugs.has(slugMatch[1]) ? slugMatch[1] : null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  // 키가 없는 환경(예: 로컬 dev에서 미설정)에선 조용히 패스.
  if (!url || !key) return

  await fetch(`${url}/rest/v1/mbk_visitor_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      path: pathname,
      slug,
      country,
      country_code: countryCode,
      region,
      city,
      device_type: deviceType,
      os,
      browser,
      ip,
      referrer,
    }),
  })
}

// ── User-Agent 파싱 헬퍼 ──
function detectDevice(ua: string): string {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile'
  return 'desktop'
}

function detectOS(ua: string): string {
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/android/i.test(ua)) return 'Android'
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac os/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Other'
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/chrome/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  if (/firefox/i.test(ua)) return 'Firefox'
  return 'Other'
}

// matcher 정책:
// - 정적 자산(_next/static, _next/image, favicon.ico, 확장자 포함 파일)은 proxy 실행 자체에서 제외.
// - `/visitor-log`는 자기 자신 기록 방지를 위해 matcher 단에서 제외.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|visitor-log|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
