import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('meetingBooking', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  if (!enabled) {
    notFound()
  }

  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .eq('organization_id', activeOrganization.id)
    .maybeSingle()

  if (!meeting) {
    notFound()
  }

  const { data: brief } = await supabase
    .from('meeting_briefs')
    .select('content, generated_at')
    .eq('meeting_id', meeting.id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <Link href="/meetings" className="text-muted-foreground text-sm hover:underline">
          ← Back to meetings
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{meeting.title}</h1>
        <p className="text-muted-foreground">
          {meeting.attendee_name} · {meeting.attendee_email} ·{' '}
          {new Date(meeting.scheduled_start).toLocaleString()} · {meeting.status}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meeting details</CardTitle>
          <CardDescription>
            {meeting.confirmation_sent_at
              ? `Confirmation sent ${new Date(meeting.confirmation_sent_at).toLocaleString()}`
              : 'Confirmation pending'}
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pre-meeting brief</h2>
        {!brief ? (
          <p className="text-muted-foreground text-sm">
            Brief is generating from company research and reply history.
          </p>
        ) : (
          <pre className="bg-muted/30 overflow-x-auto whitespace-pre-wrap rounded-lg border p-4 text-sm">
            {brief.content}
          </pre>
        )}
      </section>
    </div>
  )
}
