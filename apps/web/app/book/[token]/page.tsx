import { Card, CardDescription, CardHeader, CardTitle } from '@atlas/ui'
import { generateAvailableSlots, getPublicBookingContext } from '@atlas/meetings'
import { PublicBookingForm } from '@/components/features/meetings/public-booking-form'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface PublicBookingPageProps {
  params: Promise<{ token: string }>
}

export default async function PublicBookingPage({ params }: PublicBookingPageProps) {
  const { token } = await params
  const supabase = await createClient()

  try {
    const context = await getPublicBookingContext(supabase, token)

    let existingMeetings: { scheduledStart: Date; scheduledEnd: Date }[] = []

    try {
      const serviceClient = createServiceClient()
      const { data: link } = await serviceClient
        .from('booking_links')
        .select('organization_id')
        .eq('token', token)
        .maybeSingle()

      if (link) {
        const { data: meetings } = await serviceClient
          .from('meetings')
          .select('scheduled_start, scheduled_end')
          .eq('organization_id', link.organization_id)
          .in('status', ['scheduled', 'confirmed'])
          .gte('scheduled_start', new Date().toISOString())

        existingMeetings =
          meetings?.map((meeting) => ({
            scheduledStart: new Date(meeting.scheduled_start),
            scheduledEnd: new Date(meeting.scheduled_end),
          })) ?? []
      }
    } catch {
      existingMeetings = []
    }

    const slots = generateAvailableSlots(context, existingMeetings)

    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Book a meeting</CardTitle>
            <CardDescription>
              {context.organizationName}
              {context.companyName ? ` · ${context.companyName}` : ''}
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <PublicBookingForm
              token={token}
              slots={slots}
              defaultName={context.contactName ?? undefined}
            />
          </div>
        </Card>
      </div>
    )
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Booking link unavailable</CardTitle>
            <CardDescription>This link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
}
