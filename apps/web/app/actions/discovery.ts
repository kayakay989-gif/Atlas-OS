'use server'

import { runCompanyPipeline, runCsvDiscovery } from '@atlas/discovery'
import { isFeatureEnabled } from '@atlas/config'
import { runPostResearchPipeline } from '@atlas/outreach'
import { icpProfileSchema } from '@atlas/types'
import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export interface DiscoveryActionState {
  error?: string
  success?: string
}

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function parseListField(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function assertDiscoveryEnabled(organizationId: string): void {
  if (!isFeatureEnabled('discoveryPipeline', { organizationId })) {
    throw new Error('Discovery pipeline is disabled. Set FF_DISCOVERY_PIPELINE=true to enable.')
  }
}

async function runCompanyPipelineChain(
  client: Awaited<ReturnType<typeof createClient>>,
  input: { organizationId: string; companyId: string },
): Promise<void> {
  await runCompanyPipeline(client, input)

  if (isFeatureEnabled('outreachGeneration', { organizationId: input.organizationId })) {
    await runPostResearchPipeline(client, input)
  }
}

export async function createIcpProfileAction(
  _prev: DiscoveryActionState,
  formData: FormData,
): Promise<DiscoveryActionState> {
  const { activeOrganization } = await requireOrganizationContext()
  assertDiscoveryEnabled(activeOrganization.id)

  const parsed = icpProfileSchema.safeParse({
    name: getFormString(formData, 'name'),
    industries: parseListField(getFormString(formData, 'industries')),
    geographies: parseListField(getFormString(formData, 'geographies')),
    keywords: parseListField(getFormString(formData, 'keywords')),
    companySizeMin: getFormString(formData, 'companySizeMin')
      ? Number(getFormString(formData, 'companySizeMin'))
      : undefined,
    companySizeMax: getFormString(formData, 'companySizeMax')
      ? Number(getFormString(formData, 'companySizeMax'))
      : undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid ICP profile' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('icp_profiles')
    .insert({
      organization_id: activeOrganization.id,
      name: parsed.data.name,
      industries: parsed.data.industries,
      geographies: parsed.data.geographies,
      keywords: parsed.data.keywords,
      company_size_min: parsed.data.companySizeMin ?? null,
      company_size_max: parsed.data.companySizeMax ?? null,
      is_active: parsed.data.isActive,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/discovery')
  redirect(`/discovery/icp/${data.id}`)
}

export async function runCsvDiscoveryAction(
  _prev: DiscoveryActionState,
  formData: FormData,
): Promise<DiscoveryActionState> {
  const { activeOrganization } = await requireOrganizationContext()
  assertDiscoveryEnabled(activeOrganization.id)

  const icpProfileId = getFormString(formData, 'icpProfileId')
  const csvContent = getFormString(formData, 'csvContent')

  if (!icpProfileId || !csvContent.trim()) {
    return { error: 'ICP profile and CSV content are required' }
  }

  const supabase = await createClient()

  try {
    const { companyIds } = await runCsvDiscovery(supabase, {
      organizationId: activeOrganization.id,
      icpProfileId,
      csvContent,
    })

    after(async () => {
      const bgClient = await createClient()
      for (const companyId of companyIds) {
        try {
          await runCompanyPipelineChain(bgClient, {
            organizationId: activeOrganization.id,
            companyId,
          })
        } catch {
          // Individual company failures are recorded on the company row.
        }
      }
    })

    revalidatePath('/companies')
    revalidatePath(`/discovery/icp/${icpProfileId}`)
    return {
      success: `Imported ${companyIds.length} companies. Research pipeline started in the background.`,
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Discovery failed' }
  }
}

export async function rerunCompanyPipelineAction(companyId: string): Promise<DiscoveryActionState> {
  const { activeOrganization } = await requireOrganizationContext()
  assertDiscoveryEnabled(activeOrganization.id)

  after(async () => {
    const bgClient = await createClient()
    await runCompanyPipelineChain(bgClient, {
      organizationId: activeOrganization.id,
      companyId,
    })
  })

  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/companies')
  return { success: 'Pipeline restarted' }
}

export async function rerunCompanyPipelineFormAction(companyId: string): Promise<void> {
  await rerunCompanyPipelineAction(companyId)
}
