/**
 * 파일 역할:
 * - /visitor-log 페이지의 "전체 삭제" 버튼이 호출하는 서버 액션.
 *
 * 보안:
 * - LOG_SECRET_KEY 와 일치할 때만 실행 — 페이지 렌더 시 검증을 통과한 secret 을
 *   클라이언트가 그대로 다시 넘겨주므로 본 액션에서도 한 번 더 검증합니다.
 *
 * 주의사항:
 * - service_role 키를 사용하여 RLS 를 우회합니다.
 * - mbk_visitor_logs 만 비우며 다른 mbk_* 테이블은 절대 건드리지 않습니다.
 */
'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

interface DeleteResult {
  ok: boolean
  deleted?: number
  error?: string
}

export async function deleteAllVisitorLogs(secret: string): Promise<DeleteResult> {
  const expected = process.env.LOG_SECRET_KEY
  if (!expected || secret !== expected) {
    return { ok: false, error: '인증 실패' }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return { ok: false, error: 'service_role 키가 설정되지 않았습니다.' }
  }

  const supabase = createClient(url, key)

  // Supabase 는 WHERE 없는 DELETE 를 거부하므로, 절대 일치할 수 없는 UUID 와 != 비교로 전체 삭제.
  const { error, count } = await supabase
    .from('mbk_visitor_logs')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/visitor-log')
  return { ok: true, deleted: count ?? 0 }
}
