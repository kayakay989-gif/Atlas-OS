import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@atlas/database/types'
import type { EmailDraftStatus } from '@atlas/types'
import { getOrCreateOutreachSettings, runLeadQualification } from '@atlas/qualification'
import { generateEmailFromTemplate, PROMPT_VERSION } from './services/email-generation-service'
import { hasBlockingQualityIssues, runQualityCheck } from './services/quality-check-service'
import { ensureDefaultSequence } from './services/sequence-service'

type Client = SupabaseClient<Database>

export async function generateOutreachDrafts(
  client: Client,
  input: { organizationId: string; companyId: string },
): Promise<{ draftCount: number }> {
  const { data: leadScore } = await client
    .from('lead_scores')
    .select('status')
    .eq('company_id', input.companyId)
    .eq('organization_id', input.organizationId)
    .maybeSingle()

  if (leadScore?.status !== 'qualified') {
    return { draftCount: 0 }
  }

  const settings = await getOrCreateOutreachSettings(client, input.organizationId)
  const sequenceId = await ensureDefaultSequence(client, input.organizationId)

  const { data: company, error: companyError } = await client
    .from('companies')
    .select('id, name')
    .eq('id', input.companyId)
    .eq('organization_id', input.organizationId)
    .single()

  if (companyError) {
    throw companyError
  }

  const { data: report } = await client
    .from('research_reports')
    .select('summary, pain_points')
    .eq('company_id', company.id)
    .maybeSingle()

  const { data: contacts } = await client
    .from('contacts')
    .select('id, full_name, email')
    .eq('company_id', company.id)
    .order('created_at', { ascending: true })

  const primaryContact = contacts?.[0]
  const painPoints = Array.isArray(report?.pain_points) ? (report.pain_points as string[]) : []
  const painPoint = painPoints[0] ?? 'growth priorities'

  const { data: steps, error: stepsError } = await client
    .from('sequence_steps')
    .select('*')
    .eq('sequence_id', sequenceId)
    .order('step_order', { ascending: true })

  if (stepsError) {
    throw stepsError
  }

  if (steps.length === 0) {
    throw new Error('Sequence has no steps')
  }

  await client.from('email_drafts').delete().eq('company_id', company.id)

  let draftCount = 0

  for (const step of steps) {
    const generated = generateEmailFromTemplate({
      companyName: company.name,
      contactName: primaryContact?.full_name,
      painPoint,
      researchSummary: report?.summary,
      stepOrder: step.step_order,
      subjectTemplate: step.subject_template,
      bodyTemplate: step.body_template,
    })

    const qualityIssues = runQualityCheck({
      subject: generated.subject,
      body: generated.body,
      contactEmail: primaryContact?.email,
      companyName: company.name,
    })

    let status: EmailDraftStatus = settings.requireManualApproval ? 'pending_review' : 'approved'
    if (hasBlockingQualityIssues(qualityIssues)) {
      status = 'pending_review'
    }

    const { error: insertError } = await client.from('email_drafts').insert({
      organization_id: input.organizationId,
      company_id: company.id,
      contact_id: primaryContact?.id ?? null,
      sequence_id: sequenceId,
      sequence_step_id: step.id,
      step_order: step.step_order,
      status,
      subject: generated.subject,
      body: generated.body,
      quality_issues: qualityIssues as Json,
    })

    if (insertError) {
      throw insertError
    }

    draftCount += 1
  }

  void PROMPT_VERSION
  return { draftCount }
}

export async function runPostResearchPipeline(
  client: Client,
  input: { organizationId: string; companyId: string },
): Promise<void> {
  const { status } = await runLeadQualification(client, input)

  if (status === 'qualified') {
    await generateOutreachDrafts(client, input)
  }
}
