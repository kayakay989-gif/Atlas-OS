import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

const statusLabels: Record<string, string> = {
  discovered: 'Discovered',
  crawling: 'Crawling…',
  researching: 'Researching…',
  researched: 'Researched',
  failed: 'Failed',
}

export default async function CompaniesPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const supabase = await createClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, domain, status, created_at')
    .eq('organization_id', activeOrganization.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <p className="text-muted-foreground text-sm">Discovery</p>
        <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
        <p className="text-muted-foreground">Discovered leads and research pipeline status.</p>
      </div>

      {!companies || companies.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No companies yet.{' '}
          <Link href="/discovery" className="text-primary hover:underline">
            Create an ICP profile and import CSV
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {companies.map((company) => (
            <li key={company.id} className="flex items-center justify-between p-4">
              <div>
                <Link href={`/companies/${company.id}`} className="font-medium hover:underline">
                  {company.name}
                </Link>
                <p className="text-muted-foreground text-sm">{company.domain ?? 'No domain'}</p>
              </div>
              <span className="bg-muted rounded-full px-2 py-1 text-xs uppercase">
                {statusLabels[company.status] ?? company.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
