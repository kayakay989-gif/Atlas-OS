import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { regenerateOutreachFormAction } from '@/app/actions/outreach'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@atlas/ui'
import { rerunCompanyPipelineFormAction } from '@/app/actions/discovery'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface CompanyPageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: CompanyPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const outreachEnabled = isFeatureEnabled('outreachGeneration', {
    organizationId: activeOrganization.id,
  })
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!company) {
    notFound()
  }

  const { data: report } = await supabase
    .from('research_reports')
    .select('*')
    .eq('company_id', company.id)
    .maybeSingle()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', company.id)

  const { data: crawl } = await supabase
    .from('company_crawls')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const painPoints = Array.isArray(report?.pain_points) ? (report.pain_points as string[]) : []

  const { data: leadScore } = outreachEnabled
    ? await supabase.from('lead_scores').select('*').eq('company_id', company.id).maybeSingle()
    : { data: null }

  const { data: emailDrafts } = outreachEnabled
    ? await supabase
        .from('email_drafts')
        .select('id, subject, status, step_order')
        .eq('company_id', company.id)
        .order('step_order', { ascending: true })
    : { data: null }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/companies" className="text-muted-foreground text-sm hover:underline">
            ← Companies
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-muted-foreground">
            {company.domain ?? 'No domain'} · Status: {company.status}
          </p>
        </div>
        <form action={rerunCompanyPipelineFormAction.bind(null, company.id)}>
          <Button type="submit" variant="outline" size="sm">
            Re-run pipeline
          </Button>
        </form>
      </div>

      {company.error_message ? (
        <p className="text-destructive text-sm">{company.error_message}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {outreachEnabled && leadScore ? (
          <Card>
            <CardHeader>
              <CardTitle>Qualification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-semibold">{leadScore.score}</p>
              <p className="text-muted-foreground capitalize">Status: {leadScore.status}</p>
              {leadScore.reasoning ? (
                <p className="text-muted-foreground">{leadScore.reasoning}</p>
              ) : null}
              <Link href="/qualification" className="text-primary text-sm hover:underline">
                View all scores →
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Research summary</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            {report?.summary ? (
              <p>{report.summary}</p>
            ) : (
              <p>Research pending — refresh when status is researched.</p>
            )}
            {painPoints.length > 0 ? (
              <ul className="list-disc pl-5">
                {painPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {!contacts || contacts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No contacts discovered yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <p className="font-medium">{contact.full_name ?? 'Unknown'}</p>
                    <p className="text-muted-foreground">
                      {contact.title ?? '—'} · {contact.email ?? 'No email'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {outreachEnabled && emailDrafts && emailDrafts.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Outreach drafts</CardTitle>
            <form action={regenerateOutreachFormAction.bind(null, company.id)}>
              <Button type="submit" variant="outline" size="sm">
                Regenerate
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {emailDrafts.map((draft) => (
                <li key={draft.id} className="flex items-center justify-between gap-4">
                  <Link href={`/outreach/${draft.id}`} className="hover:underline">
                    Step {draft.step_order}: {draft.subject}
                  </Link>
                  <span className="text-muted-foreground text-xs uppercase">{draft.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {crawl?.extracted_content ? (
        <Card>
          <CardHeader>
            <CardTitle>Crawl excerpt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-6 text-sm">{crawl.extracted_content}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
