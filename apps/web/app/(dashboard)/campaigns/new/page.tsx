import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { CreateCampaignForm } from '@/components/features/campaigns/create-campaign-form'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function NewCampaignPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('campaignExecution', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  const [{ data: sequences }, { data: mailboxes }] = await Promise.all([
    supabase
      .from('email_sequences')
      .select('id, name')
      .eq('organization_id', activeOrganization.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('mailboxes')
      .select('id, email_address')
      .eq('organization_id', activeOrganization.id)
      .neq('status', 'disabled')
      .order('email_address'),
  ])

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns disabled</CardTitle>
            <CardDescription>Set FF_CAMPAIGN_EXECUTION=true to create campaigns.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <Link href="/campaigns" className="text-muted-foreground text-sm hover:underline">
          ← Back to campaigns
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">New campaign</h1>
        <p className="text-muted-foreground">
          Enrolls contacts with approved step-1 drafts for the selected sequence.
        </p>
      </div>

      <CreateCampaignForm sequences={sequences ?? []} mailboxes={mailboxes ?? []} />
    </div>
  )
}
