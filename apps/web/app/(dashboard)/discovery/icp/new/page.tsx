import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createIcpProfileAction } from '@/app/actions/discovery'
import { IcpProfileForm } from '@/components/features/discovery/icp-profile-form'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function NewIcpPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('discoveryPipeline', { organizationId: activeOrganization.id })

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Discovery disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_DISCOVERY_PIPELINE=true</code> to create ICP profiles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/discovery" className="text-primary text-sm hover:underline">
              Back to discovery
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-8">
      <div>
        <p className="text-muted-foreground text-sm">Discovery</p>
        <h1 className="text-3xl font-bold tracking-tight">New ICP profile</h1>
      </div>
      <IcpProfileForm action={createIcpProfileAction} />
    </div>
  )
}
