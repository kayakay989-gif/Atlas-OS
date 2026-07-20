import { describe, expect, it } from 'vitest'
import { getWarmUpDailyLimit, getWarmUpDay, isWarmUpComplete } from './constants/warm-up'
import { computeDomainHealthScore, validateDomainDns } from './services/dns-validation-service'
import { computeMailboxHealthScore } from './services/health-score-service'
import { canSendEmail, runPreSendChecks } from './services/pre-send-check-service'

describe('warm-up schedule', () => {
  const started = new Date('2026-01-01T00:00:00Z')

  it('ramps limits over time', () => {
    expect(getWarmUpDailyLimit(started, 50, new Date('2026-01-01T00:00:00Z'))).toBe(5)
    expect(getWarmUpDailyLimit(started, 50, new Date('2026-01-05T00:00:00Z'))).toBe(10)
    expect(getWarmUpDailyLimit(started, 50, new Date('2026-01-10T00:00:00Z'))).toBe(20)
    expect(getWarmUpDailyLimit(started, 50, new Date('2026-01-18T00:00:00Z'))).toBe(35)
    expect(getWarmUpDailyLimit(started, 50, new Date('2026-01-25T00:00:00Z'))).toBe(50)
  })

  it('marks warm-up complete after day 21', () => {
    expect(isWarmUpComplete(started, new Date('2026-01-22T00:00:00Z'))).toBe(true)
    expect(getWarmUpDay(started, new Date('2026-01-03T00:00:00Z'))).toBe(3)
  })
})

describe('validateDomainDns', () => {
  it('detects SPF, DKIM, and DMARC records', async () => {
    const result = await validateDomainDns('mail.acme.com', 'default', {
      resolveTxt: (hostname) => {
        if (hostname === 'mail.acme.com')
          return Promise.resolve([['v=spf1 include:_spf.google.com ~all']])
        if (hostname === 'default._domainkey.mail.acme.com') {
          return Promise.resolve([['v=DKIM1; k=rsa; p=abc']])
        }
        if (hostname === '_dmarc.mail.acme.com') return Promise.resolve([['v=DMARC1; p=none']])
        return Promise.resolve([])
      },
    })

    expect(result.spfValid).toBe(true)
    expect(result.dkimValid).toBe(true)
    expect(result.dmarcValid).toBe(true)
    expect(computeDomainHealthScore(result)).toBe(100)
  })
})

describe('runPreSendChecks', () => {
  const baseContext = {
    recipientEmail: 'lead@example.com',
    fromEmail: 'sales@mail.acme.com',
    body: 'Hi there — relevant note for your team. Unsubscribe: https://example.com/u/1',
    unsubscribeUrl: 'https://example.com/u/1',
    suppressedEmails: new Set<string>(),
    mailboxEmail: 'sales@mail.acme.com',
    mailboxSendsToday: 0,
    mailboxDailyLimit: 50,
    mailboxHealthScore: 90,
    warmUpStartedAt: new Date('2025-01-01T00:00:00Z'),
    domainVerified: true,
    domainHealthScore: 100,
  }

  it('passes when all rules succeed', () => {
    expect(canSendEmail(baseContext)).toBe(true)
    expect(runPreSendChecks(baseContext)).toHaveLength(0)
  })

  it('blocks suppressed recipients', () => {
    const failures = runPreSendChecks({
      ...baseContext,
      suppressedEmails: new Set(['lead@example.com']),
    })
    expect(failures.some((failure) => failure.rule === 'suppression_list')).toBe(true)
  })

  it('blocks when daily limit reached', () => {
    const failures = runPreSendChecks({
      ...baseContext,
      mailboxSendsToday: 50,
    })
    expect(failures.some((failure) => failure.rule === 'daily_limit')).toBe(true)
  })

  it('blocks mismatched from address', () => {
    const failures = runPreSendChecks({
      ...baseContext,
      fromEmail: 'other@mail.acme.com',
    })
    expect(failures.some((failure) => failure.rule === 'from_address')).toBe(true)
  })

  it('blocks missing unsubscribe link', () => {
    const failures = runPreSendChecks({
      ...baseContext,
      body: 'Hello without opt-out language',
      unsubscribeUrl: undefined,
    })
    expect(failures.some((failure) => failure.rule === 'unsubscribe_link')).toBe(true)
  })

  it('blocks spam trigger content', () => {
    const failures = runPreSendChecks({
      ...baseContext,
      body: 'You are a guaranteed winner! Unsubscribe: https://example.com/u/1',
    })
    expect(failures.some((failure) => failure.rule === 'content_check')).toBe(true)
  })

  it('blocks unhealthy domains', () => {
    const failures = runPreSendChecks({
      ...baseContext,
      domainHealthScore: 10,
    })
    expect(failures.some((failure) => failure.rule === 'domain_health')).toBe(true)
  })

  it('blocks high bounce-rate domains', () => {
    const failures = runPreSendChecks({
      ...baseContext,
      recipientDomainBounceRate: 0.2,
    })
    expect(failures.some((failure) => failure.rule === 'bounce_history')).toBe(true)
  })
})

describe('computeMailboxHealthScore', () => {
  it('reduces score for bounces and complaints', () => {
    const score = computeMailboxHealthScore({
      bounceRate30d: 0.05,
      complaintRate30d: 0.01,
      sendsToday: 0,
      warmUpStartedAt: new Date('2025-01-01T00:00:00Z'),
      domainHealthScore: 100,
    })

    expect(score).toBeLessThan(100)
    expect(score).toBeGreaterThan(50)
  })
})
