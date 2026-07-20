import { describe, expect, it } from 'vitest'
import {
  buildAbTestResults,
  computeAbSignificance,
  extractCopyPatterns,
  findOptimalSendHour,
} from './services/analysis-service'

describe('computeAbSignificance', () => {
  it('marks significant difference when sample sizes are large enough', () => {
    const result = computeAbSignificance({ sends: 100, replies: 20 }, { sends: 100, replies: 8 })
    expect(result.significant).toBe(true)
    expect(result.winner).toBe('A')
  })
})

describe('buildAbTestResults', () => {
  it('returns reply rates per variant', () => {
    const results = buildAbTestResults([
      { id: 'a', label: 'A', sends: 10, replies: 3 },
      { id: 'b', label: 'B', sends: 10, replies: 1 },
    ])
    expect(results[0]?.replyRate).toBe(0.3)
    expect(results[1]?.replyRate).toBe(0.1)
  })
})

describe('extractCopyPatterns', () => {
  it('finds phrases in high-performing subjects', () => {
    const patterns = extractCopyPatterns([
      { subject: 'Quick question about growth', body: '', replied: true },
      { subject: 'Quick question for your team', body: '', replied: true },
      { subject: 'Checking in later', body: '', replied: false },
    ])
    expect(patterns.highPerforming.length).toBeGreaterThan(0)
  })
})

describe('findOptimalSendHour', () => {
  it('returns hour with best reply rate', () => {
    const result = findOptimalSendHour([
      { hour: 9, replied: true },
      { hour: 9, replied: true },
      { hour: 9, replied: false },
      { hour: 14, replied: false },
      { hour: 14, replied: false },
      { hour: 14, replied: false },
    ])
    expect(result?.hour).toBe(9)
  })
})
