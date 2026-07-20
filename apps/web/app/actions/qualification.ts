'use server'

import { isFeatureEnabled } from '@atlas/config'
import { runLeadQualification } from '@atlas/qualification'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface QualificationActionState {
  error?: string
  success?: string
}

function assertOutreachEnabled(organizationId: string): void {
  if (!isFeatureEnabled('outreachGeneration', { organizationId })) {
    throw new Error('Outreach generation is disabled. Set FF_OUTREACH_GENERATION=true to enable.')
  }
}

export async function rerunQualificationFormAction(companyId: string): Promise<void> {
  const { activeOrganization } = await requireOrganizationContext()
  assertOutreachEnabled(activeOrganization.id)

  after(async () => {
    const bgClient = await createClient()
    await runLeadQualification(bgClient, {
      organizationId: activeOrganization.id,
      companyId,
    })
  })

  revalidatePath('/qualification')
  revalidatePath(`/companies/${companyId}`)
}
