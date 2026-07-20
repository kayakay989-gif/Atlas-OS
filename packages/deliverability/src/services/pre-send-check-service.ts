import type { PreSendCheckFailure } from '@atlas/types'
import {
  MIN_DOMAIN_HEALTH_SCORE,
  MIN_MAILBOX_HEALTH_SCORE,
  getWarmUpDailyLimit,
} from '../constants/warm-up'

const SPAM_TRIGGERS = ['free money', 'guaranteed winner', 'act now', 'click here']

export interface PreSendCheckContext {
  recipientEmail: string
  fromEmail: string
  body: string
  unsubscribeUrl?: string
  suppressedEmails: ReadonlySet<string>
  mailboxEmail: string
  mailboxSendsToday: number
  mailboxDailyLimit: number
  mailboxHealthScore: number
  warmUpStartedAt: Date
  domainVerified: boolean
  domainHealthScore: number
  recipientDomainBounceRate?: number
}

export function runPreSendChecks(context: PreSendCheckContext): PreSendCheckFailure[] {
  const failures: PreSendCheckFailure[] = []
  const recipient = context.recipientEmail.toLowerCase()

  if (context.suppressedEmails.has(recipient)) {
    failures.push({ rule: 'suppression_list', message: 'Recipient is on the suppression list' })
  }

  const warmUpLimit = getWarmUpDailyLimit(context.warmUpStartedAt, context.mailboxDailyLimit)
  if (context.mailboxSendsToday >= warmUpLimit) {
    failures.push({
      rule: 'daily_limit',
      message: `Mailbox reached daily limit (${warmUpLimit})`,
    })
  }

  if (!context.domainVerified || context.domainHealthScore < MIN_DOMAIN_HEALTH_SCORE) {
    failures.push({
      rule: 'domain_health',
      message: 'Domain DNS health is below the minimum threshold',
    })
  }

  if (context.mailboxHealthScore < MIN_MAILBOX_HEALTH_SCORE) {
    failures.push({
      rule: 'mailbox_health',
      message: 'Mailbox health score is below the minimum threshold',
    })
  }

  if (context.fromEmail.toLowerCase() !== context.mailboxEmail.toLowerCase()) {
    failures.push({
      rule: 'from_address',
      message: 'From address must match the registered mailbox',
    })
  }

  const bodyLower = context.body.toLowerCase()
  if (!context.unsubscribeUrl && !bodyLower.includes('unsubscribe')) {
    failures.push({
      rule: 'unsubscribe_link',
      message: 'Email must include an unsubscribe link',
    })
  }

  for (const trigger of SPAM_TRIGGERS) {
    if (bodyLower.includes(trigger)) {
      failures.push({
        rule: 'content_check',
        message: `Email contains spam trigger phrase: ${trigger}`,
      })
    }
  }

  if ((context.recipientDomainBounceRate ?? 0) > 0.1) {
    failures.push({
      rule: 'bounce_history',
      message: 'Recipient domain exceeds bounce rate threshold',
    })
  }

  return failures
}

export function canSendEmail(context: PreSendCheckContext): boolean {
  return runPreSendChecks(context).length === 0
}
