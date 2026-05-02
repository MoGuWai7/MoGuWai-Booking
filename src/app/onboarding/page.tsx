'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBusiness } from './actions'
import type { Category } from '@/types/database'

const STEPS = ['업종', '가게 정보', '운영시간', '담당자']

const CATEGORIES: { id: Category; label: string; desc: string }[] = [
  { id: 'restaurant', label: '식당 · 카페', desc: '홀 예약, 단체석' },
  { id: 'hair', label: '헤어샵', desc: '디자이너별 예약' },
  { id: 'nail', label: '네일샵', desc: '시술별 예약' },
  { id: 'skin', label: '피부 · 에스테틱', desc: '관리사별 예약' },
  { id: 'etc', label: '기타', desc: '범용 예약' },
]

const DURATION_OPTIONS = [
  { value: 15, label: '15분' },
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(createBusiness, {})
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo)
  }, [state.redirectTo, router])

  const [category, setCategory] = useState<Category | ''>('')
  const [staffLines, setStaffLines] = useState([''])
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('18:00')
  const [slotDuration, setSlotDuration] = useState(60)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')

  const canProceed = () => {
    if (step === 0) return category !== ''
    if (step === 1) return name.trim().length > 0 && phone.trim().length >= 9
    return true
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Top bar */}
      <header className="border-b" style={{ borderColor: 'var(--hairline)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl" style={{ color: 'var(--ink)' }}>모과이</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>예약</span>
          </Link>
          <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
            {step + 1} / {STEPS.length}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="eyebrow mb-3">설정</div>
          <h1 className="display text-4xl md:text-5xl mb-3" style={{ color: 'var(--ink)' }}>
            첫 예약 페이지를<br />함께 만들어 봐요.
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
            잠깐이면 됩니다. 나중에 모든 항목을 다시 수정할 수 있어요.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-10">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex items-center gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <div
                  className="h-1 rounded-full transition-all"
                  style={{ background: i <= step ? 'var(--ink)' : 'var(--hairline)' }}
                />
                <span className="text-xs font-medium" style={{ color: i <= step ? 'var(--ink)' : 'var(--ink-3)' }}>
                  {s}
                </span>
              </div>
            </div>
          ))}
        </div>

        <form action={action}>
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="open_time" value={openTime} />
          <input type="hidden" name="close_time" value={closeTime} />
          <input type="hidden" name="slot_duration" value={slotDuration} />
          <input type="hidden" name="staff" value={staffLines.filter(Boolean).join('\n') || '담당자1'} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="phone" value={phone} />
          <input type="hidden" name="address" value={address} />
          <input type="hidden" name="description" value={description} />

          <div className="card p-8 sm:p-10">
            {state.error && (
              <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.18)' }}>
                {state.error}
              </div>
            )}

            {/* Step 0: Category */}
            {step === 0 && (
              <div className="animate-fade-in-up">
                <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--ink)' }}>
                  어떤 가게를 운영하세요?
                </h2>
                <p className="text-sm mb-7" style={{ color: 'var(--ink-2)' }}>
                  업종에 맞춰 예약 방식을 자동으로 맞춰 드려요.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORIES.map(cat => {
                    const active = category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className="text-left p-5 rounded-xl transition-all"
                        style={{
                          background: active ? 'var(--ink)' : 'var(--surface)',
                          border: `1px solid ${active ? 'var(--ink)' : 'var(--hairline)'}`,
                          color: active ? 'var(--paper)' : 'var(--ink)',
                        }}
                      >
                        <div className="font-medium mb-1">{cat.label}</div>
                        <div className="text-xs" style={{ color: active ? 'rgba(255,255,255,0.65)' : 'var(--ink-3)' }}>
                          {cat.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Info */}
            {step === 1 && (
              <div className="animate-fade-in-up space-y-5">
                <div>
                  <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--ink)' }}>
                    가게에 대해 알려주세요
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
                    예약 페이지 상단에 보여줄 정보예요.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                    가게 이름
                    <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    className="field"
                    placeholder="예) 모과이 헤어"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  {state.fieldErrors?.name && <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>{state.fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                    전화번호
                    <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    className="field"
                    placeholder="010-0000-0000"
                    inputMode="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                    주소
                  </label>
                  <input
                    className="field"
                    placeholder="서울시 강남구 ..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
                    한 줄 소개
                  </label>
                  <input
                    className="field"
                    placeholder="간단한 가게 소개를 적어주세요"
                    maxLength={100}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Hours */}
            {step === 2 && (
              <div className="animate-fade-in-up space-y-6">
                <div>
                  <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--ink)' }}>
                    언제 영업하세요?
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
                    이 시간 안에서 예약 슬롯이 자동으로 생성됩니다.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>오픈</label>
                    <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="field" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>마감</label>
                    <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="field" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--ink-2)' }}>예약 단위</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map(opt => {
                      const active = slotDuration === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSlotDuration(opt.value)}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: active ? 'var(--ink)' : 'var(--surface)',
                            border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
                            color: active ? 'var(--paper)' : 'var(--ink-2)',
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}>
                  <span style={{ color: 'var(--ink)' }}>미리보기 · </span>
                  {openTime} ~ {closeTime}, {slotDuration}분 단위 예약
                </div>
              </div>
            )}

            {/* Step 3: Staff */}
            {step === 3 && (
              <div className="animate-fade-in-up space-y-5">
                <div>
                  <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--ink)' }}>
                    함께 일하는 분이 있나요?
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
                    여러 명이라면 고객이 담당자를 선택할 수 있어요. 혼자라면 한 명만 적어 주세요.
                  </p>
                </div>

                <div className="space-y-2">
                  {staffLines.map((sname, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={sname}
                        onChange={e => {
                          const next = [...staffLines]
                          next[i] = e.target.value
                          setStaffLines(next)
                        }}
                        className="field"
                        placeholder={`담당자 ${i + 1} 이름`}
                      />
                      {staffLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setStaffLines(staffLines.filter((_, j) => j !== i))}
                          className="px-3 rounded-xl"
                          style={{ background: 'var(--surface-2)', color: 'var(--ink-3)', border: '1px solid var(--hairline)' }}
                          aria-label="삭제"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {staffLines.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setStaffLines([...staffLines, ''])}
                      className="w-full py-2.5 rounded-xl text-sm transition-colors"
                      style={{
                        background: 'transparent',
                        border: '1px dashed var(--rule)',
                        color: 'var(--ink-3)',
                      }}
                    >
                      + 담당자 추가
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-10 pt-6 border-t" style={{ borderColor: 'var(--hairline)' }}>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="btn-secondary"
                >
                  이전
                </button>
              ) : (
                <Link href="/" className="btn-secondary">취소</Link>
              )}
              <div className="flex-1" />
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="btn-primary"
                >
                  다음
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                      만드는 중
                    </span>
                  ) : '예약 페이지 만들기'}
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
