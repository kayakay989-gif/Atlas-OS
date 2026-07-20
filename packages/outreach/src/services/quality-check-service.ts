import type { QualityIssue } from '@atlas/types'

const SPAM_TRIGGERS = ['free money', 'guaranteed', 'act now', 'click here', 'winner']

export interface QualityCheckInput {
  subject: string
  body: string
  contactEmail?: string | null
  companyName: string
}

export function runQualityCheck(input: QualityCheckInput): QualityIssue[] {
  const issues: QualityIssue[] = []

  if (!input.subject.trim()) {
    issues.push({
      code: 'missing_subject',
      message: 'Subject line is required',
      severity: 'error',
    })
  }

  if (input.body.trim().length < 80) {
    issues.push({
      code: 'body_too_short',
      message: 'Email body should be at least 80 characters',
      severity: 'error',
    })
  }

  if (!input.contactEmail) {
    issues.push({
      code: 'missing_contact',
      message: 'No contact email available for this company',
      severity: 'warning',
    })
  }

  if (!input.body.toLowerCase().includes(input.companyName.toLowerCase())) {
    issues.push({
      code: 'missing_personalization',
      message: 'Email body should reference the company name',
      severity: 'warning',
    })
  }

  const combined = `${input.subject} ${input.body}`.toLowerCase()
  for (const trigger of SPAM_TRIGGERS) {
    if (combined.includes(trigger)) {
      issues.push({
        code: 'spam_trigger',
        message: `Avoid spam trigger phrase: "${trigger}"`,
        severity: 'warning',
      })
    }
  }

  return issues
}

export function hasBlockingQualityIssues(issues: QualityIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error')
}
