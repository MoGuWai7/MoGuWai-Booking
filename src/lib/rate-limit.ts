/**
 * 파일 역할:
 * - 외부에 노출된 라우트 (특히 /api/chat) 의 IP 기반 rate limit 구현입니다.
 * - Upstash Redis (서버리스 Redis, REST API 기반) 와 @upstash/ratelimit 으로 구현되어
 *   Vercel Edge / Node 양쪽에서 동작합니다.
 *
 * 정책:
 * - 챗봇: IP 당 분당 10건 sliding window.
 *   정상 사용자가 빠르게 대화해도 닿지 않는 수준이며, 비용 폭탄을 막는 1차 방어선.
 * - 환경변수 (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) 가 설정되지 않으면
 *   rate limit 자체가 비활성화되어 모든 요청이 통과합니다 (로컬 dev 편의).
 *
 * 주의사항:
 * - Ratelimit 인스턴스는 모듈 로드 시 한 번만 만들어지도록 캐시합니다.
 *   Lambda cold start 사이에서 Redis connection 재사용은 fetch 기반이라 자동 처리됨.
 * - analytics: true → Upstash 콘솔에서 차단된 IP 상위 목록을 자동으로 볼 수 있습니다.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let chatLimiterCache: Ratelimit | null | undefined

function getChatLimiter(): Ratelimit | null {
  if (chatLimiterCache !== undefined) return chatLimiterCache

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    chatLimiterCache = null
    return null
  }

  chatLimiterCache = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'mbk:chat',
  })
  return chatLimiterCache
}

export type RateLimitOk = { ok: true; ip: string; limit: number; remaining: number; reset: number }
export type RateLimitBlocked = { ok: false; ip: string; limit: number; remaining: number; reset: number; retryAfter: number }
export type RateLimitResult = RateLimitOk | RateLimitBlocked

/**
 * 클라이언트 IP 를 헤더에서 추출합니다.
 * - Vercel: x-real-ip 가 가장 신뢰 가능한 클라이언트 IP.
 * - 일반 프록시: x-forwarded-for 의 첫 번째 항목.
 * - Cloudflare: cf-connecting-ip.
 * 모두 없으면 'unknown' 으로 떨어집니다 (rate limit 키로 사용 가능).
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('cf-connecting-ip') ?? 'unknown'
}

/**
 * /api/chat 진입 시 호출해 IP 기준으로 rate limit 을 평가합니다.
 * Upstash 미설정 환경에서는 항상 ok=true 를 반환합니다.
 */
export async function checkChatRateLimit(req: Request): Promise<RateLimitResult> {
  const ip = getClientIp(req)
  const limiter = getChatLimiter()

  if (!limiter) {
    return { ok: true, ip, limit: 0, remaining: 0, reset: 0 }
  }

  const result = await limiter.limit(ip)
  if (result.success) {
    return { ok: true, ip, limit: result.limit, remaining: result.remaining, reset: result.reset }
  }

  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
  return {
    ok: false,
    ip,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter,
  }
}
