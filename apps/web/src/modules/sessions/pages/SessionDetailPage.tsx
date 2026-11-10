import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  SESSION_NEXT_STATUS,
  type SessionStatus,
} from '@proyectodm/shared'
import {
  ConfirmDialog,
  EmptyState,
  InlineError,
  PageHeader,
  Skeleton,
} from '../../../components/ui'
import { apiErrorMessage, isNotFound } from '../../../lib/api-client'
import { useCampaign } from '../../campaigns'
import { SessionForm, type SessionFormSubmission } from '../components/SessionForm'
import { SessionStatusBadge } from '../components/SessionStatusBadge'
import {
  useDeleteSession,
  useSession,
  useTransitionSession,
  useUpdateSession,
} from '../hooks'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES')
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function transitionCopy(status: SessionStatus): { label: string; title: string; description: string } | null {
  const next = SESSION_NEXT_STATUS[status]
  if (next === 'PLAYED') {
    return {
      label: 'Marcar como jugada',
      title: 'Marcar sesión como jugada',
      description: 'La sesión pasará a JUGADA. Si no tenía fecha, se guardará la fecha actual.',
    }
  }
  if (next === 'CLOSED') {
    return {
      label: 'Cerrar sesión',
      title: 'Cerrar sesión',
      description: 'La sesión pasará a CERRADA. Esta transición no se puede deshacer.',
    }
  }
  return null
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status">
      <span className="sr-only">Cargando sesión…</span>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export function SessionDetailPage() {
  const { campaignId = '', sessionId = '' } = useParams()
  const navigate = useNavigate()
  const sessionQuery = useSession(sessionId)
  const campaignQuery = useCampaign(campaignId)
  const updateMutation = useUpdateSession(campaignId)
  const transitionMutation = useTransitionSession(campaignId)
  const deleteMutation = useDeleteSession(campaignId)

  const [editing, setEditing] = useState(false)
  const [confirmingTransition, setConfirmingTransition] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const closeEditForm = useCallback(() => {
    setEditing(false)
    updateMutation.reset()
  }, [updateMutation])

  const closeTransitionDialog = useCallback(() => {
    transitionMutation.reset()
    setConfirmingTransition(false)
  }, [transitionMutation])

  const closeDeleteDialog = useCallback(() => {
    deleteMutation.reset()
    setConfirmingDelete(false)
  }, [deleteMutation])

  if (sessionQuery.isLoading) {
    return <DetailSkeleton />
  }

  if (sessionQuery.isError) {
    if (isNotFound(sessionQuery.error)) {
      return (
        <EmptyState
          title="Sesión no encontrada"
          description="La sesión que buscas no existe o fue eliminada."
        >
          <Link
            to={`/campaigns/${campaignId}/sessions`}
            className="rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            Volver a las sesiones
          </Link>
        </EmptyState>
      )
    }
    return (
      <InlineError
        message={apiErrorMessage(sessionQuery.error)}
        onRetry={() => {
          void sessionQuery.refetch()
        }}
      />
    )
  }

  const session = sessionQuery.data
  if (!session) {
    return <DetailSkeleton />
  }

  const campaignName = campaignQuery.data?.name ?? null
  const nextAction = transitionCopy(session.status)
  const nextStatus = SESSION_NEXT_STATUS[session.status]

  const editError = editing && updateMutation.isError ? apiErrorMessage(updateMutation.error) : null
  const actionError =
    !editing && updateMutation.isError ? apiErrorMessage(updateMutation.error) : null
  const transitionError = transitionMutation.isError
    ? apiErrorMessage(transitionMutation.error)
    : null
  const deleteError = deleteMutation.isError ? apiErrorMessage(deleteMutation.error) : null

  const handleFormSubmit = (submission: SessionFormSubmission) => {
    if (submission.mode !== 'edit') return
    updateMutation.mutate(
      { id: session.id, input: submission.patch },
      { onSuccess: () => closeEditForm() },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={`/campaigns/${campaignId}/sessions`}
          className="text-sm font-medium text-sky-300 transition hover:text-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          ← {campaignName ? `Sesiones de ${campaignName}` : 'Volver a las sesiones'}
        </Link>
      </div>

      <PageHeader title={`Sesión ${session.number}: ${session.title}`}>
        <SessionStatusBadge status={session.status} />
        {nextAction ? (
          <button
            type="button"
            onClick={() => setConfirmingTransition(true)}
            disabled={transitionMutation.isPending}
            className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {nextAction.label}
          </button>
        ) : null}
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
          onClick={() => setConfirmingDelete(true)}
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
        >
          Eliminar
        </button>
      </PageHeader>

      {editing ? (
        <section
          aria-label="Editar sesión"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">Editar sesión</h2>
          <SessionForm
            mode="edit"
            initial={{
              title: session.title,
              summary: session.summary,
              playedAt: session.playedAt,
            }}
            isSubmitting={updateMutation.isPending}
            errorMessage={editError}
            onSubmit={handleFormSubmit}
            onCancel={closeEditForm}
          />
        </section>
      ) : null}

      {actionError ? <InlineError message={actionError} /> : null}
      {transitionError ? <InlineError message={transitionError} /> : null}

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Número</dt>
          <dd className="mt-1 text-2xl font-semibold text-white">{session.number}</dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Estado</dt>
          <dd className="mt-1">
            <SessionStatusBadge status={session.status} />
          </dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Fecha de juego</dt>
          <dd className="mt-1 text-sm font-medium text-slate-100">
            {session.playedAt ? formatDateTime(session.playedAt) : 'Sin fecha'}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Actualizada</dt>
          <dd className="mt-1 text-sm font-medium text-slate-100">
            {formatDate(session.updatedAt)}
          </dd>
        </div>
      </dl>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold text-white">Resumen</h2>
        {session.summary ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {session.summary}
          </p>
        ) : (
          <p className="mt-3 text-sm italic text-slate-500">Esta sesión no tiene resumen.</p>
        )}
      </section>

      {session.notePath ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Nota del vault</h2>
          <p className="mt-2 break-all font-mono text-sm text-slate-300">{session.notePath}</p>
        </section>
      ) : null}

      <p className="text-xs text-slate-500">
        Creada el {formatDate(session.createdAt)} · Actualizada el {formatDate(session.updatedAt)}
      </p>

      <ConfirmDialog
        open={confirmingTransition && nextAction !== null}
        title={nextAction?.title ?? 'Cambiar estado'}
        description={nextAction?.description}
        confirmLabel="Confirmar"
        destructive={nextStatus === 'CLOSED'}
        confirmDisabled={transitionMutation.isPending}
        onClose={closeTransitionDialog}
        onConfirm={() => {
          if (nextStatus === null) return
          transitionMutation.mutate(
            { id: session.id, status: nextStatus },
            { onSuccess: () => setConfirmingTransition(false) },
          )
        }}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Eliminar sesión"
        description={`Se eliminará la sesión ${session.number} (${session.title}). Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        confirmDisabled={deleteMutation.isPending}
        onClose={closeDeleteDialog}
        onConfirm={() => {
          deleteMutation.mutate(session.id, {
            onSuccess: () => {
              setConfirmingDelete(false)
              void navigate(`/campaigns/${campaignId}/sessions`)
            },
          })
        }}
      />

      {deleteError ? <InlineError message={deleteError} /> : null}
    </div>
  )
}
