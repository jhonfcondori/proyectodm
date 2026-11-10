import { useRef, useState, type FormEvent } from 'react'
import type { z } from 'zod'
import {
  SessionCreateSchema,
  SessionUpdateSchema,
  type SessionCreate,
  type SessionUpdate,
} from '@proyectodm/shared'
import { InlineError } from '../../../components/ui'
import {
  diffSessionInput,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
  type SessionFormValues,
} from '../form'

// What the form hands back to its caller:
// - `create` carries the full body (the API assigns number and status);
// - `edit` carries only the changed fields, so the page never PATCHes an
//   empty body (the shared update schema rejects it).
export type SessionFormSubmission =
  | { mode: 'create'; values: SessionCreate }
  | { mode: 'edit'; patch: SessionUpdate }

interface SessionFormProps {
  mode: 'create' | 'edit'
  initial?: SessionFormValues | null
  /** Number the API will assign, shown as a preview on create. */
  nextNumber?: number | null
  isSubmitting?: boolean
  errorMessage?: string | null
  onSubmit: (submission: SessionFormSubmission) => void
  onCancel: () => void
}

type FieldErrors = Partial<Record<'title' | 'summary' | 'playedAt' | 'form', string>>

// The shared schemas ship English messages; the UI shows the first issue of
// each field translated to Spanish.
function issueToSpanish(issue: z.core.$ZodIssue): string {
  const field: PropertyKey | undefined = issue.path[0]
  if (issue.code === 'too_big') {
    if (field === 'title') return `El título debe tener como máximo ${String(issue.maximum)} caracteres.`
    if (field === 'summary') {
      return `El resumen debe tener como máximo ${String(issue.maximum)} caracteres.`
    }
  }
  if (issue.code === 'too_small' && issue.origin === 'string') {
    if (field === 'title') return 'El título es obligatorio.'
    if (field === 'summary') return 'El resumen es demasiado corto.'
  }
  if (field === 'playedAt') return 'La fecha no es válida.'
  if (issue.code === 'custom' && field === undefined) {
    return 'Debes indicar al menos un cambio.'
  }
  return 'Revisa este campo.'
}

function validateCreate(values: SessionCreate): FieldErrors {
  const result = SessionCreateSchema.safeParse(values)
  if (result.success) return {}
  return toFieldErrors(result.error.issues)
}

function validateEdit(patch: SessionUpdate): FieldErrors {
  const result = SessionUpdateSchema.safeParse(patch)
  if (result.success) return {}
  return toFieldErrors(result.error.issues)
}

function toFieldErrors(issues: z.core.$ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const field: PropertyKey | undefined = issue.path[0]
    if (field === 'title' && errors.title === undefined) {
      errors.title = issueToSpanish(issue)
    } else if (field === 'summary' && errors.summary === undefined) {
      errors.summary = issueToSpanish(issue)
    } else if (field === 'playedAt' && errors.playedAt === undefined) {
      errors.playedAt = issueToSpanish(issue)
    } else if (field === undefined && errors.form === undefined) {
      errors.form = issueToSpanish(issue)
    }
  }
  // The update schema's "at least one field" refine fires even when a field
  // already failed: the field message is the useful one, so drop the rest.
  if (errors.title !== undefined || errors.summary !== undefined || errors.playedAt !== undefined) {
    delete errors.form
  }
  return errors
}

function normalizedSummary(value: string): string | null {
  return value.trim() === '' ? null : value
}

