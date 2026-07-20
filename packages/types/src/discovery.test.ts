import { describe, expect, it } from 'vitest'
import { csvDiscoveryRowSchema, icpProfileSchema, researchReportSchema } from './discovery'

describe('discovery schemas', () => {
  it('validates ICP profile input', () => {
    const result = icpProfileSchema.safeParse({
      name: 'B2B SaaS',
      industries: ['Software'],
      geographies: ['US'],
      keywords: ['automation'],
    })
    expect(result.success).toBe(true)
  })

  it('validates CSV discovery row', () => {
    const result = csvDiscoveryRowSchema.safeParse({
      name: 'Acme Corp',
      domain: 'acme.com',
    })
    expect(result.success).toBe(true)
  })

  it('validates research report structure', () => {
    const result = researchReportSchema.safeParse({
      summary: 'Acme is a B2B SaaS company.',
      branding: {
        tone: 'Professional',
        visualStyle: 'Modern minimal',
        keyMessages: ['Efficiency'],
      },
      uxAnalysis: {
        summary: 'Clean homepage',
        strengths: ['Clear CTA'],
        weaknesses: ['Slow load'],
      },
      positioning: {
        marketSegment: 'Mid-market SaaS',
        valueProposition: 'Automate workflows',
        competitors: ['Competitor A'],
      },
      painPoints: ['Manual processes'],
      suggestedContacts: [{ fullName: 'Jane Doe', email: 'jane@acme.com', title: 'CEO' }],
    })
    expect(result.success).toBe(true)
  })
})
