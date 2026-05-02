/**
 * 파일 역할:
 * - 손님 예약 페이지에서 노출되는 AI 챗봇의 백엔드(POST /api/chat) 입니다.
 * - 가게 정보 + 오늘 빈 시간을 시스템 프롬프트로 주입한 뒤 Gemini LLM을 호출합니다.
 *
 * 주요 흐름:
 * 0. IP 기준 rate limit 평가 (Upstash Redis sliding window 10/min). 차단 시 즉시 429.
 * 1. 요청 본문을 zod로 검증합니다 (messages 배열 + businessId UUID).
 * 2. service role 클라이언트로 mbk_businesses + mbk_staff + 오늘 mbk_reservations 조회.
 * 3. generateTimeSlots()로 가능 슬롯 계산 후 이미 잡힌 시간 제거.
 * 4. 시스템 프롬프트 합성 → Google Gemini REST API 호출 (모델 폴백 체인).
 * 5. 응답 텍스트를 클라이언트로 반환.
 *
 * 주의사항:
 * - createAdminClient(SERVICE_ROLE_KEY)를 사용하므로 RLS가 우회됩니다.
 *   따라서 입력 businessId는 zod로 UUID 형식만 검증한 뒤 SELECT만 수행하며,
 *   외부에서 임의로 INSERT/UPDATE를 트리거할 수 없도록 본 라우트는 SELECT 전용으로 유지합니다.
 * - GEMINI_API_KEY가 없으면 200으로 친절한 fallback 메시지를 반환하여
 *   챗봇 미설정이 앱 전체 장애로 이어지지 않게 합니다.
 * - @google/generative-ai SDK 가 deprecated/legacy 라 REST API 직접 호출로 통신합니다.
 * - Upstash 환경변수 (UPSTASH_REDIS_REST_URL/_TOKEN) 가 없으면 rate limit 은 비활성화됩니다.
 *   운영에서는 반드시 설정해 주세요. 비용 폭탄과 prompt 남용의 1차 방어선입니다.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateTimeSlots, categoryLabel } from '@/lib/utils'
import { checkChatRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
  businessId: z.string().uuid(),
})

export async function POST(req: Request) {
  // 0) Rate limit — IP 기준. Upstash 미설정이면 통과.
  // 비싼 LLM 호출과 DB 조회를 시작하기 전에 가장 먼저 평가해 비용/남용을 차단합니다.
  const rl = await checkChatRateLimit(req)
  if (!rl.ok) {
    console.warn(`[chat] rate limited ip=${rl.ip} retryAfter=${rl.retryAfter}s`)
    return NextResponse.json(
      { content: '잠시만요! 잠깐 사이에 너무 많은 질문이 들어왔어요. 1분 후 다시 시도해 주세요.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfter),
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
        },
      }
    )
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { messages, businessId } = parsed.data

  const supabase = await createAdminClient()

  const { data: businessRaw } = await supabase
    .from('mbk_businesses')
    .select('*')
    .eq('id', businessId)
    .maybeSingle()

  if (!businessRaw) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const business = businessRaw

  const { data: staffList } = await supabase
    .from('mbk_staff')
    .select('name')
    .eq('business_id', businessId)
    .eq('is_active', true)

  // Get today's booked times
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const { data: todayReservations } = await supabase
    .from('mbk_reservations')
    .select('reserved_at')
    .eq('business_id', businessId)
    .neq('status', 'cancelled')
    .gte('reserved_at', `${todayStr}T00:00:00`)
    .lte('reserved_at', `${todayStr}T23:59:59`)

  const bookedTimes = new Set(
    (todayReservations ?? []).map((r: { reserved_at: string }) => {
      const d = new Date(r.reserved_at)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    })
  )

  const allSlots = generateTimeSlots(business.open_time, business.close_time, business.slot_duration)
  const availableSlots = allSlots.filter(s => !bookedTimes.has(s))

  const staffNames = (staffList ?? []).map((s: { name: string }) => s.name)

  const systemPrompt = `당신은 ${business.name}의 AI 예약 도우미입니다.

업종: ${categoryLabel[business.category as keyof typeof categoryLabel] ?? business.category}
운영시간: ${business.open_time} ~ ${business.close_time}
전화번호: ${business.phone ?? '미등록'}
주소: ${business.address ?? '미등록'}
${business.description ? `소개: ${business.description}` : ''}
담당자: ${staffNames.length > 0 ? staffNames.join(', ') : '없음'}
오늘(${todayStr}) 예약 가능한 시간: ${availableSlots.length > 0 ? availableSlots.join(', ') : '오늘은 예약 가능한 시간이 없습니다'}

고객의 질문에 친절하고 간결하게 한국어로 답변하세요.
예약은 직접 페이지에서 진행하도록 안내하세요.
모르는 정보는 전화번호를 안내하세요.
답변은 2-3문장 이내로 간결하게 합니다.`

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { content: '죄송합니다. AI 서비스가 현재 설정되지 않았습니다. 전화로 문의해 주세요: ' + (business.phone ?? '') },
      { status: 200 }
    )
  }

  // 시도 순서: 무료 티어에서 안정적으로 동작하는 모델부터 → 첫 비-쿼터 에러는 그대로 throw.
  // gemini-2.0-flash 는 일부 키에서 free-tier 쿼터가 0으로 잡혀 429를 던지므로 2.5 계열을 우선합니다.
  const modelCandidates = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest']

  // REST API 형식의 contents (system prompt 는 systemInstruction 으로 분리).
  // Gemini 는 contents 가 'user' 로 시작해야 하며, 마지막도 'user' 여야 새 응답을 생성합니다.
  // 환영 메시지처럼 선두에 끼어든 'model' 메시지는 잘라냅니다.
  const trimmed = [...messages]
  while (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift()
  if (trimmed.length === 0 || trimmed[trimmed.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 })
  }
  const contents = trimmed.map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  try {
    let lastErr: unknown = null
    for (const modelName of modelCandidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512,
            },
          }),
        })

        if (!res.ok) {
          const errBody = await res.text()
          // 429 / 모델 미가용 / 권한 → 다음 후보로 폴백
          if (/quota|429|not.*found|permission|unavailable/i.test(errBody) || res.status === 429 || res.status === 404 || res.status === 403) {
            lastErr = new Error(`[${modelName} ${res.status}] ${errBody.slice(0, 200)}`)
            continue
          }
          // 그 외 에러는 즉시 throw
          throw new Error(`[${modelName} ${res.status}] ${errBody.slice(0, 200)}`)
        }

        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
        if (!text) {
          lastErr = new Error(`[${modelName}] empty response`)
          continue
        }
        return NextResponse.json({ content: text })
      } catch (err) {
        lastErr = err
        const msg = err instanceof Error ? err.message : String(err)
        if (!/quota|429|not.*found|permission|unavailable|empty response/i.test(msg)) {
          throw err
        }
      }
    }
    throw lastErr ?? new Error('All model candidates failed')
  } catch (err) {
    console.error(`[chat] gemini error ip=${rl.ip} business=${businessId}:`, err)
    const detail = err instanceof Error ? err.message : ''
    const isQuota = /quota|429/i.test(detail)
    const fallback = isQuota
      ? '지금 AI 응대 요청이 많아 잠시 후 다시 시도해 주세요. 전화로도 문의 가능합니다.'
      : '죄송합니다. AI 응대에 일시적인 오류가 발생했습니다. 전화로 문의해 주세요.'
    return NextResponse.json(
      { content: business.phone ? `${fallback} (${business.phone})` : fallback },
      { status: 200 }
    )
  }
}
