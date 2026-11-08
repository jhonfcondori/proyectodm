import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import { EmptyState, InlineError, PageHeader, Skeleton } from '../../../components/ui'
import { apiErrorMessage, isNotFound } from '../../../lib/api-client'
import { CampaignStatusBadge } from '../components/CampaignStatusBadge'
import { CampaignForm, type CampaignFormSubmission } from '../components/CampaignForm'
import { DeleteCampaignDialog } from '../components/DeleteCampaignDialog'
import { useCampaign, useDeleteCampaign, useUpdateCampaign } from '../hooks'

// Future sub-routes of the detail page. The tabs below are placeholders that
// point at them: they stay disabled until those pages exist.
function futureTabs(campaignId: string) {
  return [
    { id: 'sessions', label: 'Sesiones', path: `/campaigns/${campaignId}/sessions` },
    { id: 'wiki', label: 'Wiki', path: `/campaigns/${campaignId}/wiki` },
    { id: 'pending', label: 'Pendientes', path: `/campaigns/${campaignId}/pendientes` },
  ]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES')
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status">
      <span className="sr-only">Cargando campaña…</span>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

export function CampaignDetailPage() {
  const { campaignId = '' } = useParams()
  const query = useCampaign(campaignId)
  const updateMutation = useUpdateCampaign()
  const deleteMutation = useDeleteCampaign()

  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const closeEditForm = useCallback(() => {
    setEditing(false)
    updateMutation.reset()
  }, [updateMutation])

  const closeDeleteDialog = useCallback(() => {
    deleteMutation.reset()
    setConfirmingDelete(false)
  }, [deleteMutation])

  if (query.isLoading) {
    return <DetailSkeleton />
  }

  if (query.isError) {
    if (isNotFound(query.error)) {
      return (
        <EmptyState
          title="Campaña no encontrada"
          description="La campaña que buscas no existe o fue eliminada."
        >
          <Link
            to="/campaigns"
            className="rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            Volver a campañas
          </Link>
        </EmptyState>
      )
    }
    return (
      <InlineError
        message={apiErrorMessage(query.error)}
        onRetry={() => {
          void query.refetch()
        }}
      />
    )
  }

  const campaign = query.data
  if (!campaign) {
    return <DetailSkeleton />
  }

  const isArchived = campaign.status === 'ARCHIVED'
  const editError = editing && updateMutation.isError ? apiErrorMessage(updateMutation.error) : null
  const actionError =
    !editing && updateMutation.isError ? apiErrorMessage(updateMutation.error) : null
  const deleteError = deleteMutation.isError ? apiErrorMessage(deleteMutation.error) : null

  const handleFormSubmit = (submission: CampaignFormSubmission) => {
    // This page only renders the edit form; guard anyway so the shape stays
    // exhaustive if a create form is ever added here.
    if (submission.mode !== 'edit') return
    updateMutation.mutate(
      { id: campaign.id, input: submission.patch },
      { onSuccess: () => closeEditForm() },
    )
  }

  const handleToggleStatus = () => {
    updateMutation.mutate({
      id: campaign.id,
      input: { status: isArchived ? 'ACTIVE' : 'ARCHIVED' },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={campaign.name} description={campaign.description ?? 'Sin descripción.'}>
        <CampaignStatusBadge status={campaign.status} />
        <button
          type="button"
          onClick={() => setEditing((current) => !current)}
          aria-expanded={editing}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          {editing ? 'Cerrar edición' : 'Editar'}
        </button>
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={updateMutation.isPending}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isArchived ? 'Restaurar' : 'Archivar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
        >
          Eliminar
        </button>
      </PageHeader>

      <div role="tablist" aria-label="Secciones de la campaña" className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          role="tab"
          id="tab-summary"
          aria-selected="true"
          aria-controls="panel-summary"
          className="rounded-t-lg border-b-2 border-amber-300 px-4 py-2 text-sm font-medium text-amber-300"
        >
          Resumen
        </button>
        {futureTabs(campaignId).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected="false"
            aria-disabled="true"
            tabIndex={-1}
            disabled
            data-future-href={tab.path}
            title={`Próximamente: ${tab.path}`}
            className="cursor-not-allowed rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600"
          >
            {tab.label}
            <span className="ml-2 text-xs text-slate-700">(próximamente)</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-summary" aria-labelledby="tab-summary" className="flex flex-col gap-6">
        {editing ? (
          <section
            aria-label="Editar campaña"
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Editar campaña</h2>
            <CampaignForm
              mode="edit"
              initial={{ name: campaign.name, description: campaign.description }}
              isSubmitting={updateMutation.isPending}
              errorMessage={editError}
              onSubmit={handleFormSubmit}
              onCancel={closeEditForm}
            />
          </section>
        ) : null}

        {actionError ? <InlineError message={actionError} /> : null}

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Sesiones</dt>
            <dd className="mt-1 text-2xl font-semibold text-white">{campaign.sessionCount}</dd>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Entidades</dt>
            <dd className="mt-1 text-2xl font-semibold text-white">{campaign.entityCount}</dd>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Creada</dt>
            <dd className="mt-1 text-lg font-medium text-slate-100">
              {formatDate(campaign.createdAt)}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Actualizada</dt>
            <dd className="mt-1 text-lg font-medium text-slate-100">
              {formatDate(campaign.updatedAt)}
            </dd>
          </div>
        </dl>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Descripción</h2>
          {campaign.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {campaign.description}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-slate-500">Esta campaña no tiene descripción.</p>
          )}
        </section>

        <p className="text-xs text-slate-500">
          Creada el {formatDate(campaign.createdAt)} · Actualizada el{' '}
          {formatDate(campaign.updatedAt)}
        </p>
      </div>

      <DeleteCampaignDialog
        campaign={confirmingDelete ? campaign : null}
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteError}
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          deleteMutation.mutate(campaign.id, {
            onSuccess: () => setConfirmingDelete(false),
          })
        }}
      />
    </div>
  )
}
