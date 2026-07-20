import { generatedEmailSchema, type GeneratedEmail } from '@atlas/types'

export interface EmailGenerationInput {
  companyName: string
  contactName?: string | null
  painPoint?: string | null
  researchSummary?: string | null
  stepOrder: number
  subjectTemplate: string
  bodyTemplate: string
}

const PROMPT_VERSION = 'v1'

/** Generates a personalized email from templates and research context. */
export function generateEmailFromTemplate(input: EmailGenerationInput): GeneratedEmail {
  const contactName = input.contactName ?? 'there'
  const painPoint = input.painPoint ?? 'operational efficiency'
  const insight = input.researchSummary?.slice(0, 160) ?? `what ${input.companyName} is building`

  const tokens: Record<string, string> = {
    company_name: input.companyName,
    contact_name: contactName,
    pain_point: painPoint,
    research_insight: insight,
  }

  const subject = applyTokens(input.subjectTemplate, tokens)
  let body = applyTokens(input.bodyTemplate, tokens)

  if (input.stepOrder === 1) {
    body += `\n\nI noticed ${insight}. Worth a quick conversation?`
  } else if (input.stepOrder === 2) {
    body += `\n\nHappy to share a concise idea tailored to ${input.companyName}.`
  } else {
    body += `\n\nIf timing is off, no worries — I'll close the loop here.`
  }

  return generatedEmailSchema.parse({ subject, body })
}

function applyTokens(template: string, tokens: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => tokens[key] ?? '')
}

export { PROMPT_VERSION }
