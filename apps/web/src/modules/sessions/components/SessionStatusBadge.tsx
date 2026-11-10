import type { SessionStatus } from '@proyectodm/shared'
import { Badge } from '../../../components/ui'

const statusLabels: Record<SessionStatus, string> = {
  DRAFT: 'BORRADOR',
  PLAYED: 'JUGADA',
  CLOSED: 'CERRADA',
}

const statusTones: Record<SessionStatus, 'sky' | 'amber' | 'slate'> = {
  DRAFT: 'sky',
  PLAYED: 'amber',
  CLOSED: 'slate',
}

interface SessionStatusBadgeProps {
  status: SessionStatus
}

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  return <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>
}
