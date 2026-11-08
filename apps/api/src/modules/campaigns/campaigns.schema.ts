// Module-local re-export of the shared campaign contracts so routes, service
// and tests import schemas through this module's boundary.
export {
  CampaignCreateSchema,
  CampaignDetailSchema,
  CampaignListQuerySchema,
  CampaignSchema,
  CampaignStatusSchema,
  CampaignUpdateSchema,
  IdParamSchema,
} from '@proyectodm/shared'
export type {
  Campaign,
  CampaignCreate,
  CampaignDetail,
  CampaignListQuery,
  CampaignStatus,
  CampaignUpdate,
} from '@proyectodm/shared'
