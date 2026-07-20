import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function MeetingsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('meetingBooking', { organizationId: activeOrganization.id })
  const supabase = await createClient()

  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, title, attendee_name, attendee_email, scheduled_start, status')
    .eq('organization_id', activeOrganization.id)
    .order('scheduled_start', { ascending: true })

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Meetings disabled</CardTitle>
            <CardDescription>
              Enable <code>FF_MEETING_BOOKING=true</code> to schedule and track meetings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const upcoming =
    meetings?.filter((meeting) => new Date(meeting.scheduled_start) >= new Date()) ?? []
  const past = meetings?.filter((meeting) => new Date(meeting.scheduled_start) < new Date()) ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Meetings</p>
          <h1 className="text-3xl font-bold tracking-tight">Scheduled meetings</h1>
          <p className="text-muted-foreground">Upcoming conversations with engaged leads.</p>
        </div>
        <Link
          href="/settings/meetings"
          className="text-primary text-sm font-medium hover:underline"
        >
          Meeting settings →
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming meetings.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {upcoming.map((meeting) => (
              <li key={meeting.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <Link href={`/meetings/${meeting.id}`} className="font-medium hover:underline">
                    {meeting.title}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    {meeting.attendee_name} · {meeting.attendee_email}
                  </p>
                </div>
                <span className="text-muted-foreground text-sm">
                  {new Date(meeting.scheduled_start).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Past</h2>
          <ul className="divide-y rounded-lg border">
            {past.map((meeting) => (
              <li key={meeting.id} className="flex items-center justify-between gap-4 p-4">
                <Link href={`/meetings/${meeting.id}`} className="font-medium hover:underline">
                  {meeting.title}
                </Link>
                <span className="text-muted-foreground text-sm">
                  {new Date(meeting.scheduled_start).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
