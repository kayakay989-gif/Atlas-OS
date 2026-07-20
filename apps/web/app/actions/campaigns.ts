'use server'

import { isFeatureEnabled } from '@atlas/config'
import {
  createCampaign,
  launchCampaign,
  pauseCampaign,
  processCampaignSends,
  resumeCampaign,
} from '@atlas/campaigns'
import { createCampaignSchema } from '@atlas/types'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface CampaignActionState {
  error?: string
  success?: string
  campaignId?: string
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function assertCampaignsEnabled(organizationId: string): void {
  if (!isFeatureEnabled('campaignExecution', { organizationId })) {
    throw new Error('Campaign execution is disabled. Set FF_CAMPAIGN_EXECUTION=true to enable.')
  }

  if (!isFeatureEnabled('emailSending', { organizationId })) {
    throw new Error('Email sending is disabled. Set FF_EMAIL_SENDING=true to enable.')
  }
}

export async function createCampaignAction(
  _prev: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertCampaignsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can create campaigns' }
  }

  const mailboxIds = formData
    .getAll('mailboxIds')
    .filter((value): value is string => typeof value === 'string')

  const parsed = createCampaignSchema.safeParse({
    name: getFormString(formData, 'name'),
    sequenceId: getFormString(formData, 'sequenceId'),
    mailboxIds,
    timezone: getFormString(formData, 'timezone') || 'UTC',
    sendWindowStart: getFormString(formData, 'sendWindowStart') || '09:00',
    sendWindowEnd: getFormString(formData, 'sendWindowEnd') || '17:00',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid campaign input' }
  }

  const supabase = await createClient()

  try {
    const { campaignId, enrolledCount } = await createCampaign(supabase, {
      ...parsed.data,
      organizationId: activeOrganization.id,
    })

    revalidatePath('/campaigns')
    return {
      success: `Campaign created with ${enrolledCount} contacts enrolled from approved step-1 drafts.`,
      campaignId,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create campaign' }
  }
}

export async function launchCampaignAction(campaignId: string): Promise<CampaignActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertCampaignsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can launch campaigns' }
  }

  const supabase = await createClient()

  try {
    await launchCampaign(supabase, {
      organizationId: activeOrganization.id,
      campaignId,
    })

    after(async () => {
      const bgClient = await createClient()
      await processCampaignSends(bgClient, {
        organizationId: activeOrganization.id,
        campaignId,
      })
    })

    revalidatePath('/campaigns')
    revalidatePath(`/campaigns/${campaignId}`)
    return { success: 'Campaign launched. Sends are processing in the background.' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to launch campaign' }
  }
}

export async function pauseCampaignAction(campaignId: string): Promise<CampaignActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertCampaignsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can pause campaigns' }
  }

  const supabase = await createClient()

  try {
    await pauseCampaign(supabase, {
      organizationId: activeOrganization.id,
      campaignId,
    })

    revalidatePath('/campaigns')
    revalidatePath(`/campaigns/${campaignId}`)
    return { success: 'Campaign paused' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to pause campaign' }
  }
}

export async function resumeCampaignAction(campaignId: string): Promise<CampaignActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertCampaignsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can resume campaigns' }
  }

  const supabase = await createClient()

  try {
    await resumeCampaign(supabase, {
      organizationId: activeOrganization.id,
      campaignId,
    })

    after(async () => {
      const bgClient = await createClient()
      await processCampaignSends(bgClient, {
        organizationId: activeOrganization.id,
        campaignId,
      })
    })

    revalidatePath('/campaigns')
    revalidatePath(`/campaigns/${campaignId}`)
    return { success: 'Campaign resumed' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to resume campaign' }
  }
}

export async function runCampaignSendBatchAction(campaignId: string): Promise<CampaignActionState> {
  const { activeOrganization, activeRole } = await requireOrganizationContext()
  assertCampaignsEnabled(activeOrganization.id)

  if (activeRole === 'member') {
    return { error: 'Only admins can trigger sends' }
  }

  const supabase = await createClient()

  try {
    const result = await processCampaignSends(supabase, {
      organizationId: activeOrganization.id,
      campaignId,
    })

    revalidatePath(`/campaigns/${campaignId}`)
    return {
      success: `Send batch complete: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped.`,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Send batch failed' }
  }
}
