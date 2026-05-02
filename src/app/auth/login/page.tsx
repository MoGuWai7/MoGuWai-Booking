'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '../actions'

export default function LoginPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(login, {})

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
          <Link href="/auth/signup" className="btn-ghost text-sm">계정 만들기 →</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px] animate-fade-in-up">
          <div className="mb-8">
            <h1 className="display text-4xl mb-2" style={{ color: 'var(--ink)' }}>
              다시 오신 걸 <em>환영합니다</em>.
            </h1>
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
              가게 관리자로 로그인합니다.
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
                <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>
                  {state.fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                비밀번호
              </label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="field"
              />
              {state.fieldErrors?.password && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>
                  {state.fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full mt-6"
              style={{ padding: '12px 18px' }}
            >
              {pending ? <Spinner /> : '로그인'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t text-center text-sm" style={{ borderColor: 'var(--hairline)', color: 'var(--ink-2)' }}>
            아직 계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--ink)' }}>
              무료로 시작하기
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function Spinner() {
  return (
    <span className="flex items-center gap-2">
      <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
      잠시만요
    </span>
  )
}
