import Link from 'next/link'
import { isFeatureEnabled } from '@atlas/config'
import { buildBookingUrl } from '@atlas/meetings'
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

  const { availability, calendar, links } = await loadMeetingSettings()
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('organization_id', activeOrganization.id)
    .order('name')
    .limit(50)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <Link href="/meetings" className="text-muted-foreground text-sm hover:underline">
          ← Back to meetings
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Meeting settings</h1>
        <p className="text-muted-foreground">
          Connect your calendar, set availability, and create booking links for outreach emails.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">Calendar connection</h2>
          <p className="text-muted-foreground text-sm">
            {calendar
              ? `Connected: ${calendar.external_account_email}`
              : 'No calendar connected yet (mock OAuth for M6).'}
          </p>
        </div>
        <ConnectCalendarForm />
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Availability</h2>
        <AvailabilityForm
          timezone={availability.timezone}
          slotDurationMinutes={availability.slotDurationMinutes}
          minNoticeHours={availability.minNoticeHours}
        />
      </section>

      <section className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Booking links</h2>
        <p className="text-muted-foreground text-sm">
          Embed <code>{'{{booking_link}}'}</code> in outreach templates or paste a generated URL.
        </p>
        <CreateBookingLinkForm companies={companies ?? []} />
        {links.length > 0 ? (
          <ul className="divide-y rounded-md border text-sm">
            {links.map((link) => (
              <li key={link.id} className="flex flex-col gap-1 p-3">
                <span className="font-medium">{link.label ?? 'Booking link'}</span>
                <code className="text-muted-foreground break-all">
                  {buildBookingUrl(baseUrl, link.token)}
                </code>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
