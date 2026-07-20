import type { LeadScoreFactor, LeadScoreResult } from '@atlas/types'

export interface ScoringInput {
  companyName: string
  domain?: string | null
  icpKeywords: string[]
  researchSummary?: string | null
  painPointCount: number
  hasContactEmail: boolean
  minQualificationScore: number
}

const PROMPT_VERSION = 'v1'

/** Deterministic lead scoring (mock when no AI API key is configured). */
export function scoreLead(input: ScoringInput): LeadScoreResult {
  const factors: LeadScoreFactor[] = []

  const researchScore = input.researchSummary ? 85 : 20
  factors.push({ name: 'Research completeness', score: researchScore, weight: 0.35 })

  const contactScore = input.hasContactEmail ? 90 : 35
  factors.push({ name: 'Contact availability', score: contactScore, weight: 0.25 })

  const painScore = Math.min(100, input.painPointCount * 25)
  factors.push({ name: 'Pain point signals', score: painScore, weight: 0.2 })

  const keywordScore = scoreKeywordFit(input.companyName, input.researchSummary, input.icpKeywords)
  factors.push({ name: 'ICP keyword fit', score: keywordScore, weight: 0.2 })

  const score = Math.round(
    factors.reduce((total, factor) => total + factor.score * factor.weight, 0),
  )

  const status = score >= input.minQualificationScore ? 'qualified' : 'rejected'
  const reasoning =
    status === 'qualified'
      ? `${input.companyName} meets the qualification threshold (${score}/${input.minQualificationScore}) with usable research and outreach context.`
      : `${input.companyName} scored below the threshold (${score}/${input.minQualificationScore}). Improve research or contact data before outreach.`

  return {
    score,
    status,
    reasoning,
    factors,
  }
}

function scoreKeywordFit(
  companyName: string,
  researchSummary: string | null | undefined,
  keywords: string[],
): number {
  if (keywords.length === 0) {
    return 70
  }

  const haystack = `${companyName} ${researchSummary ?? ''}`.toLowerCase()
  const matches = keywords.filter((keyword) => haystack.includes(keyword.toLowerCase())).length
  return Math.min(100, Math.round((matches / keywords.length) * 100))
}

export { PROMPT_VERSION }
