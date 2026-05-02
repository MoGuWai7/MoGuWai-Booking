/**
 * 파일 역할:
 * - 가게 설정 페이지의 3개 탭 (정보 / 담당자 / 휴무일) 클라이언트 컴포넌트입니다.
 * - 서버 액션을 호출해 변경 사항을 즉시 반영하고 낙관적 UI 업데이트를 적용합니다.
 *
 * 주의사항:
 * - 휴무일 탭의 "지정된 휴무일" 목록에서 해제 시, 다른 월의 항목도 정확히 처리되도록
 *   blocked_date 문자열을 그대로 toggleBlockedDate에 넘깁니다 (월 인덱스 의존 X).
 * - 담당자 추가는 성공 시 임시 id로 낙관적 추가 후 다음 새로고침에 실제 id로 갱신됩니다.
 */
'use client'

import { useState, useActionState, useTransition } from 'react'
import type { Business, Staff, BlockedDate } from '@/types/database'
import { updateBusiness, addStaff, toggleStaff, deleteStaff, toggleBlockedDate } from './actions'
import Modal from '@/components/ui/Modal'

interface Props {
  business: Business
  staff: Staff[]
  blockedDates: BlockedDate[]
}

type Tab = 'info' | 'staff' | 'blocked'

const TABS: { value: Tab; label: string }[] = [
  { value: 'info', label: '가게 정보' },
  { value: 'staff', label: '담당자' },
  { value: 'blocked', label: '휴무일' },
]

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function SettingsTabs({ business, staff: initialStaff, blockedDates: initialBlocked }: Props) {
  const [tab, setTab] = useState<Tab>('info')
  const [staff, setStaff] = useState(initialStaff)
  const [blockedDates, setBlockedDates] = useState(initialBlocked)
  const [newStaffName, setNewStaffName] = useState('')
  const [deleteModal, setDeleteModal] = useState<Staff | null>(null)
  const [isPending, startTransition] = useTransition()
  const [staffMsg, setStaffMsg] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  const today = new Date()
  const [calendarDate, setCalendarDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [calPending, startCalTransition] = useTransition()

  const updateAction = updateBusiness.bind(null, business.id)
  const [infoState, infoAction, infoPending] = useActionState(updateAction, {} as { error?: string })

  const blockedSet = new Set(blockedDates.map(b => b.blocked_date))

  const handleInfoSaved = () => {
    setSavedMsg('저장되었습니다')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  async function handleAddStaff() {
    if (!newStaffName.trim()) return
    startTransition(async () => {
      const result = await addStaff(business.id, newStaffName)
      if (!result.error) {
        const optimistic: Staff = {
          id: `tmp-${Date.now()}`,
          business_id: business.id,
          name: newStaffName.trim(),
          is_active: true,
          created_at: new Date().toISOString(),
        }
        setStaff(prev => [...prev, optimistic])
        setNewStaffName('')
        setStaffMsg('추가되었습니다')
        setTimeout(() => setStaffMsg(''), 2000)
      }
    })
  }

  async function handleToggleStaff(s: Staff) {
    startTransition(async () => {
      const result = await toggleStaff(s.id, s.is_active)
      if (!result.error) {
        setStaff(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x))
      }
    })
  }

  async function handleDeleteStaff(s: Staff) {
    startTransition(async () => {
      const result = await deleteStaff(s.id)
      if (!result.error) {
        setStaff(prev => prev.filter(x => x.id !== s.id))
        setDeleteModal(null)
      }
    })
  }

  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function isoDate(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  async function handleCalendarToggle(dateStr: string) {
    const isBlocked = blockedSet.has(dateStr)
    startCalTransition(async () => {
      const result = await toggleBlockedDate(business.id, dateStr, isBlocked, isBlocked ? undefined : '정기휴무')
      if (!result.error) {
        if (isBlocked) {
          setBlockedDates(prev => prev.filter(b => b.blocked_date !== dateStr))
        } else {
          setBlockedDates(prev => [...prev, {
            id: `tmp-${Date.now()}`,
            business_id: business.id,
            blocked_date: dateStr,
            reason: '정기휴무',
            created_at: new Date().toISOString(),
          }])
        }
      }
    })
  }

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  return (
    <div>
      {/* Tabs */}
      <div
        className="inline-flex rounded-xl p-1 mb-6"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}
      >
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.value ? 'var(--surface)' : 'transparent',
              color: tab === t.value ? 'var(--ink)' : 'var(--ink-3)',
              boxShadow: tab === t.value ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Info */}
      {tab === 'info' && (
        <form
          action={async (fd: FormData) => {
            await infoAction(fd)
            handleInfoSaved()
          }}
          className="card p-7 space-y-5 animate-fade-in-up"
        >
          {infoState.error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid rgba(185,28,28,0.18)' }}>
              {infoState.error}
            </div>
          )}
          {savedMsg && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid rgba(22,163,74,0.18)' }}>
              {savedMsg}
            </div>
          )}

          <Field label="가게 이름" required>
            <input name="name" defaultValue={business.name} className="field" required />
          </Field>
          <Field label="전화번호">
            <input name="phone" defaultValue={business.phone ?? ''} className="field" />
          </Field>
          <Field label="주소">
            <input name="address" defaultValue={business.address ?? ''} className="field" />
          </Field>
          <Field label="한 줄 소개">
            <input name="description" defaultValue={business.description ?? ''} className="field" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="오픈">
              <input type="time" name="open_time" defaultValue={business.open_time} className="field" />
            </Field>
            <Field label="마감">
              <input type="time" name="close_time" defaultValue={business.close_time} className="field" />
            </Field>
          </div>
          <Field label="예약 단위 (분)">
            <input type="number" name="slot_duration" defaultValue={business.slot_duration} min={15} max={240} step={15} className="field" />
          </Field>
          <button type="submit" disabled={infoPending} className="btn-primary w-full">
            {infoPending ? '저장 중' : '저장'}
          </button>
        </form>
      )}

      {/* Staff */}
      {tab === 'staff' && (
        <div className="space-y-4 animate-fade-in-up">
          {staffMsg && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid rgba(22,163,74,0.18)' }}>
              {staffMsg}
            </div>
          )}

          <div className="card overflow-hidden">
            {staff.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--ink-3)' }}>
                담당자를 한 명도 등록하지 않았어요.
              </p>
            ) : staff.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--hairline)' }}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-medium flex-shrink-0 text-sm"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--hairline)' }}
                >
                  {s.name.charAt(0)}
                </div>
                <span className="flex-1 text-sm font-medium" style={{ color: s.is_active ? 'var(--ink)' : 'var(--ink-3)' }}>
                  {s.name}
                  {!s.is_active && <span className="ml-2 text-xs font-normal" style={{ color: 'var(--ink-3)' }}>비활성</span>}
                </span>
                <button
                  onClick={() => handleToggleStaff(s)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--hairline)',
                  }}
                >
                  {s.is_active ? '비활성화' : '활성화'}
                </button>
                <button
                  onClick={() => setDeleteModal(s)}
                  disabled={isPending}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                  style={{ color: 'var(--danger)', background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.18)' }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          <div className="card p-4 flex gap-2">
            <input
              value={newStaffName}
              onChange={e => setNewStaffName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddStaff() } }}
              className="field flex-1"
              placeholder="새 담당자 이름"
            />
            <button
              onClick={handleAddStaff}
              disabled={isPending || !newStaffName.trim()}
              className="btn-primary flex-shrink-0"
              style={{ padding: '11px 18px' }}
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* Blocked dates */}
      {tab === 'blocked' && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--hairline)' }}
                aria-label="이전 달"
              >
                ‹
              </button>
              <span className="font-medium" style={{ color: 'var(--ink)' }}>
                {year}년 {MONTHS[month]}
              </span>
              <button
                onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--hairline)' }}
                aria-label="다음 달"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(w => (
                <div key={w} className="text-center text-xs py-1.5 font-medium" style={{ color: 'var(--ink-3)' }}>
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const dateStr = isoDate(day)
                const isBlocked = blockedSet.has(dateStr)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleCalendarToggle(dateStr)}
                    disabled={calPending}
                    className="aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                    style={{
                      background: isBlocked ? 'var(--danger-soft)' : 'transparent',
                      color: isBlocked ? 'var(--danger)' : 'var(--ink)',
                      border: isBlocked ? '1px solid rgba(185,28,28,0.18)' : '1px solid transparent',
                    }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
            <p className="text-xs mt-4" style={{ color: 'var(--ink-3)' }}>
              날짜를 클릭하면 휴무일로 지정/해제할 수 있어요.
            </p>
          </div>

          {blockedDates.length > 0 && (
            <div className="card overflow-hidden">
              <h3 className="text-xs font-medium px-5 py-3" style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--hairline)' }}>
                지정된 휴무일
              </h3>
              {blockedDates
                .slice()
                .sort((a, b) => a.blocked_date.localeCompare(b.blocked_date))
                .map((bd, idx) => (
                  <div
                    key={bd.id}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--hairline)' }}
                  >
                    <div>
                      <span className="font-num text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        {bd.blocked_date}
                      </span>
                      {bd.reason && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--ink-3)' }}>
                          {bd.reason}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCalendarToggle(bd.blocked_date)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ color: 'var(--danger)', background: 'var(--danger-soft)', border: '1px solid rgba(185,28,28,0.18)' }}
                    >
                      해제
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!deleteModal}
        title="담당자를 삭제하시겠습니까?"
        description={`${deleteModal?.name} 담당자를 삭제합니다. 기존 예약은 그대로 유지됩니다.`}
        confirmLabel="삭제"
        confirmVariant="danger"
        loading={isPending}
        onConfirm={() => deleteModal && handleDeleteStaff(deleteModal)}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
        {label}
        {required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
