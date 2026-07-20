import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { InvoiceActions } from '@/components/features/conversion/invoice-actions'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency })
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('conversionPipeline', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    notFound()
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!invoice) {
    notFound()
  }

  const [{ data: company }, { data: proposal }, { data: onboarding }] = await Promise.all([
    supabase.from('companies').select('name').eq('id', invoice.company_id).maybeSingle(),
    supabase.from('proposals').select('id, title').eq('id', invoice.proposal_id).maybeSingle(),
    supabase
      .from('onboarding_workflows')
      .select('id, status, triggered_at, completed_at')
      .eq('invoice_id', invoice.id)
      .maybeSingle(),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link href="/invoices" className="text-muted-foreground text-sm hover:underline">
          ← Back to invoices
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{invoice.invoice_number}</h1>
            <p className="text-muted-foreground">
              {company?.name ?? 'Company'} · {invoice.status} ·{' '}
              {formatAmount(invoice.amount_cents, invoice.currency)}
            </p>
          </div>
          <InvoiceActions
            invoiceId={invoice.id}
            status={invoice.status}
            onboardingId={onboarding?.id}
            onboardingStatus={onboarding?.status}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due date</CardDescription>
            <CardTitle>{new Date(invoice.due_date).toLocaleDateString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Source proposal</CardDescription>
            <CardTitle className="text-base">
              {proposal ? (
                <Link href={`/proposals/${proposal.id}`} className="hover:underline">
                  {proposal.title}
                </Link>
              ) : (
                '—'
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {onboarding ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Client onboarding</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base capitalize">
                {onboarding.status.replace('_', ' ')}
              </CardTitle>
              <CardDescription>
                Triggered {new Date(onboarding.triggered_at).toLocaleString()}
                {onboarding.completed_at
                  ? ` · Completed ${new Date(onboarding.completed_at).toLocaleString()}`
                  : ''}
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      ) : null}
    </div>
  )
}
