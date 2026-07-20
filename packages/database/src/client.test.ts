import { describe, expect, it } from 'vitest'
import { getSupabaseConfigFromEnv } from './client'

describe('getSupabaseConfigFromEnv', () => {
  it('returns config when required keys are present', () => {
    expect(
      getSupabaseConfigFromEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      }),
    ).toEqual({
      url: 'http://127.0.0.1:54321',
      anonKey: 'anon-key',
      serviceRoleKey: undefined,
    })
  })

  it('throws when required keys are missing', () => {
    expect(() => getSupabaseConfigFromEnv({})).toThrow(/Missing Supabase environment variables/)
  })
})
