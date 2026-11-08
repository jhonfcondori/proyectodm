import type { HealthResponse } from '@proyectodm/shared'
import { StatusBadge, type BadgeStatus } from './StatusBadge'

interface HealthCardProps {
  health: HealthResponse | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  onRetry: () => void
}

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(timestamp))
}

export function HealthCard({ health, isLoading, isFetching, error, onRetry }: HealthCardProps) {
  const database = health?.checks.database
  const status: BadgeStatus = error
    ? 'error'
    : isLoading
      ? 'loading'
      : health?.status === 'ok'
        ? 'ok'
        : 'degraded'
  const label = error
    ? 'Sin conexión'
    : isLoading
      ? 'Comprobando'
      : health?.status === 'ok'
        ? 'Operativo'
        : 'Degradado'

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Estado del sistema
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Núcleo modular</h2>
        </div>
        <StatusBadge status={status} label={label} />
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">API</dt>
          <dd className="mt-1 text-lg font-medium text-slate-100">
            {health ? `v${health.version}` : '—'}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Base de datos</dt>
          <dd className="mt-1 flex items-center gap-2 text-lg font-medium text-slate-100">
            <span>
              {database?.status === 'ok'
                ? 'SQLite accesible'
                : database?.status === 'error'
                  ? 'No disponible'
                  : '—'}
            </span>
            {database?.latencyMs !== undefined ? (
              <span className="text-sm font-normal text-slate-400">{database.latencyMs} ms</span>
            ) : null}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Tiempo activo</dt>
          <dd className="mt-1 text-lg font-medium text-slate-100">
            {health ? `${Math.round(health.uptimeSeconds)} s` : '—'}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Última lectura</dt>
          <dd className="mt-1 text-lg font-medium text-slate-100">
            {health ? formatTimestamp(health.timestamp) : '—'}
          </dd>
        </div>
      </dl>

      {error ? (
        <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error.message}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500">Se actualiza cada 15 segundos.</p>
        <button
          type="button"
          onClick={onRetry}
          disabled={isFetching}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFetching ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>
    </section>
  )
}
