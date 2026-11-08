import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  confirmDisabled?: boolean
  /** Control that receives focus when the dialog opens (defaults to Cancelar). */
  initialFocusRef?: RefObject<HTMLElement | null>
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}

// Lightweight confirmation modal (no extra UI dependency): Escape and the
// cancel button close it, focus moves into the dialog on open (the caller can
// steer it with `initialFocusRef`) and returns to whatever triggered it on
// close.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  confirmDisabled = false,
  initialFocusRef,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const initialFocus = initialFocusRef?.current ?? cancelButtonRef.current
    initialFocus?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [open, onClose, initialFocusRef])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar diálogo"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/80"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        {description ? <div className="mt-2 text-sm text-slate-400">{description}</div> : null}
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={
              destructive
                ? 'rounded-lg border border-rose-500/40 bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 disabled:cursor-not-allowed disabled:opacity-50'
                : 'rounded-lg border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-50'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
