interface SkeletonProps {
  className?: string
}

// Decorative loading placeholder. Announced by a sibling `role="status"`
// message so screen readers get feedback without hearing every bar.
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-slate-800 motion-reduce:animate-none ${className}`}
    />
  )
}
