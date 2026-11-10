// Module-local re-export of the shared session contracts so routes, service
// and tests import schemas through this module's boundary.
export {
  NextSessionNumberSchema,
  SessionCreateSchema,
  SessionListQuerySchema,
  SessionSchema,
  SessionStatusSchema,
  SessionTransitionSchema,
  SessionUpdateSchema,
  IdParamSchema,
} from '@proyectodm/shared'
export type {
  NextSessionNumber,
  Session,
  SessionCreate,
  SessionListQuery,
  SessionStatus,
  SessionTransition,
  SessionUpdate,
} from '@proyectodm/shared'
