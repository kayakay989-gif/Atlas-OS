import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { qualityIssueSchema } from '@atlas/types'
import { reviewEmailDraftFormAction, updateEmailDraftAction } from '@/app/actions/outreach'
import { EmailDraftReviewForm } from '@/components/features/outreach/email-draft-review-form'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface OutreachDraftPageProps {
  params: Promise<{ id: string }>
}

export default async function OutreachDraftPage({ params }: OutreachDraftPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('outreachGeneration', { organizationId: activeOrganization.id })

  if (!enabled) {
    notFound()
  }

  const supabase = await createClient()
  const { data: draft } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!draft) {
    notFound()
  }

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', draft.company_id)
    .maybeSingle()

  const parsedIssues = qualityIssueSchema.array().safeParse(draft.quality_issues)
  const qualityIssues = parsedIssues.success ? parsedIssues.data : []

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <Link href="/outreach" className="text-muted-foreground text-sm hover:underline">
          ← Email drafts
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{company?.name ?? 'Company'}</h1>
        <p className="text-muted-foreground">
          Step {draft.step_order} · Status: {draft.status}
        </p>
      </div>

      <EmailDraftReviewForm
        draftId={draft.id}
        subject={draft.subject}
        body={draft.body}
        status={draft.status}
        qualityIssues={qualityIssues}
        action={updateEmailDraftAction}
        approveAction={reviewEmailDraftFormAction.bind(null, draft.id, 'approved')}
        rejectAction={reviewEmailDraftFormAction.bind(null, draft.id, 'rejected')}
      />
    </div>
  )
}
