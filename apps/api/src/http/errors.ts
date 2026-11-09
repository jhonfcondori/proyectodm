import type { Response } from 'express'
import type { ApiErrorCode } from '@proyectodm/shared'

// Error carrying an HTTP status and a stable machine-readable code.
// The global error handler in app.ts translates it to the
// { error: { code, message, details? } } envelope.
export class HttpError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details?: unknown

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function validationError(message: string, details?: unknown): HttpError {
  return new HttpError(400, 'VALIDATION_ERROR', message, details)
}

export function notFound(message: string): HttpError {
  return new HttpError(404, 'NOT_FOUND', message)
}

export function conflict(message: string): HttpError {
  return new HttpError(409, 'CONFLICT', message)
}

export function internalError(message = 'Unexpected server error'): HttpError {
  return new HttpError(500, 'INTERNAL_ERROR', message)
}

// Maps Prisma known request errors to HttpErrors so a race (e.g. duplicate
// name slipping past existsByName, or a row deleted between check and write)
// surfaces as 409/404 instead of a generic 500. Detection is structural
// (`error.code`) rather than `instanceof PrismaClientKnownRequestError`:
// Prisma 7's runtime entry may not export that class in a way that works
// across ESM/CJS test setups, and importing the client here would couple
// the HTTP layer to the generated client. Non-Prisma errors pass through
// unchanged, except a generic 500 HttpError, which is also returned as-is.
export function fromPrismaError(error: unknown): unknown {
  if (error instanceof HttpError) {
    return error
  }
  if (error !== null && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (code === 'P2002') {
      return conflict('A campaign with this name already exists')
    }
    if (code === 'P2025') {
      return notFound('Campaign not found')
    }
  }
  return error
}

// Sends the error envelope for the given error. HttpError instances keep
// their status/code/message/details; anything else becomes a generic 500
// so internal details never leak to clients.
export function sendError(response: Response, error: unknown): void {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    })
    return
  }

  response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
  })
}
