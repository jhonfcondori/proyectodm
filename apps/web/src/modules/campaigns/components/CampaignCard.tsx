import { Link } from 'react-router'
import type { Campaign } from '@proyectodm/shared'
import { CampaignStatusBadge } from './CampaignStatusBadge'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES')
}

interface CampaignCardProps {
  campaign: Campaign
  onEdit: (campaign: Campaign) => void
  onToggleStatus: (campaign: Campaign) => void
  onDelete: (campaign: Campaign) => void
}

export function CampaignCard({ campaign, onEdit, onToggleStatus, onDelete }: CampaignCardProps) {
  const isArchived = campaign.status === 'ARCHIVED'

  return (
    <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 text-lg font-semibold text-white">
          <Link
            to={`/campaigns/${campaign.id}`}
            className="rounded-sm text-inherit transition hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            {campaign.name}
          </Link>
        </h2>
        <CampaignStatusBadge status={campaign.status} />
      </div>

      {campaign.description ? (
        <p className="mt-2 line-clamp-3 text-sm text-slate-400">{campaign.description}</p>
      ) : (
        <p className="mt-2 text-sm italic text-slate-500">Sin descripción.</p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Actualizada el {formatDate(campaign.updatedAt)} · Creada el {formatDate(campaign.createdAt)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => onEdit(campaign)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onToggleStatus(campaign)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {isArchived ? 'Restaurar' : 'Archivar'}
        </button>
        <button
          type="button"
          onClick={() => onDelete(campaign)}
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
        >
          Eliminar
        </button>
      </div>
    </article>
  )
}
