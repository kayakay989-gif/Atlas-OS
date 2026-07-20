import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { getDnsSetupInstructions } from '@atlas/deliverability'
import { verifyDomainDnsFormAction } from '@/app/actions/deliverability'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface DomainDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DomainDetailPage({ params }: DomainDetailPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('emailSending', { organizationId: activeOrganization.id })

  if (!enabled) {
    notFound()
  }

  const supabase = await createClient()
  const { data: domain } = await supabase
    .from('outreach_domains')
    .select('*')
    .eq('id', id)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!domain) {
    notFound()
  }

  const instructions = getDnsSetupInstructions(domain.domain, domain.dkim_selector)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/deliverability/domains"
            className="text-muted-foreground text-sm hover:underline"
          >
            ← Domains
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{domain.domain}</h1>
          <p className="text-muted-foreground capitalize">Status: {domain.verification_status}</p>
        </div>
        <form action={verifyDomainDnsFormAction.bind(null, domain.id)}>
          <Button type="submit" variant="outline" size="sm">
            Re-check DNS
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DNS setup instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">SPF (TXT @ {domain.domain})</p>
            <p className="text-muted-foreground font-mono">{instructions.spf}</p>
          </div>
          <div>
            <p className="font-medium">DKIM</p>
            <p className="text-muted-foreground">{instructions.dkim}</p>
          </div>
          <div>
            <p className="font-medium">DMARC (TXT @ _dmarc.{domain.domain})</p>
            <p className="text-muted-foreground font-mono">{instructions.dmarc}</p>
          </div>
          {domain.dns_last_checked_at ? (
            <p className="text-muted-foreground">
              Last checked: {new Date(domain.dns_last_checked_at).toLocaleString()}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
