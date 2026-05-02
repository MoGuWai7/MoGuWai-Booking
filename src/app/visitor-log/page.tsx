/**
 * 파일 역할:
 * - 사이트 방문자 로그를 시각화하는 비공개 관리 페이지입니다.
 * - 본 페이지만 다크 테마로 운영됩니다 — 개발자 본인만 보는 비공식 운영 페이지이므로
 *   공개 라우트의 "다크 테마 금지" 규칙에서 의도적으로 제외됩니다.
 *
 * 접근 방식:
 * - URL: /visitor-log?secret=<LOG_SECRET_KEY>
 * - secret 미일치 또는 환경변수 미설정이면 notFound()로 404 노출.
 *
 * 디자인:
 * - 모과이 슈퍼 / 모과이 마켓 톤의 zinc 다크 + 인디고 글로우.
 * - 헤더 우측에 [CSV 다운로드] [전체 삭제] 버튼 (Toolbar 클라이언트 컴포넌트).
 * - 최근 로그 테이블 컬럼 순서: 시각(KST) · IP · 국가 · 도시 · 기기 · OS · 브라우저 · 업체 · 경로 · 유입.
 *
 * 주의사항:
 * - 이 페이지 자체는 src/proxy.ts 의 matcher 에서 `visitor-log` 가 제외되어 있어
 *   방문 로그에 기록되지 않습니다 (자기 자신 추적 방지).
 * - 검색 엔진 색인을 막기 위해 metadata.robots = noindex 설정.
 * - service_role 키를 사용하여 RLS 를 우회하므로 서버 컴포넌트에서만 호출.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { VisitorLog } from '@/types/database'
import { Toolbar } from './Toolbar'
import { extractReferrerHost, formatKstDate, formatKstDay } from './utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '방문자 로그 — MoGuWai',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ secret?: string }>
}

export default async function VisitorLogPage({ searchParams }: PageProps) {
  const { secret } = await searchParams
  const expected = process.env.LOG_SECRET_KEY
  if (!expected || secret !== expected) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data } = await supabase
    .from('mbk_visitor_logs')
    .select('*')
    .order('visited_at', { ascending: false })
    .limit(300)

  const logs = (data ?? []) as VisitorLog[]
  const total = logs.length
  const byDevice = groupBy(logs, 'device_type')
  const byCountry = groupBy(logs, 'country')
  const byPath = groupBy(logs, 'path')
  const bySlug = groupBy(logs, 'slug')
  const byOS = groupBy(logs, 'os')
  const byBrowser = groupBy(logs, 'browser')

  // KST 기준 오늘 카운트
  const todayKstStr = formatKstDay(new Date())
  const todayCount = logs.filter(l => {
    if (!l.visited_at) return false
    return formatKstDay(new Date(l.visited_at)) === todayKstStr
  }).length

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(ellipse 60% 40% at 80% 0%, rgba(99, 102, 241, 0.14) 0%, transparent 60%),
          radial-gradient(ellipse 50% 30% at 0% 100%, rgba(236, 72, 153, 0.06) 0%, transparent 60%),
          #0A0A0B
        `,
        color: '#FAFAFA',
      }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14">

        {/* Header */}
        <header
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 mb-8 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div>
            <p
              className="font-medium uppercase"
              style={{ fontSize: '11px', letterSpacing: '0.16em', color: '#71717A' }}
            >
              Private · Internal
            </p>
            <h1
              className="font-serif mt-2"
              style={{
                fontSize: 'clamp(36px, 5vw, 52px)',
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: '#FAFAFA',
              }}
            >
              방문자 <em style={{ color: '#A5B4FC', fontStyle: 'italic' }}>로그</em>
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#A1A1AA' }}>
              최근 300건의 사이트 방문 흐름을 한눈에 확인합니다.
            </p>
          </div>
          <Toolbar logs={logs} secret={secret!} />
        </header>

        {/* Stat tiles */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          <Tile label="총 방문" value={total} accent />
          <Tile label="오늘 (KST)" value={todayCount} />
          <Tile label="모바일" value={byDevice['mobile'] ?? 0} />
          <Tile label="데스크탑" value={byDevice['desktop'] ?? 0} />
          <Tile label="국가" value={Object.keys(byCountry).filter(k => k && k !== 'Unknown').length} />
        </section>

        {/* Grouped tables */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <StatTable
            title="업체별 예약 페이지 방문"
            data={Object.entries(bySlug)
              .filter(([k]) => k && k !== 'Unknown')
              .sort(([, a], [, b]) => b - a)
              .map(([k, v]) => [`/${k}`, v])}
          />
          <StatTable
            title="페이지별 방문 TOP 10"
            data={Object.entries(byPath)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([k, v]) => [k, v])}
          />
          <StatTable
            title="국가별 방문 TOP 10"
            data={Object.entries(byCountry)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([k, v]) => [k || '알 수 없음', v])}
          />
          <DualTable
            title="OS · 브라우저"
            left={{ label: 'OS', entries: Object.entries(byOS).sort(([, a], [, b]) => b - a) }}
            right={{ label: 'Browser', entries: Object.entries(byBrowser).sort(([, a], [, b]) => b - a) }}
          />
        </section>

        {/* Recent table */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-sm font-medium" style={{ color: '#FAFAFA' }}>최근 방문 로그</h2>
            <span className="text-xs font-num" style={{ color: '#71717A' }}>{logs.length}건</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#71717A' }}>
                  {['시각 (KST)', 'IP', '국가', '도시', '기기', 'OS', '브라우저', '업체', '경로', '유입'].map(h => (
                    <th
                      key={h}
                      className="text-left font-medium text-xs px-4 py-3 whitespace-nowrap"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12" style={{ color: '#52525B' }}>
                      아직 수집된 방문 기록이 없습니다.
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="transition-colors hover:bg-white/[0.025]">
                    <Td color="#A1A1AA" mono>
                      {log.visited_at ? formatKstDate(new Date(log.visited_at)) : '-'}
                    </Td>
                    <Td color="#D4D4D8" mono>{log.ip ?? '-'}</Td>
                    <Td color="#FAFAFA">{log.country ?? '-'}</Td>
                    <Td color="#D4D4D8">{log.city ?? '-'}</Td>
                    <Td color="#D4D4D8">{log.device_type ?? '-'}</Td>
                    <Td color="#D4D4D8">{log.os ?? '-'}</Td>
                    <Td color="#D4D4D8">{log.browser ?? '-'}</Td>
                    <Td color="#A5B4FC" mono>{log.slug ?? '—'}</Td>
                    <Td color="#A1A1AA" mono>{log.path ?? '-'}</Td>
                    <Td color="#A1A1AA" mono>{extractReferrerHost(log.referrer) ?? '직접'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-10 text-xs text-center" style={{ color: '#52525B' }}>
          이 페이지는 검색 엔진에 색인되지 않으며, /visitor-log 자체는 방문 로그에 기록되지 않습니다.
        </p>
      </div>
    </div>
  )
}

function Td({ children, color, mono = false }: { children: React.ReactNode; color: string; mono?: boolean }) {
  return (
    <td
      className={`px-4 py-2.5 whitespace-nowrap ${mono ? 'font-num' : ''}`}
      style={{ color, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {children}
    </td>
  )
}

function Tile({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: accent
          ? 'linear-gradient(180deg, rgba(99,102,241,0.18) 0%, rgba(255,255,255,0.02) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: accent ? '1px solid rgba(99,102,241,0.30)' : '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        padding: '18px',
      }}
    >
      <p
        className="font-medium uppercase"
        style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: '#71717A' }}
      >
        {label}
      </p>
      <p
        className="font-serif font-num mt-1.5"
        style={{
          fontSize: '34px',
          lineHeight: 1,
          color: accent ? '#A5B4FC' : '#FAFAFA',
          letterSpacing: '-0.02em',
        }}
      >
        {value.toLocaleString('ko-KR')}
      </p>
    </div>
  )
}

function StatTable({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(...data.map(([, v]) => v), 1)
  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        padding: '18px',
      }}
    >
      <h2 className="text-sm font-medium mb-3" style={{ color: '#FAFAFA' }}>{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm" style={{ color: '#52525B' }}>데이터 없음</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map(([label, value]) => (
            <li key={label} className="relative">
              <div
                className="absolute inset-y-0 left-0 rounded-md"
                style={{
                  width: `${(value / max) * 100}%`,
                  background: 'linear-gradient(90deg, rgba(99,102,241,0.22), rgba(99,102,241,0.04))',
                }}
              />
              <div className="relative flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-num truncate" style={{ color: '#D4D4D8' }}>{label}</span>
                <span className="text-sm font-num font-medium tabular-nums" style={{ color: '#FAFAFA' }}>{value}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DualTable({ title, left, right }: {
  title: string
  left: { label: string; entries: [string, number][] }
  right: { label: string; entries: [string, number][] }
}) {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        padding: '18px',
      }}
    >
      <h2 className="text-sm font-medium mb-3" style={{ color: '#FAFAFA' }}>{title}</h2>
      <div className="grid grid-cols-2 gap-5">
        {[left, right].map((col) => (
          <div key={col.label}>
            <p
              className="font-medium uppercase mb-2"
              style={{ fontSize: '10px', letterSpacing: '0.16em', color: '#71717A' }}
            >
              {col.label}
            </p>
            {col.entries.length === 0 ? (
              <p className="text-sm" style={{ color: '#52525B' }}>데이터 없음</p>
            ) : (
              <ul className="space-y-1">
                {col.entries.map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between text-sm">
                    <span style={{ color: '#D4D4D8' }}>{k}</span>
                    <span className="font-num font-medium" style={{ color: '#FAFAFA' }}>{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce((acc, item) => {
    const raw = item[key]
    const val = raw == null ? 'Unknown' : String(raw)
    acc[val] = (acc[val] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
}
