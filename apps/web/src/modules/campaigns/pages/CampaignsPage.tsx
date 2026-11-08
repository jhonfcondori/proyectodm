import { useCallback, useEffect, useState } from 'react'
import type { Campaign } from '@proyectodm/shared'
import { EmptyState, InlineError, PageHeader, Skeleton } from '../../../components/ui'
import { apiErrorMessage } from '../../../lib/api-client'
import { CampaignCard } from '../components/CampaignCard'
import { CampaignForm, type CampaignFormSubmission } from '../components/CampaignForm'
import {
  CampaignFilters,
  type CampaignStatusFilter,
} from '../components/CampaignFilters'
import { DeleteCampaignDialog } from '../components/DeleteCampaignDialog'
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useUpdateCampaign } from '../hooks'

const PAGE_SIZE = 20

function campaignCountLabel(total: number): string {
  return total === 1 ? '1 campaña' : `${total} campañas`
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-4 h-8 w-full" />
    </div>
  )
}

export function CampaignsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<CampaignStatusFilter>('ALL')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [deleting, setDeleting] = useState<Campaign | null>(null)

  const listQuery = useCampaigns({
    page,
    limit: PAGE_SIZE,
    ...(status === 'ALL' ? {} : { status }),
    ...(q.trim() === '' ? {} : { q }),
  })
  const createMutation = useCreateCampaign()
  const updateMutation = useUpdateCampaign()
  const deleteMutation = useDeleteCampaign()

  const totalPages = Math.max(1, listQuery.data?.meta.totalPages ?? 1)
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const handleQueryChange = useCallback((value: string) => {
    setQ(value)
    setPage(1)
  }, [])

  const handleStatusChange = useCallback((value: CampaignStatusFilter) => {
    setStatus(value)
    setPage(1)
  }, [])

  const closeCreateForm = useCallback(() => {
    setShowForm(false)
    createMutation.reset()
  }, [createMutation])

  const closeEditForm = useCallback(() => {
    setEditing(null)
    updateMutation.reset()
  }, [updateMutation])

  const closeDeleteDialog = useCallback(() => {
    deleteMutation.reset()
    setDeleting(null)
  }, [deleteMutation])

  // The form reports what it built: the full body on create, and only the
  // changed fields on edit (an edit with no changes never reaches here, the
  // form closes itself instead).
  function handleFormSubmit(submission: CampaignFormSubmission) {
    if (submission.mode === 'create') {
      createMutation.mutate(submission.values, {
        onSuccess: () => closeCreateForm(),
      })
      return
    }
    if (!editing) return
    updateMutation.mutate(
      { id: editing.id, input: submission.patch },
      {
        onSuccess: () => closeEditForm(),
      },
    )
  }

  function handleToggleStatus(campaign: Campaign) {
    updateMutation.mutate({
      id: campaign.id,
      input: { status: campaign.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' },
    })
  }

  const hasFilters = q.trim() !== '' || status !== 'ALL'
  const listError = listQuery.isError ? apiErrorMessage(listQuery.error) : null
  const createError = showForm && createMutation.isError ? apiErrorMessage(createMutation.error) : null
  const editError = editing && updateMutation.isError ? apiErrorMessage(updateMutation.error) : null
  const actionError =
    !editing && !showForm && updateMutation.isError ? apiErrorMessage(updateMutation.error) : null
  const deleteError = deleteMutation.isError ? apiErrorMessage(deleteMutation.error) : null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campañas"
        description="Crea y organiza tus campañas locales de D&D 5e."
      >
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setShowForm((current) => !current)
          }}
          aria-expanded={showForm}
          className="rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          {showForm ? 'Cerrar formulario' : 'Nueva campaña'}
        </button>
      </PageHeader>

      {showForm ? (
        <section
          aria-label="Nueva campaña"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Nueva campaña</h2>
          <CampaignForm
            mode="create"
            isSubmitting={createMutation.isPending}
            errorMessage={createError}
            onSubmit={handleFormSubmit}
            onCancel={closeCreateForm}
          />
        </section>
      ) : null}

      {editing ? (
        <section
          aria-label={`Editar ${editing.name}`}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Editar campaña</h2>
          <CampaignForm
            mode="edit"
            initial={{ name: editing.name, description: editing.description }}
            isSubmitting={updateMutation.isPending}
            errorMessage={editError}
            onSubmit={handleFormSubmit}
            onCancel={closeEditForm}
          />
        </section>
      ) : null}

      <CampaignFilters
        q={q}
        status={status}
        onQueryChange={handleQueryChange}
        onStatusChange={handleStatusChange}
      />

      {actionError ? <InlineError message={actionError} /> : null}

      {listQuery.isLoading ? (
        <>
          <p role="status" className="sr-only">
            Cargando campañas…
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </>
      ) : listError ? (
        <InlineError
          message={listError}
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      ) : listQuery.data && listQuery.data.data.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="Sin resultados"
            description="Ninguna campaña coincide con los filtros aplicados."
          >
            <button
              type="button"
              onClick={() => {
                handleQueryChange('')
                handleStatusChange('ALL')
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              Limpiar filtros
            </button>
          </EmptyState>
        ) : (
          <EmptyState
            title="Todavía no hay campañas"
            description="Crea tu primera campaña para empezar a preparar aventuras."
          >
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              Crear campaña
            </button>
          </EmptyState>
        )
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {listQuery.data ? campaignCountLabel(listQuery.data.meta.total) : ''}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {listQuery.data?.data.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEdit={(selected) => {
                  setShowForm(false)
                  setEditing(selected)
                }}
                onToggleStatus={handleToggleStatus}
                onDelete={(selected) => setDeleting(selected)}
              />
            ))}
          </div>

          <nav
            aria-label="Paginación de campañas"
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4"
          >
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span aria-live="polite" className="text-sm text-slate-400">
              Página {Math.min(page, totalPages)} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </nav>
        </>
      )}

      <DeleteCampaignDialog
        campaign={deleting}
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteError}
        onCancel={closeDeleteDialog}
        onConfirm={() => {
          if (!deleting) return
          deleteMutation.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
          })
        }}
      />
    </div>
  )
}
