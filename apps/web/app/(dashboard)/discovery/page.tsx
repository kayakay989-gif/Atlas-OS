import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function DiscoveryPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('discoveryPipeline', { organizationId: activeOrganization.id })

  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('icp_profiles')
    .select('*')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Discovery</p>
          <h1 className="text-3xl font-bold tracking-tight">ICP Profiles</h1>
        </div>
        <Button asChild disabled={!enabled}>
          <Link href="/discovery/icp/new">New ICP profile</Link>
        </Button>
      </div>

      {!enabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Discovery pipeline disabled</CardTitle>
            <CardDescription>
              Set <code className="text-xs">FF_DISCOVERY_PIPELINE=true</code> in your environment to
              enable M2 features.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {profiles && profiles.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {profiles.map((profile) => (
            <li key={profile.id} className="flex items-center justify-between p-4">
              <div>
                <Link href={`/discovery/icp/${profile.id}`} className="font-medium hover:underline">
                  {profile.name}
                </Link>
                <p className="text-muted-foreground text-sm">
                  {profile.industries.join(', ') || 'Any industry'} ·{' '}
                  {profile.geographies.join(', ') || 'Any geography'}
                </p>
              </div>
              <span className="text-muted-foreground text-xs uppercase">
                {profile.is_active ? 'Active' : 'Inactive'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground p-6 text-sm">
            No ICP profiles yet. Create one to start importing companies via CSV.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
