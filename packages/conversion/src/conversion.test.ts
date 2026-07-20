import { describe, expect, it } from 'vitest'
import {
  generateInvoiceNumber,
  generateProposalContent,
} from './services/proposal-generation-service'

describe('generateProposalContent', () => {
  it('includes company and amount', () => {
    const result = generateProposalContent({
      companyName: 'Acme Corp',
      contactName: 'Jane',
      researchSummary: 'Acme is scaling outbound.',
      amountCents: 500000,
      currency: 'USD',
    })

    expect(result.title).toContain('Acme Corp')
    expect(result.content).toContain('Jane')
    expect(result.content).toContain('$5,000.00')
  })
})

describe('generateInvoiceNumber', () => {
  it('formats sequential invoice numbers', () => {
    expect(generateInvoiceNumber(7)).toMatch(/^INV-\d{4}-0007$/)
  })
})
