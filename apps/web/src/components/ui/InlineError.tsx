interface InlineErrorProps {
  message: string
  onRetry?: () => void
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  )
}
