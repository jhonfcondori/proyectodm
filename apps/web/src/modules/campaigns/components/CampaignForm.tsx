import { useRef, useState, type FormEvent } from 'react'
import type { z } from 'zod'
import { CampaignCreateSchema, CampaignUpdateSchema } from '@proyectodm/shared'
import { InlineError } from '../../../components/ui'
import { diffCampaignInput, type CampaignFormValues, type CampaignPatch } from '../form-diff'

// Re-exported so consumers keep a single import site for the form types.
export type { CampaignFormValues } from '../form-diff'

// What the form hands back to its caller:
// - `create` carries the full body, since every field is being written;
// - `edit` carries only the fields that actually changed (`CampaignPatch`), so
//   the page can PATCH exactly those and never an empty body.
export type CampaignFormSubmission =
  | { mode: 'create'; values: CampaignFormValues }
  | { mode: 'edit'; patch: CampaignPatch }

interface CampaignFormProps {
  mode: 'create' | 'edit'
  initial?: CampaignFormValues | null
  isSubmitting?: boolean
  errorMessage?: string | null
  onSubmit: (submission: CampaignFormSubmission) => void
  onCancel: () => void
}

type FieldErrors = Partial<Record<'name' | 'description' | 'form', string>>

// The shared schemas ship English messages; the UI shows the first issue of
// each field translated to Spanish.
function issueToSpanish(issue: z.core.$ZodIssue): string {
  const field: PropertyKey | undefined = issue.path[0]
  if (issue.code === 'too_big') {
    if (field === 'name') return `El nombre debe tener como máximo ${String(issue.maximum)} caracteres.`
    if (field === 'description') {
      return `La descripción debe tener como máximo ${String(issue.maximum)} caracteres.`
    }
  }
  if (issue.code === 'too_small' && issue.origin === 'string') {
    if (field === 'name') return 'El nombre es obligatorio.'
    if (field === 'description') return 'La descripción es demasiado corta.'
  }
  if (issue.code === 'custom' && field === undefined) {
    return 'Debes indicar al menos un cambio.'
  }
  return 'Revisa este campo.'
}

function validate(mode: 'create' | 'edit', values: CampaignFormValues): FieldErrors {
  const payload = { name: values.name, description: values.description }
  const result =
    mode === 'create'
      ? CampaignCreateSchema.safeParse(payload)
      : CampaignUpdateSchema.safeParse(payload)

  if (result.success) return {}

  const errors: FieldErrors = {}
  for (const issue of result.error.issues) {
    const field: PropertyKey | undefined = issue.path[0]
    if (field === 'name' && errors.name === undefined) {
      errors.name = issueToSpanish(issue)
    } else if (field === 'description' && errors.description === undefined) {
      errors.description = issueToSpanish(issue)
    } else if (field === undefined && errors.form === undefined) {
      errors.form = issueToSpanish(issue)
    }
  }
  // The update schema's "at least one field" refine fires even when a field
  // already failed: the field message is the useful one, so drop the rest.
  if (errors.name !== undefined || errors.description !== undefined) {
    delete errors.form
  }
  return errors
}

export function CampaignForm({
  mode,
  initial,
  isSubmitting = false,
  errorMessage = null,
  onSubmit,
  onCancel,
}: CampaignFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)

  // Keyboard/screen-reader feedback on a failed submit: focus jumps to the
  // first invalid control, which already carries `aria-invalid` and is
  // described by its message. Form-level issues have no control to focus and
  // are announced by the `role="alert"` message instead.
  function focusFirstInvalid(nextErrors: FieldErrors) {
    if (nextErrors.name !== undefined) {
      nameInputRef.current?.focus()
    } else if (nextErrors.description !== undefined) {
      descriptionInputRef.current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values: CampaignFormValues = {
      name,
      description: description.trim() === '' ? null : description,
    }
    const nextErrors = validate(mode, values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(nextErrors)
      return
    }

    if (mode === 'create') {
      onSubmit({ mode: 'create', values })
      return
    }

    const patch = diffCampaignInput(
      { name: initial?.name ?? '', description: initial?.description ?? null },
      values,
    )
    // Nothing changed: an empty PATCH body is rejected by
    // `CampaignUpdateSchema`, so the edit is closed instead of firing a
    // request the server must refuse.
    if (Object.keys(patch).length === 0) {
      onCancel()
      return
    }
    onSubmit({ mode: 'edit', patch })
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4"
      aria-label={mode === 'create' ? 'Crear campaña' : 'Editar campaña'}
    >
      <div>
        <label htmlFor="campaign-name" className="block text-sm font-medium text-slate-200">
          Nombre <span aria-hidden="true" className="text-rose-300">*</span>
        </label>
        <input
          ref={nameInputRef}
          id="campaign-name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name !== undefined}
          aria-describedby={errors.name !== undefined ? 'campaign-name-error' : undefined}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 transition placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          placeholder="Aventura en el Reino Olvidado"
        />
        {errors.name ? (
          <p id="campaign-name-error" className="mt-1 text-sm text-rose-300">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="campaign-description" className="block text-sm font-medium text-slate-200">
          Descripción
        </label>
        <textarea
          ref={descriptionInputRef}
          id="campaign-description"
          name="description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={errors.description !== undefined}
          aria-describedby={errors.description !== undefined ? 'campaign-description-error' : undefined}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 transition placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          placeholder="Resumen de la campaña, tono y objetivo del grupo."
        />
        {errors.description ? (
          <p id="campaign-description-error" className="mt-1 text-sm text-rose-300">
            {errors.description}
          </p>
        ) : null}
      </div>

      {errors.form ? (
        <p id="campaign-form-error" role="alert" className="text-sm text-rose-300">
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
              ? 'Crear campaña'
              : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
