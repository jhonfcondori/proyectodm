import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  children?: ReactNode
}

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p> : null}
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </section>
  )
}
