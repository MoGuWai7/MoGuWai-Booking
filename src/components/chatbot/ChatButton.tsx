'use client'

import { useState } from 'react'
import ChatPanel from './ChatPanel'

interface ChatButtonProps {
  businessId: string
  businessName: string
}

export default function ChatButton({ businessId, businessName }: ChatButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50">
      {open && (
        <div className="mb-3 w-[calc(100vw-32px)] sm:w-[380px] max-w-[380px]">
          <ChatPanel
            businessId={businessId}
            businessName={businessName}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="ml-auto flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: open
            ? 'rgba(255, 255, 255, 0.92)'
            : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          color: open ? 'var(--ink)' : '#FFFFFF',
          boxShadow: open
            ? '0 1px 2px rgba(22, 22, 26, 0.06), 0 8px 32px rgba(22, 22, 26, 0.10)'
            : '0 1px 2px rgba(79, 70, 229, 0.20), 0 12px 32px rgba(79, 70, 229, 0.30)',
          border: open ? '1px solid var(--hairline)' : '1px solid rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        aria-label={open ? '도우미 닫기' : '도우미 열기'}
      >
        {open ? (
          <CloseIcon />
        ) : (
          <>
            <BubbleIcon />
            <span className="text-sm font-medium">물어보기</span>
          </>
        )}
      </button>
    </div>
  )
}

function BubbleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 8.5C3 5.46 5.46 3 8.5 3h1C12.54 3 15 5.46 15 8.5S12.54 14 9.5 14H7l-3 2v-2.5A5.5 5.5 0 0 1 3 8.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
