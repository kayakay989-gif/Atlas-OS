import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { getMailboxWarmUpProgress } from '@atlas/deliverability'
import { addMailboxAction } from '@/app/actions/deliverability'
import { AddMailboxForm } from '@/components/features/deliverability/add-mailbox-form'
import { Card, CardContent, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function MailboxesPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('emailSending', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    return null
  }

  const { data: domains } = await supabase
    .from('outreach_domains')
    .select('id, domain')
    .eq('organization_id', activeOrganization.id)
    .order('domain')

  const { data: mailboxes } = await supabase
    .from('mailboxes')
    .select('*')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <Link href="/deliverability" className="text-muted-foreground text-sm hover:underline">
          ← Deliverability
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Mailboxes</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register mailbox</CardTitle>
        </CardHeader>
        <CardContent>
          <AddMailboxForm domains={domains ?? []} action={addMailboxAction} />
        </CardContent>
      </Card>

      <ul className="divide-y rounded-lg border">
        {!mailboxes || mailboxes.length === 0 ? (
          <li className="text-muted-foreground p-4 text-sm">No mailboxes yet.</li>
        ) : (
          mailboxes.map((mailbox) => {
            const warmUp = getMailboxWarmUpProgress(new Date(mailbox.warm_up_started_at))
            return (
              <li key={mailbox.id} className="space-y-1 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{mailbox.email_address}</p>
                    <p className="text-muted-foreground text-sm">
                      Health {mailbox.health_score} · {mailbox.sends_today}/{warmUp.dailyLimit} sent
                      today
                    </p>
                  </div>
                  <span className="bg-muted rounded-full px-2 py-1 text-xs uppercase">
                    {mailbox.status}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Warm-up day {warmUp.day}
                  {warmUp.complete ? ' · complete' : ` · limit ${warmUp.dailyLimit}/day`}
                </p>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
