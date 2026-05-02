import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  hover?: boolean
}

export default function Card({ elevated, hover, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`${elevated ? 'card-elevated' : 'card'} ${hover ? 'transition-transform hover:-translate-y-0.5 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
