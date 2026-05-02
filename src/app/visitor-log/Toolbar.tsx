/**
 * 파일 역할:
 * - /visitor-log 헤더 우측의 [CSV 다운로드] [전체 삭제] 버튼을 담당하는 클라이언트 컴포넌트.
 *
 * 동작:
 * - CSV 다운로드: 서버에서 받은 logs 배열을 CSV 로 직렬화하여 Blob 다운로드.
 *   엑셀 호환을 위해 UTF-8 BOM 을 앞에 붙입니다.
 * - 전체 삭제: window.confirm 으로 한 번 막고, 서버 액션을 호출 후 새로고침.
 *
 * 주의사항:
 * - secret 을 props 로 받아 서버 액션에 전달합니다. 페이지 자체가 secret 검증을 통과한 상태에서만
 *   렌더되므로, 이 secret 을 다시 넘기는 것이 보안상 추가 위험이 되지 않습니다.
 * - 다크 테마 전용 페이지라서 스타일은 인라인으로 어두운 톤을 직접 정의했습니다.
 */
'use client'

import { useState, useTransition } from 'react'
import type { VisitorLog } from '@/types/database'
import { deleteAllVisitorLogs } from './actions'
import { countryName, extractReferrerHost, formatKstDate, formatKstDay } from './utils'

interface ToolbarProps {
  logs: VisitorLog[]
  secret: string
}

export function Toolbar({ logs, secret }: ToolbarProps) {
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)

  const handleCsv = () => {
    if (logs.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }
    const csv = generateCsv(logs)
    // UTF-8 BOM 을 앞에 붙여야 Excel 한글이 깨지지 않음
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visitor-log-${formatKstDay(new Date())}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = () => {
    if (busy) return
    const ok = window.confirm(
      `정말 모든 방문자 로그를 삭제하시겠습니까?\n\n총 ${logs.length}건의 기록이 영구적으로 사라지며 되돌릴 수 없습니다.`
    )
    if (!ok) return
    setBusy(true)
    startTransition(async () => {
      const res = await deleteAllVisitorLogs(secret)
      if (res.ok) {
        // 페이지를 새로고침하면 revalidate 된 데이터가 다시 그려짐
        window.location.reload()
      } else {
        alert(`삭제 실패: ${res.error ?? 'unknown'}`)
        setBusy(false)
      }
    })
  }

  const disabled = isPending || busy
  const isEmpty = logs.length === 0

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCsv}
        disabled={isEmpty}
        className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: '#FAFAFA',
        }}
        onMouseEnter={e => {
          if (!isEmpty) e.currentTarget.style.background = 'rgba(255,255,255,0.09)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        CSV 다운로드
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled || isEmpty}
        className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(239,68,68,0.10)',
          border: '1px solid rgba(239,68,68,0.30)',
          color: '#FCA5A5',
        }}
        onMouseEnter={e => {
          if (!disabled && !isEmpty) e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(239,68,68,0.10)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        {disabled ? '삭제 중...' : '전체 삭제'}
      </button>
    </div>
  )
}

function generateCsv(logs: VisitorLog[]): string {
  const headers = ['시각(KST)', 'IP', '국가', '도시', '업체', '경로', '유입', '기기', 'OS', '브라우저']
  const rows = logs.map(log => [
    log.visited_at ? formatKstDate(new Date(log.visited_at)) : '',
    log.ip ?? '',
    countryName(log.country) ?? '',
    log.city ?? '',
    log.slug ?? '',
    log.path ?? '',
    extractReferrerHost(log.referrer) ?? '',
    log.device_type ?? '',
    log.os ?? '',
    log.browser ?? '',
  ])
  return [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\r\n')
}

function escapeCsv(v: string): string {
  if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}
