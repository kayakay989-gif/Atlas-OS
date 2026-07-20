import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default async function OutreachPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('outreachGeneration', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  const { data: drafts } = await supabase
    .from('email_drafts')
    .select('id, subject, status, step_order, company_id')
    .eq('organization_id', activeOrganization.id)
    .order('updated_at', { ascending: false })

  const companyIds = drafts?.map((draft) => draft.company_id) ?? []
  const { data: companies } =
    companyIds.length > 0
      ? await supabase.from('companies').select('id, name').in('id', companyIds)
      : { data: [] }

  const companyById = new Map(companies?.map((company) => [company.id, company]) ?? [])

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Outreach disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_OUTREACH_GENERATION=true</code> to generate outreach drafts.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const pendingCount = drafts?.filter((draft) => draft.status === 'pending_review').length ?? 0
  const approvedCount = drafts?.filter((draft) => draft.status === 'approved').length ?? 0

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Outreach</p>
          <h1 className="text-3xl font-bold tracking-tight">Email drafts</h1>
          <p className="text-muted-foreground">
            {pendingCount} pending review · {approvedCount} approved (ready for M5 campaigns)
          </p>
        </div>
        <Link href="/sequences" className="text-primary text-sm font-medium hover:underline">
          View sequences →
        </Link>
      </div>

      {!drafts || drafts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No drafts yet. Qualified leads generate sequence emails automatically.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {drafts.map((draft) => {
            const company = companyById.get(draft.company_id)

            return (
              <li key={draft.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Link href={`/outreach/${draft.id}`} className="font-medium hover:underline">
                    {draft.subject}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    {company?.name ?? 'Unknown'} · Step {draft.step_order}
                  </p>
                </div>
                <span className="bg-muted rounded-full px-2 py-1 text-xs uppercase">
                  {statusLabels[draft.status] ?? draft.status}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
