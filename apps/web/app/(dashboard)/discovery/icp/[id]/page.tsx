import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { runCsvDiscoveryAction } from '@/app/actions/discovery'
import { CsvImportForm } from '@/components/features/discovery/csv-import-form'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface IcpDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function IcpDetailPage({ params }: IcpDetailPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('discoveryPipeline', { organizationId: activeOrganization.id })

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('icp_profiles')
    .select('*')
    .eq('id', id)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!profile) {
    notFound()
  }

  const { count: companyCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('icp_profile_id', profile.id)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link href="/discovery" className="text-muted-foreground text-sm hover:underline">
          ← ICP profiles
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{profile.name}</h1>
        <p className="text-muted-foreground">
          {companyCount ?? 0} companies · Keywords: {profile.keywords.join(', ') || '—'}
        </p>
      </div>

      {enabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Import companies (CSV)</CardTitle>
            <CardDescription>
              Pluggable CSV discovery provider — add Firecrawl and other sources without changing
              business logic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CsvImportForm icpProfileId={profile.id} action={runCsvDiscoveryAction} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground p-6 text-sm">
            Enable FF_DISCOVERY_PIPELINE to import companies.
          </CardContent>
        </Card>
      )}

      <ButtonLink href="/companies" label="View all companies →" />
    </div>
  )
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-primary text-sm font-medium hover:underline">
      {label}
    </Link>
  )
}
