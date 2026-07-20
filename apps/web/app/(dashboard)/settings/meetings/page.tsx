import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { getBookingUrl } from '@atlas/meetings'
import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { loadMeetingSettings } from '@/app/actions/meetings'
import { AvailabilityForm } from '@/components/features/meetings/availability-form'
import { ConnectCalendarForm } from '@/components/features/meetings/connect-calendar-form'
import { CreateBookingLinkForm } from '@/components/features/meetings/create-booking-link-form'
import { createClient } from '@/lib/supabase/server'
import { requireOrganizationContext } from '@/lib/auth/session'

export default async function MeetingSettingsPage() {
  const { activeOrganization } = await requireOrganizationContext()
  const enabled = isFeatureEnabled('meetingBooking', { organizationId: activeOrganization.id })

  if (!enabled) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Card>
          <CardHeader>
            <CardTitle>Meetings disabled</CardTitle>
            <CardDescription>
              Set FF_MEETING_BOOKING=true to configure meeting booking.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { availability, calendar } = await loadMeetingSettings()
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('organization_id', activeOrganization.id)
    .order('name')
    .limit(50)

  const bookingUrl = getBookingUrl()

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <Link href="/meetings" className="text-muted-foreground text-sm hover:underline">
          ← Back to meetings
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Meeting settings</h1>
        <p className="text-muted-foreground">
          Calendly powers live booking. Outreach emails include this link automatically.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Booking link (Calendly)</h2>
        <p className="text-muted-foreground text-sm">
          Share this URL in outreach or use the <code>{'{{booking_link}}'}</code> token in
          templates.
        </p>
        <code className="bg-muted/40 block break-all rounded-md border p-3 text-sm">
          {bookingUrl}
        </code>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm font-medium hover:underline"
        >
          Open Calendly page →
        </a>
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">Calendar connection</h2>
          <p className="text-muted-foreground text-sm">
            {calendar
              ? `Connected: ${calendar.external_account_email}`
              : 'Optional — Calendly handles scheduling for live bookings.'}
          </p>
        </div>
        <ConnectCalendarForm />
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Availability (internal tracking)</h2>
        <AvailabilityForm
          timezone={availability.timezone}
          slotDurationMinutes={availability.slotDurationMinutes}
          minNoticeHours={availability.minNoticeHours}
        />
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Track outreach context</h2>
        <p className="text-muted-foreground text-sm">
          Optionally link a company when generating tracked booking references.
        </p>
        <CreateBookingLinkForm companies={companies ?? []} />
      </section>
    </div>
  )
}
