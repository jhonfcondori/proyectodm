import { useEffect, useRef, useState } from 'react'
import type { Campaign } from '@proyectodm/shared'
import { ConfirmDialog, InlineError } from '../../../components/ui'
import { isDeleteConfirmationValid } from '../delete-confirmation'

interface DeleteCampaignDialogProps {
  campaign: Campaign | null
  isDeleting?: boolean
  errorMessage?: string | null
  onCancel: () => void
  onConfirm: () => void
}

// Explicit destructive confirmation:
// - the "Eliminar" button unlocks only once the campaign name is typed
//   exactly, character by character (see `isDeleteConfirmationValid`);
// - it stays disabled while the DELETE request is in flight;
// - a failed request is announced by the inline `role="alert"` message;
// - Escape closes the dialog (handled by `ConfirmDialog`) and focus starts in
//   the confirmation input.
export function DeleteCampaignDialog({
  campaign,
  isDeleting = false,
  errorMessage = null,
  onCancel,
  onConfirm,
}: DeleteCampaignDialogProps) {
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (campaign) setTyped('')
  }, [campaign])

  const expected = campaign?.name ?? ''
  const matches = isDeleteConfirmationValid(typed, expected)
  // Flag only after the user started typing the wrong thing: an untouched
  // empty field is simply "not confirmed yet", which the label already says.
  const unmatched = typed.length > 0 && !matches

  return (
    <ConfirmDialog
      open={campaign !== null}
      title="Eliminar campaña"
      description={
        campaign ? (
          <>
            Vas a eliminar <span className="font-semibold text-white">{campaign.name}</span> de forma
            permanente. Esta acción no se puede deshacer.
          </>
        ) : null
      }
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      destructive
      confirmDisabled={!matches || isDeleting}
      initialFocusRef={inputRef}
      onConfirm={onConfirm}
      onClose={onCancel}
    >
      <div className="mt-4">
        <label
          htmlFor="delete-campaign-confirmation"
          className="block text-sm font-medium text-slate-200"
        >
          Escribe <span className="font-semibold text-white">{expected}</span> para confirmar
        </label>
        <input
          ref={inputRef}
          id="delete-campaign-confirmation"
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          aria-invalid={unmatched}
          aria-describedby="delete-campaign-confirmation-hint"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 transition placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
          placeholder={expected}
        />
        <p id="delete-campaign-confirmation-hint" className="mt-1 text-xs text-slate-500">
          La coincidencia debe ser exacta, incluidos los espacios.
        </p>
      </div>
      {errorMessage ? (
        <div className="mt-4">
          <InlineError message={errorMessage} />
        </div>
      ) : null}
      {isDeleting ? (
        <p className="mt-3 text-sm text-slate-400" role="status">
          Eliminando…
        </p>
      ) : null}
    </ConfirmDialog>
  )
}
