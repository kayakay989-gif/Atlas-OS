import type { ReplyIntent } from '@atlas/types'

const UNSUBSCRIBE_PHRASES = ['unsubscribe', 'remove me', 'stop emailing', 'opt out']
const POSITIVE_PHRASES = ['interested', 'sounds good', "let's talk", 'schedule', 'book a call']
const NEGATIVE_PHRASES = ['not interested', 'no thanks', 'pass', 'wrong person']
const OOO_PHRASES = ['out of office', 'away from', 'on vacation', 'automatic reply']

export function classifyReply(body: string): ReplyIntent {
  const lower = body.toLowerCase()

  if (UNSUBSCRIBE_PHRASES.some((phrase) => lower.includes(phrase))) {
    return 'unsubscribe'
  }

  if (OOO_PHRASES.some((phrase) => lower.includes(phrase))) {
    return 'out_of_office'
  }

  if (POSITIVE_PHRASES.some((phrase) => lower.includes(phrase))) {
    return 'positive'
  }

  if (NEGATIVE_PHRASES.some((phrase) => lower.includes(phrase))) {
    return 'negative'
  }

  if (lower.trim().length > 0) {
    return 'neutral'
  }

  return 'unknown'
}

export function shouldPauseSequenceOnReply(intent: ReplyIntent): boolean {
  return intent !== 'out_of_office'
}
