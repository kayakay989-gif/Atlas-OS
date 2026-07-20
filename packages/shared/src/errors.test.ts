import { describe, expect, it } from 'vitest'
import { AppError, NotFoundError, serializeError } from './errors'

describe('NotFoundError', () => {
  it('sets status code 404', () => {
    const error = new NotFoundError('Campaign', 'abc-123')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toContain('abc-123')
  })
})

describe('serializeError', () => {
  it('serializes AppError instances', () => {
    const error = new AppError('boom', 'TEST', 418)
    expect(serializeError(error)).toEqual({
      name: 'AppError',
      message: 'boom',
      code: 'TEST',
      statusCode: 418,
    })
  })

  it('serializes generic errors', () => {
    expect(serializeError(new Error('fail'))).toMatchObject({
      name: 'Error',
      message: 'fail',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    })
  })

  it('serializes unknown values', () => {
    expect(serializeError('oops')).toMatchObject({
      name: 'UnknownError',
      message: 'oops',
      code: 'INTERNAL_ERROR',
    })
  })
})
