import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  qualified: 'Qualified',
  rejected: 'Rejected',
}

export default async function QualificationPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('outreachGeneration', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  const { data: scores } = await supabase
    .from('lead_scores')
    .select('id, score, status, reasoning, company_id')
    .eq('organization_id', activeOrganization.id)
    .order('updated_at', { ascending: false })

  const companyIds = scores?.map((score) => score.company_id) ?? []
  const { data: companies } =
    companyIds.length > 0
      ? await supabase.from('companies').select('id, name, domain').in('id', companyIds)
      : { data: [] }

  const companyById = new Map(companies?.map((company) => [company.id, company]) ?? [])

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Qualification disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_OUTREACH_GENERATION=true</code> to score leads after research.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-muted-foreground text-sm">Outreach</p>
        <h1 className="text-3xl font-bold tracking-tight">Qualification</h1>
        <p className="text-muted-foreground">
          Lead scores generated automatically after research completes.
        </p>
      </div>

      {!scores || scores.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No scores yet. Complete company research first, then scores appear here.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {scores.map((score) => {
            const company = companyById.get(score.company_id)

            return (
              <li key={score.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Link
                      href={`/companies/${score.company_id}`}
                      className="font-medium hover:underline"
                    >
                      {company?.name ?? 'Unknown company'}
                    </Link>
                    <p className="text-muted-foreground text-sm">
                      {company?.domain ?? 'No domain'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{score.score}</p>
                    <span className="bg-muted rounded-full px-2 py-1 text-xs uppercase">
                      {statusLabels[score.status] ?? score.status}
                    </span>
                  </div>
                </div>
                {score.reasoning ? (
                  <p className="text-muted-foreground text-sm">{score.reasoning}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
