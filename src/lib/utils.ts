/**
 * 파일 역할:
 * - 프로젝트 전반에서 쓰이는 순수 유틸 함수 모음입니다.
 *
 * 주요 함수:
 * - generateSlug      : 한글/영문 가게 이름 → URL slug (random suffix 포함)
 * - formatPhone       : '01012345678' → '010-1234-5678'
 * - formatTime        : '14:30' → '오후 2:30'
 * - formatDate        : ISO 문자열 → '2026년 11월 5일 (화)'
 * - formatDateShort   : 짧은 날짜 표기
 * - generateTimeSlots : 운영시간/슬롯 단위 → ['09:00', '10:00', ...] 배열
 * - categoryLabel/Emoji: 카테고리 enum → 표시명/이모지 매핑
 *
 * 주의사항:
 * - 모두 순수 함수이며 DOM/네트워크 의존 없음.
 */
import type { Category } from '@/types/database'

export function generateSlug(name: string): string {
  const koreanToEnglish: Record<string, string> = {
    가: 'ga', 나: 'na', 다: 'da', 라: 'ra', 마: 'ma',
    바: 'ba', 사: 'sa', 아: 'a', 자: 'ja', 차: 'cha',
    카: 'ka', 타: 'ta', 파: 'pa', 하: 'ha',
  }

  let slug = name
    .toLowerCase()
    .replace(/[가-힣]/g, char => koreanToEnglish[char] || '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (!slug) slug = 'shop'

  const suffix = Math.random().toString(36).slice(2, 6)
  return `${slug}-${suffix}`
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? '오후' : '오전'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${ampm} ${displayHour}:${m}`
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotDuration: number
): string[] {
  const slots: string[] = []
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  for (let m = openMinutes; m < closeMinutes; m += slotDuration) {
    const h = Math.floor(m / 60).toString().padStart(2, '0')
    const min = (m % 60).toString().padStart(2, '0')
    slots.push(`${h}:${min}`)
  }
  return slots
}

export const categoryLabel: Record<Category, string> = {
  restaurant: '식당',
  hair: '헤어샵',
  nail: '네일샵',
  skin: '피부관리',
  etc: '기타',
}

export const categoryEmoji: Record<Category, string> = {
  restaurant: '🍽️',
  hair: '✂️',
  nail: '💅',
  skin: '🧖',
  etc: '🏪',
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
