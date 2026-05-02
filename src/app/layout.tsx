/**
 * 파일 역할:
 * - 모든 페이지의 최상위 루트 레이아웃입니다.
 * - 글로벌 CSS와 메타데이터(SEO)를 정의합니다.
 *
 * 주의사항:
 * - 향후 사이트 방문자 로그 기능을 추가할 때, 추적 컴포넌트를 여기에 직접 마운트하면
 *   /admin/logs 같은 로그 조회 페이지도 자기 자신을 기록하게 됩니다.
 *   route group(예: app/(public)/layout.tsx)으로 분리하거나, 추적 컴포넌트 내부에서
 *   pathname 기반 제외 처리가 필수입니다. (docs/handover/13-visitor-logs.md)
 */
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '모과이 — 작은 가게를 위한 예약 도구',
  description: '헤어샵, 카페, 스튜디오 등 어떤 가게든 5분 만에 만드는 나만의 예약 페이지. 고객은 직접 시간을 잡고, 고객 명단은 자동으로 쌓입니다.',
  keywords: '예약시스템, 예약관리, 헤어샵 예약, 카페 예약, 네일샵 예약, 소상공인, 스튜디오 예약',
  openGraph: {
    title: '모과이 예약',
    description: '5분이면 충분한 나만의 예약 페이지',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
