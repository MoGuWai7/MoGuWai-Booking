/**
 * 파일 역할:
 * - 사장님 콘솔(/dashboard/*) 전용 레이아웃입니다.
 * - 좌측 사이드바(데스크톱) + 모바일 하단 탭바를 제공합니다.
 * - 비로그인/가게 미등록 시 안전 리다이렉트 처리도 여기서 수행합니다.
 *
 * 주의사항:
 * - proxy.ts에서 1차로 보호되지만, 미들웨어 우회 가능성에 대비해 서버 컴포넌트 단에서
 *   다시 한 번 getUser() 검증을 수행합니다 (이중 안전장치 패턴).
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'

const NAV = [
  { href: '/dashboard', label: '홈', exact: true, icon: HomeIcon },
  { href: '/dashboard/reservations', label: '예약', icon: CalendarIcon },
  { href: '/dashboard/customers', label: '고객', icon: UsersIcon },
  { href: '/dashboard/settings', label: '설정', icon: SettingsIcon },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('mbk_businesses')
    .select('id, name, slug')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!business) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-0 h-screen"
        style={{ borderRight: '1px solid var(--hairline)', background: 'var(--paper)' }}
      >
        <div className="px-5 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl" style={{ color: 'var(--ink)' }}>모과이</span>
          </Link>
          <div className="text-xs mt-1 truncate" style={{ color: 'var(--ink-3)' }}>
            {business.name}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--ink-2)' }}
              >
                <Icon />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 space-y-0.5 border-t" style={{ borderColor: 'var(--hairline)' }}>
          <Link
            href={`/${business.slug}`}
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--ink-3)' }}
          >
            <ExternalIcon />
            예약 페이지 열기
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full transition-colors text-left"
              style={{ color: 'var(--ink-3)' }}
            >
              <LogoutIcon />
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-5 h-14 border-b"
          style={{ background: 'var(--paper)', borderColor: 'var(--hairline)' }}
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-lg" style={{ color: 'var(--ink)' }}>모과이</span>
          </Link>
          <span className="text-xs truncate ml-3" style={{ color: 'var(--ink-3)' }}>{business.name}</span>
        </header>

        <main className="flex-1 pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t"
        style={{
          background: 'var(--paper)',
          borderColor: 'var(--hairline)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)',
          paddingTop: '6px',
        }}
      >
        {NAV.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-1.5 text-[11px]"
              style={{ color: 'var(--ink-2)' }}
            >
              <Icon />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 6.5L8 2l6 4.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6h12M5 2v3M11 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 14a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 4.5a2 2 0 0 1 0 4M11 13.5a3.5 3.5 0 0 1 3-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5v1.8M8 12.7v1.8M14.5 8h-1.8M3.3 8H1.5M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3M12.6 12.6l-1.3-1.3M4.7 4.7L3.4 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M9 2h5v5M14 2L7 9M12 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 5l3 3-3 3M14 8H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
