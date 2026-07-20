import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default async function CampaignsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('campaignExecution', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, status, sends_count, replies_count, bounces_count, created_at')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_CAMPAIGN_EXECUTION=true</code> and <code>FF_EMAIL_SENDING=true</code>{' '}
              to launch outbound campaigns.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Campaigns</p>
          <h1 className="text-3xl font-bold tracking-tight">Outbound campaigns</h1>
          <p className="text-muted-foreground">
            Launch sequences to qualified leads with mailbox rotation and deliverability checks.
          </p>
        </div>
        <Link href="/campaigns/new" className="text-primary text-sm font-medium hover:underline">
          New campaign →
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No campaigns yet. Create one from approved outreach drafts and configured mailboxes.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:underline">
                  {campaign.name}
                </Link>
                <p className="text-muted-foreground text-sm">
                  {statusLabels[campaign.status] ?? campaign.status} · {campaign.sends_count} sends
                  · {campaign.replies_count} replies · {campaign.bounces_count} bounces
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
