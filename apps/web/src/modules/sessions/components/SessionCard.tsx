import { Link } from 'react-router'
import type { Session } from '@proyectodm/shared'
import { SessionStatusBadge } from './SessionStatusBadge'

interface SessionCardProps {
  campaignId: string
  session: Session
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES')
}

export function SessionCard({ campaignId, session }: SessionCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sesión {session.number}
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold text-white">{session.title}</h2>
        </div>
        <SessionStatusBadge status={session.status} />
      </div>

      <p className="text-sm text-slate-400">
        {session.playedAt
          ? `Jugada el ${formatDate(session.playedAt)}`
          : 'Sin fecha de juego'}
      </p>

      {session.summary ? (
        <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {session.summary}
        </p>
      ) : (
        <p className="text-sm italic text-slate-500">Sin resumen.</p>
      )}

      <Link
        to={`/campaigns/${campaignId}/sessions/${session.id}`}
        className="mt-auto self-start rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
      >
        Abrir sesión
      </Link>
    </article>
  )
}
