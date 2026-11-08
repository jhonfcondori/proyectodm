import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { z } from 'zod'
import { internalError, validationError } from './errors'

// ----------------------------------------------------------------------------
// Express 5 note: `req.query` (and `req.params`) are getters backed by the
// router, not plain writable properties. Assigning `request.query = ...`
// throws "Cannot set property query" in strict mode. Therefore `validate`
// stores the parsed data on `response.locals.validated` instead of mutating
// the request. Handlers read it via `getValidated(response)`.
// ----------------------------------------------------------------------------

export interface ValidatedData {
  body?: unknown
  query?: unknown
  params?: unknown
}

export interface ValidateSchemas {
  body?: z.ZodType
  query?: z.ZodType
  params?: z.ZodType
}

export function getValidated<TBody = unknown, TQuery = unknown, TParams = unknown>(
  response: Response,
): { body: TBody; query: TQuery; params: TParams } {
  const validated = (response.locals as { validated?: ValidatedData }).validated
  if (validated === undefined) {
    // Programming error: handler ran without the `validate` middleware.
    // Fail loudly with a technical 500 instead of returning `undefined`
    // cast to T, which would hide the bug until a confusing downstream crash.
    throw internalError(
      'getValidated called but res.locals.validated is undefined; missing validate middleware',
    )
  }
  return validated as { body: TBody; query: TQuery; params: TParams }
}

// Validates the requested request parts with Zod and stores the parsed
// (coerced/trimmed/defaulted) values on `res.locals.validated`. A failed
// parse forwards an HttpError 400 VALIDATION_ERROR to the global handler.
export function validate(schemas: ValidateSchemas): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
    const validated: ValidatedData = {}

    const parts: Array<{ key: keyof ValidatedData; schema: z.ZodType | undefined; value: unknown }> = [
      { key: 'body', schema: schemas.body, value: request.body },
      { key: 'query', schema: schemas.query, value: request.query },
      { key: 'params', schema: schemas.params, value: request.params },
    ]

    for (const part of parts) {
      if (part.schema === undefined) {
        continue
      }
      const parsed = part.schema.safeParse(part.value)
      if (!parsed.success) {
        next(
          validationError('Request validation failed', {
            source: part.key,
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          }),
        )
        return
      }
      validated[part.key] = parsed.data
    }

    response.locals.validated = validated
    next()
  }
}

// Wraps an async handler so rejected promises reach the global error handler.
export function asyncHandler(
  fn: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (request, response, next) => {
    Promise.resolve()
      .then(() => fn(request, response, next))
      .catch(next)
  }
}
