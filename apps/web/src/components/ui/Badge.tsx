import type { ReactNode } from 'react'

export type BadgeTone = 'slate' | 'sky' | 'emerald' | 'amber' | 'rose'

const toneStyles: Record<BadgeTone, string> = {
  slate: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  sky: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  rose: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'slate', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneStyles[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
