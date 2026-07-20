/** Warm-up ramp per ADR-0006: 5→10→20→35→50 emails/day */
export const WARM_UP_RAMP = [
  { throughDay: 3, dailyLimit: 5 },
  { throughDay: 7, dailyLimit: 10 },
  { throughDay: 14, dailyLimit: 20 },
  { throughDay: 21, dailyLimit: 35 },
] as const

export const DEFAULT_FULL_DAILY_LIMIT = 50

export const MIN_DOMAIN_HEALTH_SCORE = 50
export const MIN_MAILBOX_HEALTH_SCORE = 50
export const CAMPAIGN_PAUSE_MAILBOX_HEALTH = 30

export function getWarmUpDay(warmUpStartedAt: Date, now = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.max(1, Math.floor((now.getTime() - warmUpStartedAt.getTime()) / msPerDay) + 1)
}

export function getWarmUpDailyLimit(
  warmUpStartedAt: Date,
  fullLimit = DEFAULT_FULL_DAILY_LIMIT,
  now = new Date(),
): number {
  const day = getWarmUpDay(warmUpStartedAt, now)

  for (const stage of WARM_UP_RAMP) {
    if (day <= stage.throughDay) {
      return stage.dailyLimit
    }
  }

  return fullLimit
}

export function isWarmUpComplete(warmUpStartedAt: Date, now = new Date()): boolean {
  const lastStage = WARM_UP_RAMP.at(-1)
  if (!lastStage) return true
  return getWarmUpDay(warmUpStartedAt, now) > lastStage.throughDay
}
