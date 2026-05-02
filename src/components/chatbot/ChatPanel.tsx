/**
 * 파일 역할:
 * - 손님 예약 페이지의 AI 챗봇 패널입니다. 메시지 입력/표시/스크롤을 담당합니다.
 * - /api/chat POST를 호출하여 응답을 받습니다.
 *
 * 주의사항:
 * - 최초 마운트 시 환영 메시지를 보여주며, 이후 사용자 입력에 따라 messages 배열을 누적합니다.
 * - height 단위로 dvh를 사용해 모바일 키보드 등장 시 패널이 깨지지 않도록 했습니다.
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'

interface Message {
  role: 'user' | 'model'
  content: string
}

interface ChatPanelProps {
  businessId: string
  businessName: string
  onClose: () => void
}

const WELCOME = (name: string) => `안녕하세요. ${name} 예약 도우미입니다.\n예약 가능 시간, 담당자, 위치 등 무엇이든 물어보세요.`

export default function ChatPanel({ businessId, businessName, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: WELCOME(businessName) },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          businessId,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'model', content: data.content ?? '오류가 발생했습니다.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: '연결 오류가 발생했습니다.' }])
    }
    setLoading(false)
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden animate-slide-up card-elevated"
      style={{
        height: '60dvh',
        minHeight: '380px',
        maxHeight: '560px',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--hairline)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.30)',
            }}
          >
            AI
          </div>
          <div>
            <div className="text-sm font-medium leading-tight" style={{ color: 'var(--ink)' }}>
              {businessName}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
              <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>응대 중</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--ink-3)' }}
          aria-label="닫기"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} content={m.content} />
        ))}
        {loading && <ChatMessage role="model" content="" loading />}
        <div ref={bottomRef} />
      </div>

      <div
        className="flex gap-2 p-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--hairline)' }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          className="field flex-1"
          style={{ padding: '10px 14px', fontSize: '14px' }}
          placeholder="메시지를 입력하세요"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn-primary flex-shrink-0"
          style={{ padding: '10px 14px', minWidth: '46px' }}
          aria-label="보내기"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 12V2M3 6l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
