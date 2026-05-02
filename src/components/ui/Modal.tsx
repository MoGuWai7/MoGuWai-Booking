'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function Modal({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  confirmVariant = 'primary',
  loading,
  onConfirm,
  onCancel,
}: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(22, 22, 26, 0.32)', backdropFilter: 'blur(4px)' }}
        onClick={onCancel}
      />
      <div className="relative card-elevated p-7 w-full max-w-sm animate-fade-in-up">
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--ink)' }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            {description}
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={loading} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                처리 중
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
