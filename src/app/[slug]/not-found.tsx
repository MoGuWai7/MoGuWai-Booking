import Link from 'next/link'

export default function SlugNotFound() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-5 py-16">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <div className="font-serif text-6xl mb-3" style={{ color: 'var(--ink)' }}>404.</div>
        <h1 className="display text-3xl mb-3" style={{ color: 'var(--ink)' }}>
          예약 페이지를 찾을 수 없어요.
        </h1>
        <p className="text-sm mb-9 leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          주소가 잘못되었거나, 아직 예약 페이지가 만들어지지 않았습니다.<br />
          가게 사장님께 링크를 다시 한 번 확인해 주세요.
        </p>

        <div className="card p-7 mb-6 text-left">
          <div className="eyebrow mb-3">사장님이신가요?</div>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            지금 가게의 예약 페이지를 직접 만들 수 있어요. 5분이면 충분합니다.
          </p>
          <Link
            href="/auth/signup"
            className="btn-primary w-full"
            style={{ justifyContent: 'center' }}
          >
            무료로 시작하기
          </Link>
        </div>

        <Link href="/" className="text-sm" style={{ color: 'var(--ink-3)' }}>
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
