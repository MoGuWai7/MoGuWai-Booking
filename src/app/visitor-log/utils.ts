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

/**
 * ISO 3166-1 alpha-2 국가 코드 → 사람이 읽기 쉬운 영문 국가명.
 * - 빈 값/null → null (UI 에서 '-' 로 표기)
 * - Intl.DisplayNames 가 인식 못 하면 입력 코드 원문을 그대로 반환 (안전한 폴백)
 *
 * 예:
 *   countryName('KR') → 'South Korea'
 *   countryName('US') → 'United States'
 *   countryName('XX') → 'XX' (폴백)
 *   countryName(null) → null
 */
let cachedDisplayNames: Intl.DisplayNames | null | undefined
function getDisplayNames(): Intl.DisplayNames | null {
  if (cachedDisplayNames !== undefined) return cachedDisplayNames
  try {
    cachedDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' })
  } catch {
    cachedDisplayNames = null
  }
  return cachedDisplayNames
}

export function countryName(code: string | null): string | null {
  if (!code) return null
  const trimmed = code.trim()
  if (!trimmed) return null
  const upper = trimmed.toUpperCase()
  const dn = getDisplayNames()
  if (!dn) return trimmed
  try {
    const name = dn.of(upper)
    // Intl.DisplayNames 가 미인식 시 입력값을 그대로 돌려주기도 하므로 그 경우엔 폴백.
    if (!name || name === upper) return trimmed
    return name
  } catch {
    return trimmed
  }
}
