interface ChatMessageProps {
  role: 'user' | 'model'
  content: string
  loading?: boolean
}

export default function ChatMessage({ role, content, loading }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[82%] px-4 py-2.5 text-sm leading-relaxed"
        style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(79, 70, 229, 0.10) 100%)'
            : 'var(--surface-2)',
          color: isUser ? '#3730A3' : 'var(--ink)',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          border: isUser
            ? '1px solid rgba(79, 70, 229, 0.22)'
            : '1px solid var(--hairline)',
        }}
      >
        {loading ? (
          <div className="flex gap-1 py-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: 'var(--ink-3)',
                  animation: 'pulse 1.2s ease-in-out infinite',
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
          </div>
        ) : (
          <p style={{ whiteSpace: 'pre-wrap' }}>{content}</p>
        )}
      </div>
    </div>
  )
}
