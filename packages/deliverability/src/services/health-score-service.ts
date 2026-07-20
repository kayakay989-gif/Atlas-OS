import {
  CAMPAIGN_PAUSE_MAILBOX_HEALTH,
  DEFAULT_FULL_DAILY_LIMIT,
  MIN_DOMAIN_HEALTH_SCORE,
  MIN_MAILBOX_HEALTH_SCORE,
  getWarmUpDailyLimit,
  isWarmUpComplete,
} from '../constants/warm-up'

export interface MailboxHealthInput {
  bounceRate30d: number
  complaintRate30d: number
  sendsToday: number
  warmUpStartedAt: Date
  dailySendLimit?: number
  domainHealthScore: number
}

export function computeMailboxHealthScore(input: MailboxHealthInput): number {
  let score = 100

  score -= Math.round(input.bounceRate30d * 200)
  score -= Math.round(input.complaintRate30d * 400)

  if (input.domainHealthScore < MIN_DOMAIN_HEALTH_SCORE) {
    score -= 20
  }

  const fullLimit = input.dailySendLimit ?? DEFAULT_FULL_DAILY_LIMIT
  const allowedToday = getWarmUpDailyLimit(input.warmUpStartedAt, fullLimit)
  if (input.sendsToday > allowedToday) {
    score -= 15
  }

  if (!isWarmUpComplete(input.warmUpStartedAt)) {
    score -= 5
  }

  return Math.max(0, Math.min(100, score))
}

export function isMailboxEligibleForRotation(healthScore: number): boolean {
  return healthScore >= MIN_MAILBOX_HEALTH_SCORE
}

export function shouldPauseCampaignForMailboxHealth(healthScore: number): boolean {
  return healthScore < CAMPAIGN_PAUSE_MAILBOX_HEALTH
}
