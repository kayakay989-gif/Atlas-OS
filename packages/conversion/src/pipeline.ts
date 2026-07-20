import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@atlas/database/types'
import type { CreateProposalInput } from '@atlas/types'
import {
  generateInvoiceNumber,
  generateProposalContent,
  PROMPT_VERSION,
} from './services/proposal-generation-service'

type Client = SupabaseClient<Database>

export async function createProposalDraft(
  client: Client,
  input: CreateProposalInput & { organizationId: string },
): Promise<{ proposalId: string }> {
  const { data: company, error: companyError } = await client
    .from('companies')
    .select('id, name')
    .eq('id', input.companyId)
    .eq('organization_id', input.organizationId)
    .single()

  if (companyError) {
    throw companyError
  }

  let contactName: string | null = null
  if (input.contactId) {
    const { data: contact } = await client
      .from('contacts')
      .select('full_name')
      .eq('id', input.contactId)
      .maybeSingle()
    contactName = contact?.full_name ?? null
  }

  const { data: report } = await client
    .from('research_reports')
    .select('summary, pain_points')
    .eq('company_id', company.id)
    .maybeSingle()

  let meetingBrief: string | null = null
  if (input.meetingId) {
    const { data: brief } = await client
      .from('meeting_briefs')
      .select('content')
      .eq('meeting_id', input.meetingId)
      .maybeSingle()
    meetingBrief = brief?.content ?? null
  }

  const painPoints = Array.isArray(report?.pain_points) ? (report.pain_points as string[]) : []

  const generated = generateProposalContent({
    companyName: company.name,
    contactName,
    researchSummary: report?.summary,
    meetingBrief,
    painPoints,
    amountCents: input.amountCents,
    currency: input.currency,
  })

  const { data: proposal, error } = await client
    .from('proposals')
    .insert({
      organization_id: input.organizationId,
      company_id: input.companyId,
      contact_id: input.contactId ?? null,
      meeting_id: input.meetingId ?? null,
      title: generated.title,
      content: generated.content,
      amount_cents: input.amountCents,
      currency: input.currency,
      status: 'pending_review',
      prompt_version: PROMPT_VERSION,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return { proposalId: proposal.id }
}

export async function regenerateProposalContent(
  client: Client,
  input: { organizationId: string; proposalId: string },
): Promise<void> {
  const { data: proposal, error: proposalError } = await client
    .from('proposals')
    .select('*')
    .eq('id', input.proposalId)
    .eq('organization_id', input.organizationId)
    .single()

  if (proposalError) {
    throw proposalError
  }

  const { data: company, error: companyError } = await client
    .from('companies')
    .select('id, name')
    .eq('id', proposal.company_id)
    .single()

  if (companyError) {
    throw companyError
  }

  let contactName: string | null = null
  if (proposal.contact_id) {
    const { data: contact } = await client
      .from('contacts')
      .select('full_name')
      .eq('id', proposal.contact_id)
      .maybeSingle()
    contactName = contact?.full_name ?? null
  }

  const { data: report } = await client
    .from('research_reports')
    .select('summary, pain_points')
    .eq('company_id', company.id)
    .maybeSingle()

  let meetingBrief: string | null = null
  if (proposal.meeting_id) {
    const { data: brief } = await client
      .from('meeting_briefs')
      .select('content')
      .eq('meeting_id', proposal.meeting_id)
      .maybeSingle()
    meetingBrief = brief?.content ?? null
  }

  const painPoints = Array.isArray(report?.pain_points) ? (report.pain_points as string[]) : []

  const generated = generateProposalContent({
    companyName: company.name,
    contactName,
    researchSummary: report?.summary,
    meetingBrief,
    painPoints,
    amountCents: proposal.amount_cents,
    currency: proposal.currency,
  })

  const { error } = await client
    .from('proposals')
    .update({
      title: generated.title,
      content: generated.content,
      status: 'pending_review',
      prompt_version: PROMPT_VERSION,
    })
    .eq('id', proposal.id)

  if (error) {
    throw error
  }
}

export async function updateProposalContent(
  client: Client,
  input: {
    organizationId: string
    proposalId: string
    title: string
    content: string
    amountCents: number
  },
): Promise<void> {
  const { error } = await client
    .from('proposals')
    .update({
      title: input.title,
      content: input.content,
      amount_cents: input.amountCents,
      status: 'pending_review',
    })
    .eq('id', input.proposalId)
    .eq('organization_id', input.organizationId)

  if (error) {
    throw error
  }
}

export async function reviewProposal(
  client: Client,
  input: {
    organizationId: string
    proposalId: string
    decision: 'approved' | 'rejected'
    reviewerId: string
  },
): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await client
    .from('proposals')
    .update({
      status: input.decision,
      reviewed_by: input.reviewerId,
      reviewed_at: now,
      approved_at: input.decision === 'approved' ? now : null,
    })
    .eq('id', input.proposalId)
    .eq('organization_id', input.organizationId)

  if (error) {
    throw error
  }
}

export async function sendProposal(
  client: Client,
  input: { organizationId: string; proposalId: string },
): Promise<void> {
  const { data: proposal, error: fetchError } = await client
    .from('proposals')
    .select('*')
    .eq('id', input.proposalId)
    .eq('organization_id', input.organizationId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  if (proposal.status !== 'approved') {
    throw new Error('Only approved proposals can be sent')
  }

  const { error } = await client
    .from('proposals')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', proposal.id)

  if (error) {
    throw error
  }
}

export async function generateInvoiceFromProposal(
  client: Client,
  input: { organizationId: string; proposalId: string },
): Promise<{ invoiceId: string }> {
  const { data: proposal, error: proposalError } = await client
    .from('proposals')
    .select('*')
    .eq('id', input.proposalId)
    .eq('organization_id', input.organizationId)
    .single()

  if (proposalError) {
    throw proposalError
  }

  if (proposal.status !== 'sent' && proposal.status !== 'approved') {
    throw new Error('Proposal must be approved or sent before invoicing')
  }

  const { count } = await client
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', input.organizationId)

  const invoiceNumber = generateInvoiceNumber((count ?? 0) + 1)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)

  const { data: invoice, error } = await client
    .from('invoices')
    .insert({
      organization_id: input.organizationId,
      proposal_id: proposal.id,
      company_id: proposal.company_id,
      contact_id: proposal.contact_id,
      invoice_number: invoiceNumber,
      amount_cents: proposal.amount_cents,
      currency: proposal.currency,
      status: 'draft',
      due_date: dueDate.toISOString().slice(0, 10),
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return { invoiceId: invoice.id }
}

export async function markInvoicePaidAndTriggerOnboarding(
  client: Client,
  input: { organizationId: string; invoiceId: string },
): Promise<{ onboardingId: string }> {
  const { data: invoice, error: invoiceError } = await client
    .from('invoices')
    .select('*')
    .eq('id', input.invoiceId)
    .eq('organization_id', input.organizationId)
    .single()

  if (invoiceError) {
    throw invoiceError
  }

  const paidAt = new Date().toISOString()

  const { error: updateError } = await client
    .from('invoices')
    .update({ status: 'paid', paid_at: paidAt })
    .eq('id', invoice.id)

  if (updateError) {
    throw updateError
  }

  const { data: workflow, error } = await client
    .from('onboarding_workflows')
    .insert({
      organization_id: input.organizationId,
      company_id: invoice.company_id,
      contact_id: invoice.contact_id,
      proposal_id: invoice.proposal_id,
      invoice_id: invoice.id,
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return { onboardingId: workflow.id }
}

export async function sendInvoice(
  client: Client,
  input: { organizationId: string; invoiceId: string },
): Promise<void> {
  const { error } = await client
    .from('invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', input.invoiceId)
    .eq('organization_id', input.organizationId)

  if (error) {
    throw error
  }
}

export async function completeOnboarding(
  client: Client,
  input: { organizationId: string; onboardingId: string },
): Promise<void> {
  const { error } = await client
    .from('onboarding_workflows')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', input.onboardingId)
    .eq('organization_id', input.organizationId)

  if (error) {
    throw error
  }
}