export function SessionForm({
  mode,
  initial,
  nextNumber = null,
  isSubmitting = false,
  errorMessage = null,
  onSubmit,
  onCancel,
}: SessionFormProps) {
  const initialValues: SessionFormValues = {
    title: initial?.title ?? '',
    summary: initial?.summary === '' ? null : (initial?.summary ?? null),
    playedAt: initial?.playedAt ?? null,
  }

  const [title, setTitle] = useState(initialValues.title)
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [playedAt, setPlayedAt] = useState(toDateTimeLocalValue(initialValues.playedAt))
  const [errors, setErrors] = useState<FieldErrors>({})
  const titleInputRef = useRef<HTMLInputElement>(null)
  const playedAtInputRef = useRef<HTMLInputElement>(null)
  const summaryInputRef = useRef<HTMLTextAreaElement>(null)

  // Keyboard/screen-reader feedback on a failed submit: focus jumps to the
  // first invalid control, which already carries `aria-invalid` and is
  // described by its message.
  function focusFirstInvalid(nextErrors: FieldErrors) {
    if (nextErrors.title !== undefined) {
      titleInputRef.current?.focus()
    } else if (nextErrors.playedAt !== undefined) {
      playedAtInputRef.current?.focus()
    } else if (nextErrors.summary !== undefined) {
      summaryInputRef.current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values: SessionFormValues = {
      title,
      summary: normalizedSummary(summary),
      playedAt: fromDateTimeLocalValue(playedAt),
    }

    if (mode === 'create') {
      const nextErrors = validateCreate(values)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) {
        focusFirstInvalid(nextErrors)
        return
      }
      onSubmit({ mode: 'create', values })
      return
    }

    const patch = diffSessionInput(initialValues, values)
    // Nothing changed: an empty PATCH body is rejected by
    // `SessionUpdateSchema`, so the edit is closed instead of firing a
    // request the server must refuse.
    if (Object.keys(patch).length === 0) {
      onCancel()
      return
    }
    const nextErrors = validateEdit(patch)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(nextErrors)
      return
    }
    onSubmit({ mode: 'edit', patch })
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
      aria-label={mode === 'create' ? 'Crear sesión' : 'Editar sesión'}
    >
      {mode === 'create' && nextNumber !== null ? (
        <p className="text-sm text-slate-400">
          Se creará como <span className="font-semibold text-amber-300">sesión {nextNumber}</span>.
        </p>
      ) : null}

      <div>
        <label htmlFor="session-title" className="block text-sm font-medium text-slate-200">
          Título <span aria-hidden="true" className="text-rose-300">*</span>
        </label>
        <input
          ref={titleInputRef}
          id="session-title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-invalid={errors.title !== undefined}
          aria-describedby={errors.title !== undefined ? 'session-title-error' : undefined}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 transition placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          placeholder="La cripta del rey olvidado"
        />
        {errors.title ? (
          <p id="session-title-error" className="mt-1 text-sm text-rose-300">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="session-played-at" className="block text-sm font-medium text-slate-200">
          Fecha de juego
        </label>
        <input
          ref={playedAtInputRef}
          id="session-played-at"
          name="playedAt"
          type="datetime-local"
          value={playedAt}
          onChange={(event) => setPlayedAt(event.target.value)}
          aria-invalid={errors.playedAt !== undefined}
          aria-describedby={errors.playedAt !== undefined ? 'session-played-at-error' : undefined}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:w-auto"
        />
        {errors.playedAt ? (
          <p id="session-played-at-error" className="mt-1 text-sm text-rose-300">
            {errors.playedAt}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="session-summary" className="block text-sm font-medium text-slate-200">
          Resumen
        </label>
        <textarea
          ref={summaryInputRef}
          id="session-summary"
          name="summary"
          rows={5}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          aria-invalid={errors.summary !== undefined}
          aria-describedby={errors.summary !== undefined ? 'session-summary-error' : undefined}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 transition placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          placeholder="Qué ocurrió, a quién conocieron y qué quedó pendiente."
        />
        {errors.summary ? (
          <p id="session-summary-error" className="mt-1 text-sm text-rose-300">
            {errors.summary}
          </p>
        ) : null}
      </div>

      {errors.form ? (
        <p id="session-form-error" role="alert" className="text-sm text-rose-300">
          {errors.form}
        </p>
      ) : null}

      {errorMessage ? <InlineError message={errorMessage} /> : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? 'Guardando…'
            : mode === 'create'
              ? 'Crear sesión'
              : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
