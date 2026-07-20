import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { ProposalActions } from '@/components/features/conversion/proposal-actions'
import { ProposalEditForm } from '@/components/features/conversion/proposal-edit-form'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface ProposalDetailPageProps {
  params: Promise<{ id: string }>
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency })
}

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('conversionPipeline', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    notFound()
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!proposal) {
    notFound()
  }

  const [{ data: company }, { data: invoices }] = await Promise.all([
    supabase.from('companies').select('name').eq('id', proposal.company_id).maybeSingle(),
    supabase
      .from('invoices')
      .select('id, invoice_number, status')
      .eq('proposal_id', proposal.id)
      .order('created_at', { ascending: false }),
  ])

  const editable =
    proposal.status === 'pending_review' ||
    proposal.status === 'draft' ||
    proposal.status === 'rejected'

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link href="/proposals" className="text-muted-foreground text-sm hover:underline">
          ← Back to proposals
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{proposal.title}</h1>
            <p className="text-muted-foreground">
              {company?.name ?? 'Company'} · {proposal.status} ·{' '}
              {formatAmount(proposal.amount_cents, proposal.currency)}
            </p>
          </div>
          <ProposalActions proposalId={proposal.id} status={proposal.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposal content</CardTitle>
          <CardDescription>
            {proposal.reviewed_at
              ? `Reviewed ${new Date(proposal.reviewed_at).toLocaleString()}`
              : 'Awaiting operator review'}
            {proposal.sent_at ? ` · Sent ${new Date(proposal.sent_at).toLocaleString()}` : ''}
          </CardDescription>
        </CardHeader>
      </Card>

      <ProposalEditForm
        proposalId={proposal.id}
        title={proposal.title}
        content={proposal.content}
        amountCents={proposal.amount_cents}
        editable={editable}
      />

      {invoices && invoices.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Invoices</h2>
          <ul className="divide-y rounded-lg border">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                  {invoice.invoice_number}
                </Link>
                <span className="text-muted-foreground">{invoice.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
