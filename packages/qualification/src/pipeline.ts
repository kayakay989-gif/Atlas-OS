import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@atlas/database/types'
import type { LeadQualificationStatus } from '@atlas/types'
import { PROMPT_VERSION, scoreLead } from './services/scoring-service'

type Client = SupabaseClient<Database>

export interface OutreachSettings {
  requireManualApproval: boolean
  minQualificationScore: number
  defaultSequenceId: string | null
}

export async function getOrCreateOutreachSettings(
  client: Client,
  organizationId: string,
): Promise<OutreachSettings> {
  const { data: existing } = await client
    .from('organization_outreach_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (existing) {
    return {
      requireManualApproval: existing.require_manual_approval,
      minQualificationScore: existing.min_qualification_score,
      defaultSequenceId: existing.default_sequence_id,
    }
  }

  const { data: created, error } = await client
    .from('organization_outreach_settings')
    .insert({ organization_id: organizationId })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return {
    requireManualApproval: created.require_manual_approval,
    minQualificationScore: created.min_qualification_score,
    defaultSequenceId: created.default_sequence_id,
  }
}

export async function runLeadQualification(
  client: Client,
  input: { organizationId: string; companyId: string },
): Promise<{ status: LeadQualificationStatus; score: number }> {
  const { data: company, error: companyError } = await client
    .from('companies')
    .select('id, name, domain, icp_profile_id, status')
    .eq('id', input.companyId)
    .eq('organization_id', input.organizationId)
    .single()

  if (companyError) {
    throw companyError
  }

  if (company.status !== 'researched') {
    throw new Error('Company must be researched before qualification')
  }

  const settings = await getOrCreateOutreachSettings(client, input.organizationId)

  const { data: report } = await client
    .from('research_reports')
    .select('summary, pain_points')
    .eq('company_id', company.id)
    .maybeSingle()

  const { data: contacts } = await client
    .from('contacts')
    .select('email')
    .eq('company_id', company.id)

  let icpKeywords: string[] = []
  if (company.icp_profile_id) {
    const { data: icp } = await client
      .from('icp_profiles')
      .select('keywords')
      .eq('id', company.icp_profile_id)
      .maybeSingle()
    icpKeywords = icp?.keywords ?? []
  }

  const painPoints = Array.isArray(report?.pain_points) ? report.pain_points : []
  const hasContactEmail = (contacts ?? []).some((contact) => Boolean(contact.email))

  const result = scoreLead({
    companyName: company.name,
    domain: company.domain,
    icpKeywords,
    researchSummary: report?.summary,
    painPointCount: painPoints.length,
    hasContactEmail,
    minQualificationScore: settings.minQualificationScore,
  })

  const { error: upsertError } = await client.from('lead_scores').upsert(
    {
      organization_id: input.organizationId,
      company_id: company.id,
      score: result.score,
      status: result.status,
      reasoning: result.reasoning,
      factors: result.factors as Json,
      model: 'atlas-mock-v1',
      prompt_version: PROMPT_VERSION,
    },
    { onConflict: 'company_id' },
  )

  if (upsertError) {
    throw upsertError
  }

  return { status: result.status, score: result.score }
}
