import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLogger } from './logger'

interface LogPayload {
  level: string
  message: string
  context: Record<string, unknown>
}

function parseLogPayload(value: unknown): LogPayload {
  return JSON.parse(String(value)) as LogPayload
}

describe('createLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes structured JSON logs', () => {
    const logger = createLogger({ service: 'test' })
    logger.info('hello', { event: 'test.event' })

    expect(console.log).toHaveBeenCalled()
    const parsed = parseLogPayload(vi.mocked(console.log).mock.calls[0]?.[0])
    expect(parsed.level).toBe('info')
    expect(parsed.message).toBe('hello')
    expect(parsed.context.event).toBe('test.event')
  })

  it('creates child loggers with merged context', () => {
    const logger = createLogger({ service: 'worker', context: { jobId: 'job-1' } })
    const child = logger.child({ organizationId: 'org-1' })
    child.warn('retry')

    expect(console.error).toHaveBeenCalled()
    const parsed = parseLogPayload(vi.mocked(console.error).mock.calls[0]?.[0])
    expect(parsed.level).toBe('warn')
    expect(parsed.context.jobId).toBe('job-1')
    expect(parsed.context.organizationId).toBe('org-1')
  })
})
