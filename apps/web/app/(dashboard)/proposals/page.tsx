import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  approved: 'Approved',
  sent: 'Sent',
  rejected: 'Rejected',
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency })
}

export default async function ProposalsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('conversionPipeline', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, title, status, amount_cents, currency, created_at, company_id')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Proposals disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_CONVERSION_PIPELINE=true</code> to generate and manage proposals.
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
          <p className="text-muted-foreground text-sm">Conversion</p>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">
            AI-generated proposals from meeting context and company research, with human approval.
          </p>
        </div>
        <Link href="/proposals/new" className="text-primary text-sm font-medium hover:underline">
          New proposal →
        </Link>
      </div>

      {!proposals || proposals.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No proposals yet. Create one from a completed meeting or qualified company.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {proposals.map((proposal) => (
            <li key={proposal.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <Link href={`/proposals/${proposal.id}`} className="font-medium hover:underline">
                  {proposal.title}
                </Link>
                <p className="text-muted-foreground text-sm">
                  {statusLabels[proposal.status] ?? proposal.status} ·{' '}
                  {formatAmount(proposal.amount_cents, proposal.currency)} ·{' '}
                  {new Date(proposal.created_at).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
