import { describe, expect, it } from 'vitest'
import { generateEmailFromTemplate } from './services/email-generation-service'
import { hasBlockingQualityIssues, runQualityCheck } from './services/quality-check-service'

describe('generateEmailFromTemplate', () => {
  it('personalizes tokens in subject and body', () => {
    const email = generateEmailFromTemplate({
      companyName: 'Acme Inc',
      contactName: 'Jane',
      painPoint: 'pipeline visibility',
      researchSummary: 'Acme Inc builds sales tooling.',
      stepOrder: 1,
      subjectTemplate: 'Idea for {{company_name}}',
      bodyTemplate: 'Hi {{contact_name}}, noticed {{pain_point}} at {{company_name}}.',
    })

    expect(email.subject).toContain('Acme Inc')
    expect(email.body).toContain('Jane')
    expect(email.body).toContain('pipeline visibility')
  })
})

describe('runQualityCheck', () => {
  it('flags missing contact email as warning', () => {
    const issues = runQualityCheck({
      subject: 'Hello Acme Inc',
      body: 'This is a long enough email body that references Acme Inc and explains the value clearly for the recipient.',
      companyName: 'Acme Inc',
      contactEmail: null,
    })

    expect(issues.some((issue) => issue.code === 'missing_contact')).toBe(true)
    expect(hasBlockingQualityIssues(issues)).toBe(false)
  })

  it('flags short bodies as blocking errors', () => {
    const issues = runQualityCheck({
      subject: 'Hi',
      body: 'Too short',
      companyName: 'Acme Inc',
      contactEmail: 'jane@acme.com',
    })

    expect(hasBlockingQualityIssues(issues)).toBe(true)
  })
})
