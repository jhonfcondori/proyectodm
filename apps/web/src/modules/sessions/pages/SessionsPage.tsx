import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { SessionStatus } from '@proyectodm/shared'
import { EmptyState, InlineError, PageHeader, Skeleton } from '../../../components/ui'
import { apiErrorMessage, isNotFound } from '../../../lib/api-client'
import { useCampaign } from '../../campaigns'
import { SessionCard } from '../components/SessionCard'
import { SessionForm, type SessionFormSubmission } from '../components/SessionForm'
import {
  useCreateSession,
  useNextSessionNumber,
  useSessions,
} from '../hooks'

const PAGE_SIZE = 20

type SessionStatusFilter = 'ALL' | SessionStatus

const statusOptions: Array<{ value: SessionStatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'DRAFT', label: 'Borradores' },
  { value: 'PLAYED', label: 'Jugadas' },
  { value: 'CLOSED', label: 'Cerradas' },
]

function sessionCountLabel(total: number): string {
  return total === 1 ? '1 sesión' : `${total} sesiones`
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-6 w-2/3" />
      <Skeleton className="mt-3 h-4 w-40" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-4 h-9 w-32" />
    </div>
  )
}

export function SessionsPage() {
  const { campaignId = '' } = useParams()
  const campaignQuery = useCampaign(campaignId)
  const [status, setStatus] = useState<SessionStatusFilter>('ALL')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const listQuery = useSessions(campaignId, {
    page,
    limit: PAGE_SIZE,
    ...(status === 'ALL' ? {} : { status }),
  })
  const nextNumberQuery = useNextSessionNumber(campaignId, showForm)
  const createMutation = useCreateSession(campaignId)

  const totalPages = Math.max(1, listQuery.data?.meta.totalPages ?? 1)
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const closeCreateForm = useCallback(() => {
    setShowForm(false)
    createMutation.reset()
  }, [createMutation])

  function handleFormSubmit(submission: SessionFormSubmission) {
    if (submission.mode !== 'create') return
    createMutation.mutate(submission.values, {
      onSuccess: () => closeCreateForm(),
    })
  }

  if (campaignQuery.isLoading) {
    return <SkeletonCard />
  }

  if (campaignQuery.isError) {
    if (isNotFound(campaignQuery.error)) {
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
        message={apiErrorMessage(campaignQuery.error)}
        onRetry={() => {
          void campaignQuery.refetch()
        }}
      />
    )
  }

  const campaign = campaignQuery.data
  if (!campaign) {
    return <SkeletonCard />
  }

  const listError = listQuery.isError ? apiErrorMessage(listQuery.error) : null
  const createError = showForm && createMutation.isError ? apiErrorMessage(createMutation.error) : null
  const hasFilters = status !== 'ALL'
  const nextNumber = nextNumberQuery.data?.number ?? null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={`/campaigns/${campaignId}`}
          className="text-sm font-medium text-sky-300 transition hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          ← Volver a {campaign.name}
        </Link>
      </div>

      <PageHeader
        title={`Sesiones · ${campaign.name}`}
        description="Registra lo que ocurrió en cada sesión y su estado de preparación."
      >
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          aria-expanded={showForm}
          className="rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          {showForm ? 'Cerrar formulario' : 'Nueva sesión'}
        </button>
      </PageHeader>

      {showForm ? (
        <section
          aria-label="Nueva sesión"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Nueva sesión</h2>
          <SessionForm
            mode="create"
            nextNumber={nextNumber}
            isSubmitting={createMutation.isPending}
            errorMessage={createError}
            onSubmit={handleFormSubmit}
            onCancel={closeCreateForm}
          />
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setStatus(option.value)
              setPage(1)
            }}
            aria-pressed={status === option.value}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
              status === option.value
                ? 'border-amber-300/60 bg-amber-300/10 text-amber-300'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {listQuery.isLoading ? (
        <>
          <p role="status" className="sr-only">
            Cargando sesiones…
          </p>
          <div className="grid gap-4 md:grid-cols-2">
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
            description="Ninguna sesión coincide con el filtro aplicado."
          >
            <button
              type="button"
              onClick={() => {
                setStatus('ALL')
                setPage(1)
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              Limpiar filtros
            </button>
          </EmptyState>
        ) : (
          <EmptyState
            title="Todavía no hay sesiones"
            description="Crea la primera sesión de esta campaña para empezar el registro."
          >
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              Crear sesión
            </button>
          </EmptyState>
        )
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {listQuery.data ? sessionCountLabel(listQuery.data.meta.total) : ''}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {listQuery.data?.data.map((session) => (
              <SessionCard key={session.id} campaignId={campaignId} session={session} />
            ))}
          </div>

          <nav
            aria-label="Paginación de sesiones"
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
    </div>
  )
}
