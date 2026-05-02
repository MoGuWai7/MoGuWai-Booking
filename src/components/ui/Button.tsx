'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, disabled, className = '', style, ...props }, ref) => {
    const variantClass = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
    }[variant]

    const sizeStyle: React.CSSProperties =
      size === 'sm' ? { padding: '8px 14px', fontSize: '13px' }
      : size === 'lg' ? { padding: '14px 22px', fontSize: '15px' }
      : {}

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${variantClass} ${className}`}
        style={{ ...sizeStyle, ...style }}
        {...props}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'currentColor' }} />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export default Button
