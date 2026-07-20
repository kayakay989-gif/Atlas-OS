import { researchReportSchema, type ResearchReport } from '@atlas/types'

export interface ResearchInput {
  companyName: string
  domain?: string
  crawlContent: string
}

const PROMPT_VERSION = 'v1'

/** Generates a structured research report (mock when no AI API key is configured). */
export function generateResearchReport(input: ResearchInput): ResearchReport {
  const snippet = input.crawlContent.slice(0, 500)
  const domain = input.domain ?? 'unknown'

  const report: ResearchReport = {
    summary: `${input.companyName} operates at ${domain}. Initial analysis based on public website content suggests a focus on digital presence and customer engagement.`,
    branding: {
      tone: snippet.toLowerCase().includes('enterprise')
        ? 'Enterprise-professional'
        : 'Modern and approachable',
      visualStyle: 'Contemporary web presence with standard marketing layout',
      keyMessages: extractKeywords(snippet).slice(0, 3),
    },
    uxAnalysis: {
      summary: 'Homepage presents core value proposition above the fold.',
      strengths: ['Clear navigation structure', 'Responsive layout indicators'],
      weaknesses: ['Limited social proof visible in crawl', 'CTA hierarchy could be stronger'],
    },
    positioning: {
      marketSegment: inferSegment(snippet),
      valueProposition: `Helps customers solve problems related to ${input.companyName}'s core offering`,
      competitors: ['Industry peer A', 'Industry peer B'],
    },
    painPoints: [
      'Potential friction in conversion path',
      'Messaging may not differentiate clearly from competitors',
      'Public contact information limited on website',
    ],
    suggestedContacts: [
      {
        fullName: `${input.companyName} Team`,
        email: `hello@${domain.replace(/^https?:\/\//, '').split('/')[0]}`,
        title: 'General inquiries',
      },
    ],
  }

  return researchReportSchema.parse(report)
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4)

  return [...new Set(words)].slice(0, 10)
}

function inferSegment(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('enterprise')) return 'Enterprise B2B'
  if (lower.includes('saas') || lower.includes('software')) return 'B2B SaaS'
  if (lower.includes('agency')) return 'Professional services'
  return 'General B2B'
}

export { PROMPT_VERSION }
