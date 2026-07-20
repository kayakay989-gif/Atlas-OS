import { afterEach, describe, expect, it } from 'vitest'
import {
  REQUIRED_SERVER_ENV_KEYS,
  getServerEnv,
  resetServerEnvCache,
} from './env'

const ORIGINAL_ENV = { ...process.env }

describe('getServerEnv', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    resetServerEnvCache()
  })

  it('parses valid environment values', () => {
    process.env.NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

    const env = getServerEnv()
    expect(env.NODE_ENV).toBe('test')
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
  })

  it('throws on invalid URL values', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'not-a-url'

    expect(() => getServerEnv()).toThrow(/Invalid environment configuration/)
  })

  it('throws in strict mode when required keys are missing', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => getServerEnv({ strict: true })).toThrow(/Missing required environment variables/)
    expect(REQUIRED_SERVER_ENV_KEYS).toContain('NEXT_PUBLIC_APP_URL')
  })

  it('passes strict mode when required keys are present', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const env = getServerEnv({ strict: true })
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
  })
})
