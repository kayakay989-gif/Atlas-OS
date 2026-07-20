'use server'

import { isFeatureEnabled } from '@atlas/config'
import { getOrCreateOutreachSettings } from '@atlas/qualification'
import { generateOutreachDrafts, hasBlockingQualityIssues, runQualityCheck } from '@atlas/outreach'
import { outreachSettingsSchema, updateEmailDraftSchema } from '@atlas/types'
import type { Json } from '@atlas/database/types'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface OutreachActionState {
  error?: string
  success?: string
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function assertOutreachEnabled(organizationId: string): void {
  if (!isFeatureEnabled('outreachGeneration', { organizationId })) {
    throw new Error('Outreach generation is disabled. Set FF_OUTREACH_GENERATION=true to enable.')
  }
}

export async function updateOutreachSettingsAction(
  _prev: OutreachActionState,
  formData: FormData,
): Promise<OutreachActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertOutreachEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can update outreach settings' }
  }

  const parsed = outreachSettingsSchema.safeParse({
    requireManualApproval: getFormString(formData, 'requireManualApproval') === 'on',
    minQualificationScore: Number(getFormString(formData, 'minQualificationScore')),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid outreach settings' }
  }

  const supabase = await createClient()
  await getOrCreateOutreachSettings(supabase, activeOrganization.id)

  const { error } = await supabase.from('organization_outreach_settings').upsert({
    organization_id: activeOrganization.id,
    require_manual_approval: parsed.data.requireManualApproval,
    min_qualification_score: parsed.data.minQualificationScore,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/outreach')
  revalidatePath('/qualification')
  return { success: 'Outreach settings saved' }
}

export async function updateEmailDraftAction(
  _prev: OutreachActionState,
  formData: FormData,
): Promise<OutreachActionState> {
  const { activeOrganization } = await requireOrganizationContext()
  assertOutreachEnabled(activeOrganization.id)

  const draftId = getFormString(formData, 'draftId')
  const parsed = updateEmailDraftSchema.safeParse({
    subject: getFormString(formData, 'subject'),
    body: getFormString(formData, 'body'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid draft content' }
  }

  const supabase = await createClient()
  const { data: draft, error: fetchError } = await supabase
    .from('email_drafts')
    .select('id, company_id, contact_id, status')
    .eq('id', draftId)
    .eq('organization_id', activeOrganization.id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (draft.status === 'approved') {
    return { error: 'Approved drafts cannot be edited' }
  }

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', draft.company_id)
    .single()

  let contactEmail: string | null = null
  if (draft.contact_id) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('email')
      .eq('id', draft.contact_id)
      .maybeSingle()
    contactEmail = contact?.email ?? null
  }

  const companyName = company?.name ?? 'Company'

  const qualityIssues = runQualityCheck({
    subject: parsed.data.subject,
    body: parsed.data.body,
    contactEmail,
    companyName,
  })

  const qualityIssuesJson: Json = qualityIssues

  const { error } = await supabase
    .from('email_drafts')
    .update({
      subject: parsed.data.subject,
      body: parsed.data.body,
      quality_issues: qualityIssuesJson,
      status: hasBlockingQualityIssues(qualityIssues) ? 'pending_review' : draft.status,
    })
    .eq('id', draftId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/outreach/${draftId}`)
  revalidatePath('/outreach')
  return { success: 'Draft updated' }
}

export async function reviewEmailDraftFormAction(
  draftId: string,
  decision: 'approved' | 'rejected',
): Promise<void> {
  const { activeOrganization, user } = await requireOrganizationContext()
  assertOutreachEnabled(activeOrganization.id)

  const supabase = await createClient()
  const { error } = await supabase
    .from('email_drafts')
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', draftId)
    .eq('organization_id', activeOrganization.id)

  if (error) {
    throw error
  }

  revalidatePath(`/outreach/${draftId}`)
  revalidatePath('/outreach')
}

export async function regenerateOutreachFormAction(companyId: string): Promise<void> {
  const { activeOrganization } = await requireOrganizationContext()
  assertOutreachEnabled(activeOrganization.id)

  after(async () => {
    const bgClient = await createClient()
    await generateOutreachDrafts(bgClient, {
      organizationId: activeOrganization.id,
      companyId,
    })
  })

  revalidatePath('/outreach')
  revalidatePath(`/companies/${companyId}`)
}
