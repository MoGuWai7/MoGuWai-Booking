/**
 * 파일 역할:
 * - /visitor-log 페이지 및 Toolbar 클라이언트 컴포넌트가 공통으로 쓰는 포맷터 모음.
 *
 * 주의사항:
 * - 모든 시간은 KST(Asia/Seoul) 기준으로 표시·내보내기 합니다.
 * - referrer 는 호스트명만 추출해 표시 (전체 URL 은 너무 길고 노이즈).
 */

/** Date → "YYYY-MM-DD HH:MM:SS" (KST 기준) */
export function formatKstDate(d: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }
  const parts = new Intl.DateTimeFormat('en-CA', opts).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

/** Date → "YYYY-MM-DD" (KST 기준) — CSV 파일명용 */
export function formatKstDay(d: Date): string {
  return formatKstDate(d).slice(0, 10)
}

/** referrer URL → 호스트명 (파싱 실패 시 원문, null/빈 문자열은 null) */
export function extractReferrerHost(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
