import type { HealthResponse } from '@proyectodm/shared'

export type BadgeStatus = 'ok' | 'degraded' | 'error' | 'loading'

const styles: Record<BadgeStatus, string> = {
  ok: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  degraded: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  error: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  loading: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
}

interface StatusBadgeProps {
  status: BadgeStatus
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {label}
    </span>
  )
}

export interface HealthBadge {
  status: BadgeStatus
  label: string
}

// Single source of truth for the health pill shown in HealthCard and in the
// app header badge.
export function deriveHealthBadge(
  health: HealthResponse | undefined,
  isLoading: boolean,
  error: Error | null,
): HealthBadge {
  if (error) return { status: 'error', label: 'Sin conexión' }
  if (isLoading) return { status: 'loading', label: 'Comprobando' }
  if (health?.status === 'ok') return { status: 'ok', label: 'Operativo' }
  return { status: 'degraded', label: 'Degradado' }
}
