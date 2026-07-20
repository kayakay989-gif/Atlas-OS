import { serializeError, type SerializedAppError } from '@atlas/shared'

export interface ApiErrorResponse {
  error: SerializedAppError
}

/** Format errors for Next.js route handlers and server actions. */
export function formatApiError(error: unknown): ApiErrorResponse {
  return { error: serializeError(error) }
}
