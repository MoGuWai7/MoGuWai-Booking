/**
 * 파일 역할:
 * - 사이트 방문자 로그를 시각화하는 비공개 관리 페이지입니다.
 * - 대시보드 layout과 무관하게 app/ 바로 아래에 위치하므로 사이드바·탭바 등 공통 chrome이 없습니다.
 *
 * 접근 방식:
 * - URL: /visitor-log?secret=<LOG_SECRET_KEY>
 * - secret 미일치 또는 환경변수 미설정이면 notFound()로 404 노출.
 *
 * 디자인:
 * - 본 페이지는 다른 페이지와 동일한 페이퍼톤(밝은 배경 + 반투명 카드 + 잉크 컬러)으로 통일.
 * - 카드는 backdrop-blur 반투명 surface, 메탈릭 골드 + 인디고 강조색으로 고급스러운 인상.
 *
 * 주의사항:
 * - 이 페이지 자체는 src/proxy.ts의 matcher에서 `visitor-log`가 제외되어 있어
 *   방문 로그에 기록되지 않습니다 (자기 자신 추적 방지).
 * - 검색 엔진 색인을 막기 위해 metadata.robots = noindex 설정.
 * - service_role 키를 사용하여 RLS를 우회하므로 서버 컴포넌트에서만 호출.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { VisitorLog } from '@/types/database'

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

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayCount = logs.filter(l => (l.visited_at ?? '').slice(0, 10) === todayStr).length

  return (
    <div className="bg-mesh min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 mb-8 border-b" style={{ borderColor: 'var(--hairline)' }}>
          <div>
            <p className="eyebrow">Private · Internal</p>
            <h1 className="display mt-2" style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
              방문자 <em>로그</em>
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--ink-3)' }}>
              최근 300건의 사이트 방문 흐름을 한눈에 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip chip-accent">noindex</span>
            <span className="chip">{new Date().toLocaleString('ko-KR')}</span>
          </div>
        </header>

        {/* Stat tiles */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          <Tile label="총 방문" value={total} accent />
          <Tile label="오늘" value={todayCount} />
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
          className="card"
          style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--hairline)' }}>
            <h2 className="text-sm font-medium" style={{ color: 'var(--ink)' }}>최근 방문 로그</h2>
            <span className="text-xs font-num" style={{ color: 'var(--ink-3)' }}>{logs.length}건</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--ink-3)' }}>
                  {['시간', '경로', '업체', '국가', '도시', '기기', 'OS', '브라우저'].map(h => (
                    <th
                      key={h}
                      className="text-left font-medium text-xs px-4 py-3"
                      style={{ borderBottom: '1px solid var(--hairline)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12" style={{ color: 'var(--ink-3)' }}>
                      아직 수집된 방문 기록이 없습니다.
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-[var(--surface-2)]/60"
                  >
                    <td className="px-4 py-2.5 font-num whitespace-nowrap" style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--hairline)' }}>
                      {log.visited_at ? new Date(log.visited_at).toLocaleString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-2.5 font-num" style={{ color: 'var(--ink-2)', borderBottom: '1px solid var(--hairline)' }}>
                      {log.path ?? '-'}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--accent)', borderBottom: '1px solid var(--hairline)' }}>
                      {log.slug ?? '—'}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--hairline)' }}>{log.country ?? '-'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--hairline)' }}>{log.city ?? '-'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--hairline)' }}>{log.device_type ?? '-'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--hairline)' }}>{log.os ?? '-'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink)', borderBottom: '1px solid var(--hairline)' }}>{log.browser ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-10 text-xs text-center" style={{ color: 'var(--ink-4)' }}>
          이 페이지는 검색 엔진에 색인되지 않으며, /visitor-log 자체는 방문 로그에 기록되지 않습니다.
        </p>
      </div>
    </div>
  )
}

function Tile({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="card relative overflow-hidden"
      style={{
        background: accent
          ? 'linear-gradient(180deg, rgba(79,70,229,0.06) 0%, rgba(255,255,255,0.85) 100%)'
          : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        padding: '18px 18px',
      }}
    >
      <p className="eyebrow" style={{ fontSize: '10.5px' }}>{label}</p>
      <p
        className="font-serif font-num mt-1.5"
        style={{
          fontSize: '34px',
          lineHeight: 1,
          color: accent ? 'var(--accent)' : 'var(--ink)',
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
      className="card"
      style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '18px' }}
    >
      <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ink-4)' }}>데이터 없음</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map(([label, value]) => (
            <li key={label} className="relative">
              <div
                className="absolute inset-y-0 left-0 rounded-md"
                style={{
                  width: `${(value / max) * 100}%`,
                  background: 'linear-gradient(90deg, rgba(79,70,229,0.10), rgba(79,70,229,0.02))',
                }}
              />
              <div className="relative flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-num truncate" style={{ color: 'var(--ink-2)' }}>{label}</span>
                <span className="text-sm font-num font-medium tabular-nums" style={{ color: 'var(--ink)' }}>{value}</span>
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
      className="card"
      style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '18px' }}
    >
      <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--ink)' }}>{title}</h2>
      <div className="grid grid-cols-2 gap-5">
        {[left, right].map((col) => (
          <div key={col.label}>
            <p className="eyebrow mb-2" style={{ fontSize: '10px' }}>{col.label}</p>
            {col.entries.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ink-4)' }}>데이터 없음</p>
            ) : (
              <ul className="space-y-1">
                {col.entries.map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--ink-2)' }}>{k}</span>
                    <span className="font-num font-medium" style={{ color: 'var(--ink)' }}>{v}</span>
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
