import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { CampaignActions } from '@/components/features/campaigns/campaign-actions'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('campaignExecution', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    notFound()
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!campaign) {
    notFound()
  }

  const { data: sequence } = await supabase
    .from('email_sequences')
    .select('name')
    .eq('id', campaign.sequence_id)
    .maybeSingle()

  const [{ count: contactCount }, { data: recentSends }] = await Promise.all([
    supabase
      .from('campaign_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', id),
    supabase
      .from('send_records')
      .select('id, recipient_email, status, step_order, sent_at')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const sequenceName = sequence?.name ?? 'Sequence'

  const replyRate =
    campaign.sends_count > 0
      ? `${Math.round((campaign.replies_count / campaign.sends_count) * 100)}%`
      : '—'

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <Link href="/campaigns" className="text-muted-foreground text-sm hover:underline">
          ← Back to campaigns
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-muted-foreground">
              {sequenceName} · {campaign.status} · {contactCount ?? 0} contacts enrolled
            </p>
          </div>
          <CampaignActions campaignId={campaign.id} status={campaign.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sends</CardDescription>
            <CardTitle className="text-2xl">{campaign.sends_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Replies</CardDescription>
            <CardTitle className="text-2xl">{campaign.replies_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reply rate</CardDescription>
            <CardTitle className="text-2xl">{replyRate}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bounces</CardDescription>
            <CardTitle className="text-2xl">{campaign.bounces_count}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent sends</h2>
        {!recentSends || recentSends.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No sends yet. Launch the campaign to begin.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recentSends.map((send) => (
              <li key={send.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <span>{send.recipient_email}</span>
                <span className="text-muted-foreground">
                  Step {send.step_order} · {send.status}
                  {send.sent_at ? ` · ${new Date(send.sent_at).toLocaleString()}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
