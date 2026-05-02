/**
 * 파일 역할:
 * - 대시보드 홈 상단의 통계 카드 컴포넌트입니다. 0 → value 까지 카운트업 애니메이션을 보여줍니다.
 */
'use client'

import { useEffect, useRef, useState } from 'react'

interface StatCardProps {
  label: string
  value: number
  hint?: string
  delay?: number
}

export default function StatCard({ label, value, hint, delay = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now()
      const duration = 700

      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(Math.round(value * eased))
        if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, delay])

  return (
    <div className="card p-5">
      <div className="text-xs font-medium mb-3" style={{ color: 'var(--ink-3)' }}>
        {label}
      </div>
      <div className="font-serif text-4xl font-num" style={{ color: 'var(--ink)' }}>
        {displayValue}
      </div>
      {hint && (
        <div className="text-xs mt-1" style={{ color: 'var(--ink-3)' }}>
          {hint}
        </div>
      )}
    </div>
  )
}
