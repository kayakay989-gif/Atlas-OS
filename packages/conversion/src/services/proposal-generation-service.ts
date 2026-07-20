export const PROMPT_VERSION = 'v1'

export interface ProposalGenerationInput {
  companyName: string
  contactName?: string | null
  researchSummary?: string | null
  meetingBrief?: string | null
  painPoints?: string[]
  amountCents: number
  currency: string
}

export function generateProposalContent(input: ProposalGenerationInput): {
  title: string
  content: string
} {
  const company = input.companyName
  const contact = input.contactName ?? 'there'
  const summary = input.researchSummary ?? 'Based on our discovery conversation.'
  const brief = input.meetingBrief ?? ''
  const pains = input.painPoints?.length ? input.painPoints.join(', ') : 'operational efficiency'
  const amount = (input.amountCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: input.currency,
  })

  const title = `Proposal for ${company}`

  const content = `# ${title}

Prepared for ${contact} at ${company}

## Executive summary
${summary}

## Objectives
- Address ${pains}
- Deliver measurable outcomes within 90 days
- Provide a clear implementation path with Atlas Solutions

## Scope of work
1. Discovery and alignment workshop
2. Implementation of prioritized automation workflows
3. Training and handoff for your team

## Investment
**Total:** ${amount}

## Timeline
- Week 1–2: Kickoff and requirements
- Week 3–6: Implementation
- Week 7–8: Review and optimization

## Next steps
Upon approval, we will issue an invoice and begin onboarding.

${brief ? `\n## Meeting context\n${brief.slice(0, 800)}` : ''}
`

  return { title, content }
}

export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear()
  return `INV-${year}-${String(sequence).padStart(4, '0')}`
}
