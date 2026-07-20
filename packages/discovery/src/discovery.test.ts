import { describe, expect, it } from 'vitest'
import { parseCsvDiscoveryContent } from './parse-csv'
import { generateResearchReport } from './services/research-service'
import { researchReportSchema } from '@atlas/types'

describe('parseCsvDiscoveryContent', () => {
  it('parses headered CSV rows', () => {
    const rows = parseCsvDiscoveryContent(`name,domain
Acme Inc,acme.com
Beta LLC,beta.io`)
    expect(rows).toHaveLength(2)
    expect(rows[0]?.name).toBe('Acme Inc')
    expect(rows[0]?.domain).toBe('acme.com')
  })
})

describe('generateResearchReport', () => {
  it('returns schema-valid research report', () => {
    const report = generateResearchReport({
      companyName: 'Acme',
      domain: 'acme.com',
      crawlContent: 'Acme provides enterprise SaaS automation for modern teams.',
    })
    expect(researchReportSchema.safeParse(report).success).toBe(true)
  })
})
