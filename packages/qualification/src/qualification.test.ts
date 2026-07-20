import { describe, expect, it } from 'vitest'
import { scoreLead } from './services/scoring-service'

describe('scoreLead', () => {
  it('qualifies leads with strong research and contact data', () => {
    const result = scoreLead({
      companyName: 'Acme Inc',
      domain: 'acme.com',
      icpKeywords: ['automation', 'outbound'],
      researchSummary: 'Acme Inc focuses on automation for outbound teams.',
      painPointCount: 3,
      hasContactEmail: true,
      minQualificationScore: 60,
    })

    expect(result.status).toBe('qualified')
    expect(result.score).toBeGreaterThanOrEqual(60)
  })

  it('rejects leads below the threshold', () => {
    const result = scoreLead({
      companyName: 'Unknown Co',
      icpKeywords: ['enterprise'],
      researchSummary: null,
      painPointCount: 0,
      hasContactEmail: false,
      minQualificationScore: 80,
    })

    expect(result.status).toBe('rejected')
    expect(result.score).toBeLessThan(80)
  })
})
