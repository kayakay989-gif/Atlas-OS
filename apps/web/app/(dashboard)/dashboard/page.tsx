import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function DashboardPage() {
  const { activeOrganization, activeRole, user } = await requireOrganizationContext()
  const outreachEnabled = isFeatureEnabled('outreachGeneration', {
    organizationId: activeOrganization.id,
  })

  const supabase = await createClient()
  const pendingDrafts = outreachEnabled
    ? await supabase
        .from('email_drafts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', activeOrganization.id)
        .eq('status', 'pending_review')
    : { count: 0 }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-muted-foreground text-sm">Dashboard</p>
        <h1 className="text-3xl font-bold tracking-tight">{activeOrganization.name}</h1>
        <p className="text-muted-foreground">
          Signed in as {user.email} · role: {activeRole}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Discovery</CardTitle>
            <CardDescription>ICP profiles and company import.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/discovery" className="text-primary text-sm font-medium hover:underline">
              Manage ICP profiles →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outreach</CardTitle>
            <CardDescription>Qualification, sequences, and email review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {outreachEnabled ? (
              <>
                <p className="text-muted-foreground text-sm">
                  {pendingDrafts.count ?? 0} drafts pending review
                </p>
                <Link href="/outreach" className="text-primary text-sm font-medium hover:underline">
                  Review email drafts →
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Enable FF_OUTREACH_GENERATION to unlock outreach.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
