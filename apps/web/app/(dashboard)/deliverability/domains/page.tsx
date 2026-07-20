import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { addOutreachDomainAction } from '@/app/actions/deliverability'
import { AddDomainForm } from '@/components/features/deliverability/add-domain-form'
import { Card, CardContent, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function DomainsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('emailSending', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    return null
  }

  const { data: domains } = await supabase
    .from('outreach_domains')
    .select('*')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <Link href="/deliverability" className="text-muted-foreground text-sm hover:underline">
          ← Deliverability
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Outreach domains</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add domain</CardTitle>
        </CardHeader>
        <CardContent>
          <AddDomainForm action={addOutreachDomainAction} />
        </CardContent>
      </Card>

      <ul className="divide-y rounded-lg border">
        {!domains || domains.length === 0 ? (
          <li className="text-muted-foreground p-4 text-sm">No domains configured yet.</li>
        ) : (
          domains.map((domain) => (
            <li key={domain.id} className="flex items-center justify-between p-4">
              <div>
                <Link
                  href={`/deliverability/domains/${domain.id}`}
                  className="font-medium hover:underline"
                >
                  {domain.domain}
                </Link>
                <p className="text-muted-foreground text-sm">
                  SPF {domain.spf_valid ? '✓' : '✗'} · DKIM {domain.dkim_valid ? '✓' : '✗'} · DMARC{' '}
                  {domain.dmarc_valid ? '✓' : '✗'} · Health {domain.health_score}
                </p>
              </div>
              <span className="bg-muted rounded-full px-2 py-1 text-xs uppercase">
                {domain.verification_status}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
