export interface SerializedAppError {
  name: string
  message: string
  code: string
  statusCode: number
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }

  toJSON(): SerializedAppError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    }
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

/** Serialize any thrown value into a consistent shape for logs and API responses. */
export function serializeError(error: unknown): SerializedAppError {
  if (error instanceof AppError) {
    return error.toJSON()
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    }
  }

  return {
    name: 'UnknownError',
    message: String(error),
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  }
}
