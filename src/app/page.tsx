/**
 * 파일 역할:
 * - 비로그인 진입점인 랜딩 페이지(/)입니다.
 * - 서비스 소개, 데모 예약 페이지(/moguwai-hair) 링크, 회원가입 CTA를 제공합니다.
 *
 * 주의사항:
 * - Server Component (정적 prerender됨). 사용자 인증 상태에 따라 변하지 않습니다.
 * - 가짜 제품 미리보기(ProductPreview, MiniCalendar 등)는 단순 시각용 SVG/HTML이며 실데이터가 아닙니다.
 */
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="border-b" style={{ borderColor: 'var(--hairline)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-xl" style={{ color: 'var(--ink)' }}>모과이</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>예약</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/reservation/check" className="btn-ghost text-sm hidden sm:inline-flex">예약 조회</Link>
            <Link href="/auth/login" className="btn-ghost text-sm">로그인</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ padding: '9px 14px', fontSize: '13px' }}>
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="chip mb-7">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
              5분 만에 시작 · 신용카드 불필요
            </div>

            <h1 className="display text-[44px] sm:text-[64px] md:text-[76px] mb-6" style={{ color: 'var(--ink)' }}>
              예약을<br />
              <em>아름답게</em>,<br />
              운영을 가볍게.
            </h1>

            <p className="text-lg leading-relaxed max-w-xl mb-9" style={{ color: 'var(--ink-2)' }}>
              헤어샵, 카페, 스튜디오 — 어떤 가게든
              나만의 예약 페이지 한 장으로 충분합니다.
              고객이 직접 시간을 잡고, 고객 명단은 자동으로 쌓입니다.
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <Link href="/auth/signup" className="btn-primary" style={{ padding: '14px 22px', fontSize: '15px' }}>
                무료로 예약 페이지 만들기
                <ArrowRight />
              </Link>
              <Link href="/moguwai-hair" className="btn-ghost" style={{ padding: '14px 16px', fontSize: '14px' }}>
                실제 예약 페이지 보기
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-10 pt-6 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <Stat value="5" suffix="분" label="첫 페이지 발행" />
              <Stat value="24" suffix="시간" label="자동 응대" />
              <Stat value="0" suffix="원" label="시작 비용" />
            </div>
          </div>

          {/* Product preview mock */}
          <div className="lg:col-span-5">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Marquee separator */}
      <section className="border-y py-5" style={{ borderColor: 'var(--hairline)', background: 'var(--surface-2)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm text-center" style={{ color: 'var(--ink-3)' }}>
            소상공인 · 1인 매장 · 부티크 스튜디오 · 동네 카페가 함께 사용하고 있어요
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <div className="eyebrow mb-3">절차</div>
            <h2 className="display text-4xl md:text-5xl" style={{ color: 'var(--ink)' }}>
              가입부터 첫 예약까지<br />
              <em>다섯 걸음.</em>
            </h2>
          </div>
          <div className="md:col-span-7 md:pt-12">
            <p className="text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              회원가입을 마치면 가게 정보를 한번 입력하는 것으로 모든 준비가 끝납니다.
              이후 발급되는 짧은 링크 하나를 인스타 프로필이나 카카오톡에 붙여 두기만 하면,
              고객은 사장님께 따로 연락하지 않고도 빈 시간을 직접 골라 예약을 마칠 수 있습니다.
            </p>
          </div>
        </div>

        <ol className="grid md:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: 'var(--hairline)' }}>
          <Step n="01" title="가게 등록" desc="이름, 운영시간, 담당자만 적으면 끝." />
          <Step n="02" title="링크 공유" desc="짧은 주소를 인스타·카톡에 붙여 두세요." />
          <Step n="03" title="예약 받기" desc="고객이 직접 시간을 고르고, 알림이 갑니다." />
        </ol>
      </section>

      {/* Feature blocks */}
      <section className="border-t" style={{ borderColor: 'var(--hairline)', background: 'var(--surface-2)' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-16 max-w-2xl">
            <div className="eyebrow mb-3">기능</div>
            <h2 className="display text-4xl md:text-5xl" style={{ color: 'var(--ink)' }}>
              운영에 필요한 거의 전부.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FeatureBlock
              title="시각적인 예약 캘린더"
              desc="휴무일·정원·운영시간을 반영한 실시간 캘린더. 중복 예약은 자동으로 막아 둡니다."
              visual={<MiniCalendar />}
            />
            <FeatureBlock
              title="자동으로 쌓이는 고객 DB"
              desc="예약 한 건이 곧 한 명의 단골로. 방문 횟수, 마지막 방문일이 자동 기록됩니다."
              visual={<MiniCustomers />}
            />
            <FeatureBlock
              title="24시간 응대하는 AI 도우미"
              desc="가게 정보, 영업시간, 빈 시간 — 고객 질문에 자동으로 답해줍니다. 사장님은 잠 좀 주무세요."
              visual={<MiniChat />}
            />
            <FeatureBlock
              title="한눈에 보는 오늘의 일정"
              desc="대기·확정·완료·취소를 색이 아닌 의미로 구분합니다. 모바일에서도 똑같이."
              visual={<MiniDashboard />}
            />
          </div>
        </div>
      </section>

      {/* Pricing-like callout */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div
          className="rounded-3xl p-10 md:p-14 grid md:grid-cols-2 gap-8 items-end relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(99, 102, 241, 0.18) 0%, transparent 60%),' +
              'radial-gradient(ellipse 60% 50% at 0% 100%, rgba(180, 83, 9, 0.06) 0%, transparent 60%),' +
              'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(244, 242, 237, 0.85) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.18)',
            boxShadow: '0 1px 2px rgba(22, 22, 26, 0.04), 0 16px 48px rgba(79, 70, 229, 0.10)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <div className="eyebrow mb-3" style={{ color: 'var(--accent)' }}>지금 시작</div>
            <h2 className="display text-4xl md:text-5xl" style={{ color: 'var(--ink)' }}>
              가게에 어울리는<br />
              <em>나만의 예약 링크.</em>
            </h2>
            <p className="mt-4 max-w-md leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              지금 만들어 보세요. 5분이면 충분합니다. 마음에 들지 않으면 그냥 두면 되니까요.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-medium text-base transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                boxShadow: '0 1px 2px rgba(79, 70, 229, 0.20), 0 12px 32px rgba(79, 70, 229, 0.28)',
              }}
            >
              무료로 시작하기
              <ArrowRight />
            </Link>
            <span className="text-sm" style={{ color: 'var(--ink-3)' }}>
              카드 등록 없이 · 광고 없음
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10" style={{ borderColor: 'var(--hairline)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg" style={{ color: 'var(--ink)' }}>모과이</span>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>· 작은 가게를 위한 예약 도구</span>
          </div>
          <div className="flex items-center gap-5 text-sm" style={{ color: 'var(--ink-3)' }}>
            <Link href="/reservation/check">예약 조회</Link>
            <Link href="/auth/login">로그인</Link>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Stat({ value, suffix, label }: { value: string; suffix: string; label: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-0.5">
        <span className="font-serif text-3xl" style={{ color: 'var(--ink)' }}>{value}</span>
        <span className="text-sm" style={{ color: 'var(--ink-3)' }}>{suffix}</span>
      </div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>{label}</div>
    </div>
  )
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <li className="bg-paper p-8" style={{ background: 'var(--paper)' }}>
      <div className="font-serif text-2xl mb-6" style={{ color: 'var(--ink-4)' }}>{n}</div>
      <h3 className="font-medium mb-2" style={{ color: 'var(--ink)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{desc}</p>
    </li>
  )
}

function FeatureBlock({ title, desc, visual }: { title: string; desc: string; visual: React.ReactNode }) {
  return (
    <div className="card p-8 md:p-10">
      <h3 className="font-medium text-lg mb-2" style={{ color: 'var(--ink)' }}>{title}</h3>
      <p className="text-sm leading-relaxed mb-7" style={{ color: 'var(--ink-2)' }}>{desc}</p>
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        {visual}
      </div>
    </div>
  )
}

/* ---------- Decorative product mockups (CSS only) ---------- */

function ProductPreview() {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 -m-3 rounded-3xl"
        style={{ background: 'linear-gradient(180deg, rgba(79,70,229,0.06), transparent)' }}
        aria-hidden
      />
      <div className="card-elevated p-5 relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--surface-3)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--surface-3)' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--surface-3)' }} />
          </div>
          <div className="flex-1 ml-2 text-xs px-2.5 py-1 rounded-md text-center" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
            moguwai.app/yourshop
          </div>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="font-medium" style={{ color: 'var(--ink)' }}>모과이 헤어</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>강남구 · 09:00 — 21:00</div>
          </div>
          <span className="chip">예약 가능</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-5">
          {['월','화','수','목','금','토','일'].map(d => (
            <div key={d} className="text-center text-[10px] py-1" style={{ color: 'var(--ink-3)' }}>{d}</div>
          ))}
          {Array.from({ length: 21 }).map((_, i) => {
            const isSelected = i === 10
            const isAvail = [3, 5, 7, 10, 12, 13, 15, 17, 19].includes(i)
            return (
              <div
                key={i}
                className="aspect-square rounded-md flex items-center justify-center text-xs"
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(79, 70, 229, 0.14) 100%)'
                    : isAvail ? 'var(--surface)' : 'transparent',
                  color: isSelected ? '#3730A3' : isAvail ? 'var(--ink)' : 'var(--ink-4)',
                  border: isSelected
                    ? '1px solid rgba(79, 70, 229, 0.35)'
                    : isAvail ? '1px solid var(--hairline)' : 'none',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {i + 1}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>가능한 시간</div>
          <span className="text-xs" style={{ color: 'var(--ink-3)' }}>11일 · 화</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30'].map((t, i) => (
            <div
              key={t}
              className="text-center text-xs py-2 rounded-md"
              style={{
                background: i === 2
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(79, 70, 229, 0.14) 100%)'
                  : 'var(--surface)',
                color: i === 2 ? '#3730A3' : 'var(--ink-2)',
                border: i === 2 ? '1px solid rgba(79, 70, 229, 0.35)' : '1px solid var(--hairline)',
                opacity: [4].includes(i) ? 0.4 : 1,
                textDecoration: [4].includes(i) ? 'line-through' : 'none',
                fontWeight: i === 2 ? 600 : 400,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniCalendar() {
  return (
    <div className="p-6">
      <div className="text-sm font-medium mb-4" style={{ color: 'var(--ink)' }}>11월 · 2026</div>
      <div className="grid grid-cols-7 gap-1">
        {['일','월','화','수','목','금','토'].map(d => (
          <div key={d} className="text-center text-[10px] py-1" style={{ color: 'var(--ink-3)' }}>{d}</div>
        ))}
        {Array.from({ length: 28 }).map((_, i) => {
          const isSel = i === 13
          const isToday = i === 9
          const blocked = [4, 18].includes(i)
          return (
            <div key={i} className="aspect-square rounded-md flex items-center justify-center text-xs"
              style={{
                background: isSel
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22) 0%, rgba(79, 70, 229, 0.14) 100%)'
                  : 'transparent',
                color: isSel ? '#3730A3' : blocked ? 'var(--ink-4)' : 'var(--ink)',
                border: isSel
                  ? '1px solid rgba(79, 70, 229, 0.35)'
                  : isToday
                    ? '1px solid rgba(79, 70, 229, 0.45)'
                    : 'none',
                textDecoration: blocked ? 'line-through' : 'none',
                fontWeight: isSel ? 600 : isToday ? 500 : 400,
              }}>
              {i + 1}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniCustomers() {
  const list = [
    { name: '김선영', phone: '010-1234-5678', visits: 7, vip: true },
    { name: '박지수', phone: '010-9876-5432', visits: 3, vip: true },
    { name: '이민준', phone: '010-1111-2222', visits: 1, vip: false },
  ]
  return (
    <div className="p-6 space-y-3">
      {list.map(c => (
        <div key={c.name} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', color: 'var(--ink-2)' }}>
            {c.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{c.name}</span>
              {c.vip && <span className="chip chip-accent" style={{ padding: '2px 6px', fontSize: '10px' }}>VIP</span>}
            </div>
            <div className="text-xs" style={{ color: 'var(--ink-3)' }}>{c.phone}</div>
          </div>
          <div className="font-num text-sm" style={{ color: 'var(--ink-2)' }}>{c.visits}회</div>
        </div>
      ))}
    </div>
  )
}

function MiniChat() {
  return (
    <div className="p-6 space-y-3">
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-br-md px-4 py-2 text-sm max-w-[80%]"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(79, 70, 229, 0.10) 100%)',
            color: '#3730A3',
            border: '1px solid rgba(79, 70, 229, 0.22)',
          }}>
          내일 오후에 예약 가능한가요?
        </div>
      </div>
      <div className="flex">
        <div className="rounded-2xl rounded-bl-md px-4 py-2 text-sm max-w-[80%]"
          style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--hairline)' }}>
          내일은 오후 2시, 4시 30분, 6시에 예약 가능합니다. 어떤 시간이 좋으세요?
        </div>
      </div>
    </div>
  )
}

function MiniDashboard() {
  const items = [
    { time: '10:00', name: '김선영', status: '확정' },
    { time: '11:30', name: '박지수', status: '대기' },
    { time: '14:00', name: '이민준', status: '완료' },
  ]
  return (
    <div className="p-6 space-y-2">
      {items.map(r => (
        <div key={r.time} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
          <div className="font-num text-sm font-medium w-12" style={{ color: 'var(--ink)' }}>{r.time}</div>
          <div className="flex-1 text-sm" style={{ color: 'var(--ink-2)' }}>{r.name}</div>
          <span className={`chip ${
            r.status === '확정' ? 'chip-accent' :
            r.status === '대기' ? 'chip-warning' :
            'chip-success'
          }`}>{r.status}</span>
        </div>
      ))}
    </div>
  )
}
