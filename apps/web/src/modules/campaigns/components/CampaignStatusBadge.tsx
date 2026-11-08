import type { CampaignStatus } from '@proyectodm/shared'
import { Badge } from '../../../components/ui'

const statusLabels: Record<CampaignStatus, string> = {
  ACTIVE: 'ACTIVA',
  ARCHIVED: 'ARCHIVADA',
}

const statusTones: Record<CampaignStatus, 'emerald' | 'slate'> = {
  ACTIVE: 'emerald',
  ARCHIVED: 'slate',
}

interface CampaignStatusBadgeProps {
  status: CampaignStatus
}

export function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  return <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>
}
