import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { CreateProposalForm } from '@/components/features/conversion/create-proposal-form'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface NewProposalPageProps {
  searchParams: Promise<{
    companyId?: string
    meetingId?: string
    contactId?: string
  }>
}

export default async function NewProposalPage({ searchParams }: NewProposalPageProps) {
  const params = await searchParams
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('conversionPipeline', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    notFound()
  }

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('organization_id', activeOrganization.id)
    .order('name')

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <div>
        <Link href="/proposals" className="text-muted-foreground text-sm hover:underline">
          ← Back to proposals
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">New proposal</h1>
        <p className="text-muted-foreground">
          Generate a draft from company research and optional meeting brief.
        </p>
      </div>

      <CreateProposalForm
        companies={companies ?? []}
        defaultCompanyId={params.companyId}
        defaultMeetingId={params.meetingId}
        defaultContactId={params.contactId}
      />
    </div>
  )
}
