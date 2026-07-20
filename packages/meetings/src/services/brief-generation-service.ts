import type { Json } from '@atlas/database/types'

export const PROMPT_VERSION = 'v1'

export interface BriefGenerationInput {
  companyName?: string | null
  contactName?: string | null
  attendeeName: string
  researchSummary?: string | null
  painPoints?: string[]
  replySnippets?: string[]
  scheduledStart: string
}

export function generateMeetingBriefContent(input: BriefGenerationInput): {
  content: string
  sources: Json
} {
  const company = input.companyName ?? 'the prospect company'
  const contact = input.contactName ?? input.attendeeName
  const summary = input.researchSummary ?? 'No research summary available yet.'
  const pains = input.painPoints?.length
    ? input.painPoints.join('; ')
    : 'Growth and efficiency priorities'
  const replies = input.replySnippets?.length
    ? input.replySnippets.map((snippet, index) => `${index + 1}. ${snippet}`).join('\n')
    : 'No reply history captured yet.'

  const content = `# Pre-meeting brief

**Meeting with:** ${contact} (${input.attendeeName})
**Company:** ${company}
**Scheduled:** ${new Date(input.scheduledStart).toUTCString()}

## Company snapshot
${summary}

## Likely pain points
${pains}

## Conversation history
${replies}

## Suggested agenda
1. Confirm current priorities at ${company}
2. Share one relevant insight from research
3. Align on next step and timeline

## Questions to ask
- What prompted you to take this meeting now?
- Who else should be involved in evaluating a solution?
- What does success look like in the next 90 days?
`

  const sources = [
    { type: 'research', summary: summary.slice(0, 200) },
    { type: 'replies', count: input.replySnippets?.length ?? 0 },
  ] as unknown as Json

  return { content, sources }
}
