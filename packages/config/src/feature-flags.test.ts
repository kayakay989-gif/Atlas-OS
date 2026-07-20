import { afterEach, describe, expect, it } from 'vitest'
import { FEATURE_FLAG_DEFAULTS, getFeatureFlags, isFeatureEnabled } from './feature-flags'

const ORIGINAL_ENV = { ...process.env }

describe('getFeatureFlags', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('returns safe defaults when env vars are unset', () => {
    delete process.env.FF_EMAIL_SENDING
    delete process.env.FF_AI_AGENTS

    const flags = getFeatureFlags()
    expect(flags.emailSending).toBe(false)
    expect(flags.aiAgents).toBe(false)
    expect(flags).toEqual(FEATURE_FLAG_DEFAULTS)
  })

  it('reads boolean overrides from environment variables', () => {
    process.env.FF_DISCOVERY_PIPELINE = 'true'
    process.env.FF_EMAIL_SENDING = '0'

    const flags = getFeatureFlags()
    expect(flags.discoveryPipeline).toBe(true)
    expect(flags.emailSending).toBe(false)
  })

  it('applies explicit overrides over environment', () => {
    process.env.FF_AI_AGENTS = 'false'

    const flags = getFeatureFlags({
      overrides: { aiAgents: true },
    })
    expect(flags.aiAgents).toBe(true)
  })
})

describe('isFeatureEnabled', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('returns flag value for a single check', () => {
    process.env.FF_CRM_MODULE = 'true'
    expect(isFeatureEnabled('crmModule')).toBe(true)
  })
})
