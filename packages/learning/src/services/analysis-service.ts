import type { AbTestResult } from '@atlas/types'

/** Two-proportion z-test p-value (two-tailed, normal approximation). */
export function computeAbSignificance(
  variantA: { sends: number; replies: number },
  variantB: { sends: number; replies: number },
): { pValue: number; significant: boolean; winner: 'A' | 'B' | null } {
  if (variantA.sends < 5 || variantB.sends < 5) {
    return { pValue: 1, significant: false, winner: null }
  }

  const p1 = variantA.replies / variantA.sends
  const p2 = variantB.replies / variantB.sends
  const pooled = (variantA.replies + variantB.replies) / (variantA.sends + variantB.sends)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / variantA.sends + 1 / variantB.sends))

  if (se === 0) {
    return { pValue: 1, significant: false, winner: null }
  }

  const z = Math.abs(p1 - p2) / se
  const pValue = Math.exp(-0.717 * z - 0.416 * z * z)
  const significant = pValue < 0.05

  let winner: 'A' | 'B' | null = null
  if (significant) {
    winner = p1 > p2 ? 'A' : 'B'
  }

  return { pValue: Math.min(1, Math.max(0, pValue)), significant, winner }
}

export function buildAbTestResults(
  variants: { id: string; label: string; sends: number; replies: number }[],
): AbTestResult[] {
  if (variants.length < 2) {
    return variants.map((variant) => ({
      variantId: variant.id,
      label: variant.label,
      sends: variant.sends,
      replies: variant.replies,
      replyRate: variant.sends > 0 ? variant.replies / variant.sends : 0,
    }))
  }

  const [first, second] = variants
  if (!first || !second) {
    return variants.map((variant) => ({
      variantId: variant.id,
      label: variant.label,
      sends: variant.sends,
      replies: variant.replies,
      replyRate: variant.sends > 0 ? variant.replies / variant.sends : 0,
    }))
  }

  const stats = computeAbSignificance(
    { sends: first.sends, replies: first.replies },
    { sends: second.sends, replies: second.replies },
  )

  return variants.map((variant) => {
    const replyRate = variant.sends > 0 ? variant.replies / variant.sends : 0
    const isWinner =
      stats.significant &&
      ((stats.winner === 'A' && variant.label === first.label) ||
        (stats.winner === 'B' && variant.label === second.label))

    return {
      variantId: variant.id,
      label: variant.label,
      sends: variant.sends,
      replies: variant.replies,
      replyRate,
      isWinner: isWinner || undefined,
      pValue: variant.label === first.label ? stats.pValue : undefined,
      significant: variant.label === first.label ? stats.significant : undefined,
    }
  })
}

export function extractCopyPatterns(sends: { subject: string; body: string; replied: boolean }[]): {
  highPerforming: string[]
  lowPerforming: string[]
} {
  const high = new Map<string, number>()
  const low = new Map<string, number>()

  for (const send of sends) {
    const phrases = extractPhrases(send.subject)
    const bucket = send.replied ? high : low
    for (const phrase of phrases) {
      bucket.set(phrase, (bucket.get(phrase) ?? 0) + 1)
    }
  }

  return {
    highPerforming: topPhrases(high, 3),
    lowPerforming: topPhrases(low, 3),
  }
}

function extractPhrases(subject: string): string[] {
  const normalized = subject.trim().toLowerCase()
  if (!normalized) return []

  const words = normalized.split(/\s+/).filter((word) => word.length > 3)
  const phrases: string[] = []

  for (let index = 0; index < words.length - 1; index++) {
    phrases.push(`${words[index]} ${words[index + 1]}`)
  }

  if (words[0]) {
    phrases.push(words[0])
  }

  return phrases
}

function topPhrases(counts: Map<string, number>, limit: number): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([phrase]) => phrase)
}

export function findOptimalSendHour(
  sends: { hour: number; replied: boolean }[],
): { hour: number; replyRate: number } | null {
  const buckets = new Map<number, { sends: number; replies: number }>()

  for (const send of sends) {
    const bucket = buckets.get(send.hour) ?? { sends: 0, replies: 0 }
    bucket.sends += 1
    if (send.replied) {
      bucket.replies += 1
    }
    buckets.set(send.hour, bucket)
  }

  let best: { hour: number; replyRate: number } | null = null

  for (const [hour, stats] of buckets) {
    if (stats.sends < 3) continue
    const replyRate = stats.replies / stats.sends
    if (!best || replyRate > best.replyRate) {
      best = { hour, replyRate }
    }
  }

  return best
}

export function buildStyleHintsFromEdits(
  edits: { editedSubject?: string | null; editedBody: string }[],
  limit = 3,
): string[] {
  return edits.slice(0, limit).map((edit) => {
    const subject = edit.editedSubject?.trim()
    const preview = edit.editedBody.trim().slice(0, 120)
    return subject ? `Subject: ${subject} — ${preview}` : preview
  })
}
