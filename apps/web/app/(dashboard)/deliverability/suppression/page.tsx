import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { addSuppressionEntryAction } from '@/app/actions/deliverability'
import { AddSuppressionForm } from '@/components/features/deliverability/add-suppression-form'
import { Card, CardContent, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function SuppressionPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('emailSending', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    return null
  }

  const { data: entries } = await supabase
    .from('suppression_entries')
    .select('*')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <Link href="/deliverability" className="text-muted-foreground text-sm hover:underline">
          ← Deliverability
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Suppression list</h1>
        <p className="text-muted-foreground">Addresses that must never receive outbound email.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add suppression</CardTitle>
        </CardHeader>
        <CardContent>
          <AddSuppressionForm action={addSuppressionEntryAction} />
        </CardContent>
      </Card>

      <ul className="divide-y rounded-lg border">
        {!entries || entries.length === 0 ? (
          <li className="text-muted-foreground p-4 text-sm">No suppressed addresses.</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{entry.email}</p>
                {entry.notes ? <p className="text-muted-foreground">{entry.notes}</p> : null}
              </div>
              <span className="bg-muted rounded-full px-2 py-1 text-xs uppercase">
                {entry.reason}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
