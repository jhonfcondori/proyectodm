import { useEffect, useState } from 'react'
import type { CampaignStatus } from '@proyectodm/shared'

export type CampaignStatusFilter = CampaignStatus | 'ALL'

interface CampaignFiltersProps {
  q: string
  status: CampaignStatusFilter
  onQueryChange: (q: string) => void
  onStatusChange: (status: CampaignStatusFilter) => void
}

// Search input is debounced (300 ms) so the list query is not fired on every
// keystroke; the status select applies immediately.
export function CampaignFilters({ q, status, onQueryChange, onStatusChange }: CampaignFiltersProps) {
  const [draft, setDraft] = useState(q)

  // Keep the input in sync when the parent resets the filter (e.g. the
  // "Limpiar filtros" action) without fighting the debounce while typing.
  useEffect(() => {
    setDraft(q)
  }, [q])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== q) onQueryChange(draft)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [draft, q, onQueryChange])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="campaign-search" className="block text-sm font-medium text-slate-200">
          Buscar por nombre
        </label>
        <input
          id="campaign-search"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escribe para filtrar…"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 transition placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        />
      </div>
      <div className="sm:w-56">
        <label htmlFor="campaign-status" className="block text-sm font-medium text-slate-200">
          Estado
        </label>
        <select
          id="campaign-status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as CampaignStatusFilter)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">ACTIVA</option>
          <option value="ARCHIVED">ARCHIVADA</option>
        </select>
      </div>
    </div>
  )
}
