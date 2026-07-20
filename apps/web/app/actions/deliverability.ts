'use server'

import { isFeatureEnabled } from '@atlas/config'
import {
  addSuppressionEntry,
  checkDomainDns,
  getDnsSetupInstructions,
  refreshMailboxHealthScores,
} from '@atlas/deliverability'
import { addMailboxSchema, addOutreachDomainSchema, addSuppressionEntrySchema } from '@atlas/types'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface DeliverabilityActionState {
  error?: string
  success?: string
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function assertEmailInfraEnabled(organizationId: string): void {
  if (!isFeatureEnabled('emailSending', { organizationId })) {
    throw new Error('Email infrastructure is disabled. Set FF_EMAIL_SENDING=true to enable.')
  }
}

export async function addOutreachDomainAction(
  _prev: DeliverabilityActionState,
  formData: FormData,
): Promise<DeliverabilityActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertEmailInfraEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can add domains' }
  }

  const parsed = addOutreachDomainSchema.safeParse({
    domain: getFormString(formData, 'domain'),
    dkimSelector: getFormString(formData, 'dkimSelector') || 'default',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid domain' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('outreach_domains')
    .insert({
      organization_id: activeOrganization.id,
      domain: parsed.data.domain.toLowerCase(),
      dkim_selector: parsed.data.dkimSelector,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  try {
    await checkDomainDns(supabase, {
      organizationId: activeOrganization.id,
      domainId: data.id,
    })
  } catch {
    // DNS check failures are reflected on the domain row.
  }

  revalidatePath('/deliverability/domains')
  revalidatePath('/deliverability')
  return { success: 'Domain added — review DNS instructions and re-check when ready' }
}

export async function verifyDomainDnsFormAction(domainId: string): Promise<void> {
  const { activeOrganization } = await requireOrganizationContext()
  assertEmailInfraEnabled(activeOrganization.id)

  const supabase = await createClient()
  await checkDomainDns(supabase, {
    organizationId: activeOrganization.id,
    domainId,
  })

  revalidatePath(`/deliverability/domains/${domainId}`)
  revalidatePath('/deliverability/domains')
  revalidatePath('/deliverability')
}

export async function addMailboxAction(
  _prev: DeliverabilityActionState,
  formData: FormData,
): Promise<DeliverabilityActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertEmailInfraEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can add mailboxes' }
  }

  const parsed = addMailboxSchema.safeParse({
    domainId: getFormString(formData, 'domainId'),
    emailAddress: getFormString(formData, 'emailAddress'),
    displayName: getFormString(formData, 'displayName') || undefined,
    provider: getFormString(formData, 'provider') || 'google_workspace',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid mailbox' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('mailboxes').insert({
    organization_id: activeOrganization.id,
    domain_id: parsed.data.domainId,
    email_address: parsed.data.emailAddress.toLowerCase(),
    display_name: parsed.data.displayName ?? null,
    provider: parsed.data.provider,
    status: 'warming',
  })

  if (error) {
    return { error: error.message }
  }

  await refreshMailboxHealthScores(supabase, activeOrganization.id)

  revalidatePath('/deliverability/mailboxes')
  revalidatePath('/deliverability')
  return { success: 'Mailbox registered — warm-up has started' }
}

export async function addSuppressionEntryAction(
  _prev: DeliverabilityActionState,
  formData: FormData,
): Promise<DeliverabilityActionState> {
  const { activeOrganization } = await requireOrganizationContext()
  assertEmailInfraEnabled(activeOrganization.id)

  const parsed = addSuppressionEntrySchema.safeParse({
    email: getFormString(formData, 'email'),
    reason: getFormString(formData, 'reason') || 'manual',
    notes: getFormString(formData, 'notes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid suppression entry' }
  }

  const supabase = await createClient()
  await addSuppressionEntry(supabase, {
    organizationId: activeOrganization.id,
    email: parsed.data.email,
    reason: parsed.data.reason,
    notes: parsed.data.notes,
  })

  revalidatePath('/deliverability/suppression')
  return { success: 'Address added to suppression list' }
}

export async function getDomainDnsInstructions(domain: string, dkimSelector: string) {
  await Promise.resolve()
  return getDnsSetupInstructions(domain, dkimSelector)
}
