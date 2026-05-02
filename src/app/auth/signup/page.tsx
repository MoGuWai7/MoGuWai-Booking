'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from '../actions'

export default function SignupPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(signup, {})

  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo)
  }, [state.redirectTo, router])

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <header className="border-b" style={{ borderColor: 'var(--hairline)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl" style={{ color: 'var(--ink)' }}>모과이</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>예약</span>
          </Link>
          <Link href="/auth/login" className="btn-ghost text-sm">로그인 →</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px] animate-fade-in-up">
          <div className="mb-8">
            <div className="chip mb-4">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
              무료로 시작 · 카드 등록 없음
            </div>
            <h1 className="display text-4xl mb-2" style={{ color: 'var(--ink)' }}>
              <em>5분</em>이면<br />첫 예약 페이지가 완성돼요.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              이메일 한 번이면 충분합니다. 가입 후 가게 정보만 입력하면
              나만의 예약 링크를 바로 받을 수 있어요.
            </p>
          </div>

          {state.error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.18)' }}>
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                이메일
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="hello@example.com"
                className="field"
              />
              {state.fieldErrors?.email && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>{state.fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                비밀번호
              </label>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="6자 이상"
                className="field"
              />
              {state.fieldErrors?.password && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>{state.fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                비밀번호 확인
              </label>
              <input
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                placeholder="다시 한번 입력해주세요"
                className="field"
              />
              {state.fieldErrors?.passwordConfirm && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>{state.fieldErrors.passwordConfirm}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full mt-6"
              style={{ padding: '12px 18px' }}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                  계정 만드는 중
                </span>
              ) : '계정 만들기'}
            </button>
          </form>

          <p className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            가입하시면{' '}
            <span style={{ color: 'var(--ink-2)' }}>이용약관</span> 및{' '}
            <span style={{ color: 'var(--ink-2)' }}>개인정보처리방침</span>에 동의하는 것으로 간주됩니다.
          </p>

          <div className="mt-8 pt-6 border-t text-center text-sm" style={{ borderColor: 'var(--hairline)', color: 'var(--ink-2)' }}>
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--ink)' }}>
              로그인
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
