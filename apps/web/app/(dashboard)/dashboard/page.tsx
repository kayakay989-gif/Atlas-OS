import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function DashboardPage() {
  const { activeOrganization, activeRole, user } = await requireOrganizationContext()

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
            <CardDescription>Sequences and campaigns ship in M3–M5.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No outreach drafts yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
