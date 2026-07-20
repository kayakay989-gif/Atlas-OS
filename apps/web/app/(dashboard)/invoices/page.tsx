import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency })
}

export default async function InvoicesPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('conversionPipeline', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, amount_cents, currency, due_date, created_at')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Invoices disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_CONVERSION_PIPELINE=true</code> to manage invoices and onboarding.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-muted-foreground text-sm">Conversion</p>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">
          Invoices generated from approved proposals. Mark paid to trigger client onboarding.
        </p>
      </div>

      {!invoices || invoices.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No invoices yet. Generate one from a sent or approved proposal.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                  {invoice.invoice_number}
                </Link>
                <p className="text-muted-foreground text-sm">
                  {statusLabels[invoice.status] ?? invoice.status} ·{' '}
                  {formatAmount(invoice.amount_cents, invoice.currency)} · Due{' '}
                  {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
