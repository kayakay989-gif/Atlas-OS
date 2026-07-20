import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function DeliverabilityDashboardPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('emailSending', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Email infrastructure disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_EMAIL_SENDING=true</code> to configure domains and mailboxes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { count: domainCount } = await supabase
    .from('outreach_domains')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', activeOrganization.id)

  const { count: verifiedDomainCount } = await supabase
    .from('outreach_domains')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', activeOrganization.id)
    .eq('verification_status', 'verified')

  const { data: mailboxes } = await supabase
    .from('mailboxes')
    .select('health_score, status')
    .eq('organization_id', activeOrganization.id)

  const { count: suppressionCount } = await supabase
    .from('suppression_entries')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', activeOrganization.id)

  const avgHealth =
    mailboxes && mailboxes.length > 0
      ? Math.round(
          mailboxes.reduce((sum, mailbox) => sum + mailbox.health_score, 0) / mailboxes.length,
        )
      : null

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-muted-foreground text-sm">Deliverability</p>
        <h1 className="text-3xl font-bold tracking-tight">Email infrastructure</h1>
        <p className="text-muted-foreground">
          Domains, mailboxes, suppression, and health monitoring.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{domainCount ?? 0}</p>
            <p className="text-muted-foreground text-sm">{verifiedDomainCount ?? 0} verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mailboxes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{mailboxes?.length ?? 0}</p>
            <p className="text-muted-foreground text-sm">
              {mailboxes?.filter((mailbox) => mailbox.status === 'warming').length ?? 0} warming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{avgHealth ?? '—'}</p>
            <p className="text-muted-foreground text-sm">Across active mailboxes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suppressed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{suppressionCount ?? 0}</p>
            <p className="text-muted-foreground text-sm">Blocked recipients</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/deliverability/domains"
          className="text-primary text-sm font-medium hover:underline"
        >
          Manage domains →
        </Link>
        <Link
          href="/deliverability/mailboxes"
          className="text-primary text-sm font-medium hover:underline"
        >
          Manage mailboxes →
        </Link>
        <Link
          href="/deliverability/suppression"
          className="text-primary text-sm font-medium hover:underline"
        >
          Suppression list →
        </Link>
      </div>
    </div>
  )
}
