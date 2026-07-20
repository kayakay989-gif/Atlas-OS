'use server'

import { isFeatureEnabled } from '@atlas/config'
import {
  completeOnboarding,
  createProposalDraft,
  generateInvoiceFromProposal,
  markInvoicePaidAndTriggerOnboarding,
  regenerateProposalContent,
  reviewProposal,
  sendInvoice,
  sendProposal,
  updateProposalContent,
} from '@atlas/conversion'
import { createProposalSchema, reviewProposalSchema, updateProposalSchema } from '@atlas/types'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface ConversionActionState {
  error?: string
  success?: string
  proposalId?: string
  invoiceId?: string
  onboardingId?: string
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function assertConversionEnabled(organizationId: string): void {
  if (!isFeatureEnabled('conversionPipeline', { organizationId })) {
    throw new Error('Conversion pipeline is disabled. Set FF_CONVERSION_PIPELINE=true to enable.')
  }
}

export async function createProposalAction(
  _prev: ConversionActionState,
  formData: FormData,
): Promise<ConversionActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertConversionEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can create proposals' }
  }

  const meetingId = getFormString(formData, 'meetingId')
  const contactId = getFormString(formData, 'contactId')
  const amountRaw = getFormString(formData, 'amountCents')

  const parsed = createProposalSchema.safeParse({
    companyId: getFormString(formData, 'companyId'),
    contactId: contactId || undefined,
    meetingId: meetingId || undefined,
    amountCents: amountRaw ? Number(amountRaw) : undefined,
    currency: getFormString(formData, 'currency') || 'USD',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid proposal input' }
  }

  const supabase = await createClient()

  try {
    const { proposalId } = await createProposalDraft(supabase, {
      ...parsed.data,
      organizationId: activeOrganization.id,
    })

    after(async () => {
      try {
        const bgClient = await createClient()
        await regenerateProposalContent(bgClient, {
          organizationId: activeOrganization.id,
          proposalId,
        })
      } catch {
        // Initial draft is already usable if regeneration fails.
      }
    })

    revalidatePath('/proposals')
    return {
      success: 'Proposal draft created and queued for AI refinement.',
      proposalId,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create proposal' }
  }
}

export async function updateProposalAction(
  _prev: ConversionActionState,
  formData: FormData,
): Promise<ConversionActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertConversionEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can edit proposals' }
  }

  const proposalId = getFormString(formData, 'proposalId')
  const parsed = updateProposalSchema.safeParse({
    title: getFormString(formData, 'title'),
    content: getFormString(formData, 'content'),
    amountCents: Number(getFormString(formData, 'amountCents') || '0'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid proposal update' }
  }

  const supabase = await createClient()

  try {
    await updateProposalContent(supabase, {
      organizationId: activeOrganization.id,
      proposalId,
      ...parsed.data,
    })

    revalidatePath('/proposals')
    revalidatePath(`/proposals/${proposalId}`)
    return { success: 'Proposal updated' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update proposal' }
  }
}

export async function reviewProposalAction(
  proposalId: string,
  decision: 'approved' | 'rejected',
): Promise<ConversionActionState> {
  const { activeOrganization, activeRole, user } = await requireOrganizationContext()
  assertConversionEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can review proposals' }
  }

  const parsed = reviewProposalSchema.safeParse({ proposalId, decision })
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid review input' }
  }

  const supabase = await createClient()

  try {
    await reviewProposal(supabase, {
      organizationId: activeOrganization.id,
      proposalId,
      decision,
      reviewerId: user.id,
    })

    revalidatePath('/proposals')
    revalidatePath(`/proposals/${proposalId}`)
    return {
      success: decision === 'approved' ? 'Proposal approved' : 'Proposal rejected',
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to review proposal' }
  }
}

export async function sendProposalAction(proposalId: string): Promise<ConversionActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertConversionEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can send proposals' }
  }

  const supabase = await createClient()

  try {
    await sendProposal(supabase, {
      organizationId: activeOrganization.id,
      proposalId,
    })

    revalidatePath('/proposals')
    revalidatePath(`/proposals/${proposalId}`)
    return { success: 'Proposal sent to contact (mock email for M7)' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to send proposal' }
  }
}

export async function generateInvoiceAction(proposalId: string): Promise<ConversionActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertConversionEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can generate invoices' }
  }

  const supabase = await createClient()

  try {
    const { invoiceId } = await generateInvoiceFromProposal(supabase, {
      organizationId: activeOrganization.id,
      proposalId,
    })

    revalidatePath('/invoices')
    revalidatePath(`/proposals/${proposalId}`)
    return {
      success: 'Invoice generated from proposal',
      invoiceId,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to generate invoice' }
  }
}

export async function sendInvoiceAction(invoiceId: string): Promise<ConversionActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertConversionEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can send invoices' }
  }

  const supabase = await createClient()

  try {
    await sendInvoice(supabase, {
      organizationId: activeOrganization.id,
      invoiceId,
    })

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    return { success: 'Invoice sent to contact (mock email for M7)' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to send invoice' }
  }
}

export async function markInvoicePaidAction(invoiceId: string): Promise<ConversionActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertConversionEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can mark invoices paid' }
  }

  const supabase = await createClient()

  try {
    const { onboardingId } = await markInvoicePaidAndTriggerOnboarding(supabase, {
      organizationId: activeOrganization.id,
      invoiceId,
    })

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    return {
      success: 'Invoice marked paid. Client onboarding workflow started.',
      onboardingId,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to mark invoice paid' }
  }
}

export async function completeOnboardingAction(
  onboardingId: string,
): Promise<ConversionActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertConversionEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can complete onboarding' }
  }

  const supabase = await createClient()

  try {
    await completeOnboarding(supabase, {
      organizationId: activeOrganization.id,
      onboardingId,
    })

    revalidatePath('/invoices')
    return { success: 'Onboarding marked complete' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to complete onboarding' }
  }
}
