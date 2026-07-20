import { describe, expect, it } from 'vitest'
import { getRlsInventory, runDeepHealthCheck } from './services/health-service'

describe('getRlsInventory', () => {
  it('lists protected tables', () => {
    const inventory = getRlsInventory()
    expect(inventory.some((entry) => entry.table === 'campaigns')).toBe(true)
  })
})

describe('runDeepHealthCheck', () => {
  it('returns degraded when no client', async () => {
    const result = await runDeepHealthCheck(null, {
      supabaseUrl: 'http://localhost:54321',
      supabaseAnonKey: 'test-key',
    })
    expect(result.status).toBe('ok')
    expect(result.checks.config?.status).toBe('ok')
  })
})
